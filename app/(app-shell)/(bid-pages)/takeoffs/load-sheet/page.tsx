"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { TableSearchBar } from "@/components/TableSearchBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { SignOrderView } from "@/types/SignOrderView";
import { useLoading } from "@/hooks/use-loading";
import { useTableSearchState } from "@/hooks/use-table-search-state";
import { FilterOption } from "@/components/table-controls";
import { toast } from "sonner";
import { ConfirmArchiveDialog } from "@/components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useCustomers } from "@/hooks/use-customers";
import { fetchReferenceData } from "@/lib/api-client";
import { formatDate } from "@/lib/formatUTCDate";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ClipboardList, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { IconPlus, IconX } from "@tabler/icons-react";

const SIGN_ORDER_COLUMNS = [
  { key: "order_number", title: "Order Number" },
  { key: "order_type", title: "Type" }, // Computed field  
  { key: "requestor", title: "Requestor" },  
  { key: "branch", title: "Branch" }, // Computed field  
  { key: 'order_status', title: "Order Status"},
  { key: "shop_status", title: "Build Status" },
  { key: "assigned_to", title: "Assigned to" },
  { key: "customer", title: "Customer" }, // Computed field
  { key: "contract_number", title: "Contract Number" },
  { key: "job_number", title: "Job Number" },
  { key: "order_date", title: "Order date" },  
  { key: "need_date", title: "Need date" },
  { key: 'target_date', title: 'Target Date' },
  { key: 'created_at', title: 'Created At'}
];

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Hatfield", value: "hatfield" },
  { label: "Turbotville", value: "turbotville" },
  { label: "Bedford", value: "bedford" },
  { label: "Archived", value: "archived" },
];

export default function SignOrderPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SignOrderView[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [activeSegment, setActiveSegment] = useState("all");
  const [branchCounts, setBranchCounts] = useState({
    all: 0,
    hatfield: 0,
    turbotville: 0,
    bedford: 0,
    archived: 0
  });

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState<string | undefined>("created_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtering state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  // Selected rows state
  const [selectedRows, setSelectedRows] = useState<SignOrderView[]>([]);
  const [allRowsSelected, setAllRowsSelected] = useState<boolean>(false);

  // Archive/Delete dialog states
  const [showArchiveDialog, setShowArchiveDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const {
    search: loadSheetSearch,
    setSearch: setLoadSheetSearch,
    debouncedSearch: debouncedLoadSheetSearch,
  } = useTableSearchState();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Reference for table row selection reset
  const tableRef = useRef<{ resetRowSelection: () => void }>(null);

  // Reference data for dropdowns and filters
  const [referenceData, setReferenceData] = useState<{
    customers: { id: number; display_name: string }[];
    requestors: string[];
    assignees: string[];
  }>({
    customers: [],
    requestors: [],
    assignees: []
  });

  // Define filter options
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

  const { startLoading, stopLoading } = useLoading();

  const { customers, getCustomers } = useCustomers();

  useEffect(() => {
    getCustomers();
  }, [getCustomers])

  // Fetch reference data for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      try {

        // Get unique requestors and assignees from sign orders
        const ordersResponse = await fetch('/api/sign-shop-orders?page=1&limit=1000');
        const ordersData = await ordersResponse.json();
        const users = await fetchReferenceData('users');
        
        let uniqueAssignees: string[] = [];
        
        if (ordersData.success && ordersData.orders) {
          uniqueAssignees = [...new Set(ordersData.orders.map((order: any) => order.assigned_to).filter(Boolean))] as string[];
        }

        setReferenceData({
          customers: customers.filter(c => !!c.id && !!c.displayName).map(c => ({id: c.id, display_name: c.displayName })),
          requestors: users.map(u => u.name),
          assignees: uniqueAssignees
        });
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    fetchFilterData();
  }, [customers]);

  // Initialize filter options when reference data is loaded
  useEffect(() => {
    const options: FilterOption[] = [
      {
        label: 'Customer',
        field: 'customer',
        options: referenceData.customers.map(customer => ({
          label: customer.display_name,
          value: customer.display_name
        }))
      },
      {
        label: 'Requestor',
        field: 'requestor',
        options: referenceData.requestors.map(requestor => ({
          label: requestor,
          value: requestor
        }))
      },
      {
        label: 'Branch',
        field: 'branch',
        options: [
          { label: 'Hatfield', value: 'hatfield' },
          { label: 'Turbotville', value: 'turbotville' },
          { label: 'Bedford', value: 'bedford' }
        ]
      },
      {
        label: 'Shop Status',
        field: 'shop_status',
        options: [
          { label: 'Not Started', value: 'not-started' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Complete', value: 'complete' },
          { label: 'On Hold', value: 'on-hold' }
        ]
      },
      {
        label: 'Status',
        field: 'status',
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
        ]
      },
      {
        label: 'Assigned To',
        field: 'assigned_to',
        options: referenceData.assignees.map(assignee => ({
          label: assignee,
          value: assignee
        }))
      },
      {
        label: 'Order Type',
        field: 'order_type',
        options: [
          { label: 'Rental', value: 'R' },
          { label: 'Sale', value: 'S' },
          { label: 'Permanent Signs', value: 'P' },
          { label: 'Multiple', value: 'M' }
        ]
      }
    ];
    setFilterOptions(options);
  }, [referenceData]);

  // Fetch quotes with enhanced parameters
  const fetchQuotes = useCallback(async () => {
    setIsTableLoading(true);

    try {
      const params = new URLSearchParams();

      // Add pagination
      params.append("page", (pageIndex + 1).toString());
      params.append("limit", pageSize.toString());
      params.append('includeDrafts', 'true')

      // Add sorting
      if (sortBy) {
        params.append("orderBy", sortBy);
        params.append("ascending", sortOrder === 'asc' ? 'true' : 'false');
      }

      if (debouncedLoadSheetSearch.trim()) {
        params.append("search", debouncedLoadSheetSearch.trim());
      }

      // FIXED: Add archived parameter handling like in active-bids
      if (activeSegment === "archived") {
        params.append("archived", "true");
      } else {
        // For non-archived segments, explicitly exclude archived items
        params.append("archived", "false");

        // Add segment filter for branches
        if (activeSegment !== "all") {
          params.append("branch", activeSegment);
        }
      }

      // Add active filters
      if (Object.keys(activeFilters).length > 0) {
        params.append("filters", JSON.stringify(activeFilters));
      }

      if (dateRange?.from) {
        params.append("startDate", dateRange.from.toISOString().split("T")[0]);
      }
      if (dateRange?.to) {
        params.append("endDate", dateRange.to.toISOString().split("T")[0]);
      }

      const response = await fetch(`/api/sign-shop-orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // Make sure we're using the correct field name from the API response
        if (data.orders && Array.isArray(data.orders)) {
          console.log('Orders found in response:', data.orders.length);

          // Map the orders to ensure they have all required fields
          const processedOrders = data.orders.map((order: any) => ({
            ...order,
            // Ensure these fields exist with default values if missing
            customer: order.customer || '-',
            branch: order.branch || '-',
            assigned_to: order.assigned_to || 'Unassigned',
            type: order.type || '-',
            shop_status: order.shop_status || 'not-started',
            order_type: order.order_type || '-',
            order_number: order.order_number == null ? '' : order.order_number,
            order_status: order.order_number == null ? 'DRAFT': 'SUBMITTED',
            target_date: order.target_date ? formatDate(order.target_date) : '-',
          }));

          setQuotes(processedOrders);
          console.log('Processed quotes:', processedOrders.length);
        } else {
          console.warn('No orders array in response or empty array');
          setQuotes([]);
        }

        setTotalCount(data.pagination?.total || 0);
        setPageCount(data.pagination?.pages || 0);
      } else {
        console.error("Error fetching sign orders:", data.error);
        toast.error("Failed to load sign orders");
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast.error("Failed to load sign orders");
    } finally {
      setIsTableLoading(false);
    }
  }, [activeSegment, pageIndex, pageSize, sortBy, sortOrder, activeFilters, dateRange?.from, dateRange?.to, debouncedLoadSheetSearch]);

  // Fetch counts for each segment
  const fetchCounts = useCallback(async () => {
    try {
      const countParams = new URLSearchParams();
      countParams.append("counts", "true");
      countParams.append("includeDrafts", "true");
      if (debouncedLoadSheetSearch.trim()) {
        countParams.append("search", debouncedLoadSheetSearch.trim());
      }
      if (dateRange?.from) {
        countParams.append("startDate", dateRange.from.toISOString().split("T")[0]);
      }
      if (dateRange?.to) {
        countParams.append("endDate", dateRange.to.toISOString().split("T")[0]);
      }
      const segmentResponse = await fetch(`/api/sign-shop-orders?${countParams.toString()}`);
      const segmentData = await segmentResponse.json();

      if (segmentData.success) {
        setBranchCounts({
          all: segmentData.counts.all || 0,
          hatfield: segmentData.counts.hatfield || 0,
          turbotville: segmentData.counts.turbotville || 0,
          bedford: segmentData.counts.bedford || 0,
          archived: segmentData.counts.archived || 0
        });
      } else {
        console.error("Error fetching segment counts:", segmentData.error);
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, [dateRange?.from, dateRange?.to, debouncedLoadSheetSearch]);

  // Handle segment change
  const handleSegmentChange = useCallback((value: string) => {
    setActiveSegment(value);
    setPageIndex(0);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filters: Record<string, string[]>) => {
    setActiveFilters(filters);
    setPageIndex(0);
  }, []);

  // Archive selected sign orders
  const handleArchiveSelected = useCallback(async (rows: SignOrderView[]) => {
    try {
      startLoading();
      
      let ordersToArchive: SignOrderView[] = [];

      if (allRowsSelected) {
        // Fetch all filtered orders for archiving
        ordersToArchive = await fetchAllFilteredOrders();
        // Filter out already archived orders
        ordersToArchive = ordersToArchive.filter(order => 
          !order.archived
        );
      } else {
        // Filter out already archived orders from selection
        ordersToArchive = rows.filter(order => 
          !order.archived
        );
      }

      if (ordersToArchive.length === 0) {
        toast.error('No orders to archive. All selected orders are already archived.');
        return false;
      }

      const ids = ordersToArchive.map(order => order.id);
      
      const response = await fetch('/api/sign-orders/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully archived ${ordersToArchive.length} sign order(s)`);
        await fetchQuotes();
        await fetchCounts();
        
        // Reset row selection after successful archive
        if (tableRef.current) {
          tableRef.current.resetRowSelection();
        }
        
        return true;
      } else {
        throw new Error(result.message || 'Failed to archive sign orders');
      }
    } catch (error) {
      console.error('Error archiving sign orders:', error);
      toast.error('Failed to archive sign orders. Please try again.');
      return false;
    } finally {
      stopLoading();
    }
  }, [allRowsSelected, fetchQuotes, fetchCounts, startLoading, stopLoading]);

  console.log('los quotes sonnnn', quotes);
  
  // Delete selected sign orders
  const handleDeleteSelected = useCallback(async (rows: SignOrderView[]) => {
    try {
      startLoading();
      
      let ordersToDelete: SignOrderView[] = [];

      if (allRowsSelected) {
        // Fetch all filtered orders for deletion
        const allOrders = await fetchAllFilteredOrders();
        // For deletion, we only want archived orders
        ordersToDelete = allOrders.filter(order =>
          activeSegment === 'archived' || order.archived
        );
      } else {
        // Filter for archived orders from selection
        if (activeSegment === 'archived') {
          // If we're in archived segment, all selected orders can be deleted
          ordersToDelete = rows;
        } else {
          // If we're not in archived segment, only delete actually archived orders
          ordersToDelete = rows.filter(order => order.archived);
        }
      }

      if (ordersToDelete.length === 0) {
        toast.error('No archived sign orders found to delete.');
        return false;
      }

      const ids = ordersToDelete.map(order => order.id);
      
      const response = await fetch('/api/sign-orders/archive', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully deleted ${ordersToDelete.length} sign order(s)`);
        await fetchQuotes();
        await fetchCounts();
        
        // Reset row selection after successful deletion
        if (tableRef.current) {
          tableRef.current.resetRowSelection();
        }
        
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete sign orders');
      }
    } catch (error) {
      console.error('Error deleting sign orders:', error);
      toast.error('Failed to delete sign orders. Please try again.');
      return false;
    } finally {
      stopLoading();
    }
  }, [activeSegment, allRowsSelected, fetchQuotes, fetchCounts, startLoading, stopLoading]);

  // Fetch all filtered orders (for bulk operations)
  const fetchAllFilteredOrders = async (): Promise<SignOrderView[]> => {
    const params = new URLSearchParams();
    
    // Get all records
    params.append("page", "1");
    params.append("limit", totalCount.toString() || "10000");
    if (debouncedLoadSheetSearch.trim()) {
      params.append("search", debouncedLoadSheetSearch.trim());
    }

    // Apply current filters
    if (Object.keys(activeFilters).length > 0) {
      params.append("filters", JSON.stringify(activeFilters));
    }

    // Apply current segment filter
    if (activeSegment === "archived") {
      params.append("archived", "true");
    } else if (activeSegment !== "all") {
      params.append("archived", "false");
      params.append("branch", activeSegment);
    }

    // Apply current sorting
    if (sortBy) {
      params.append("orderBy", sortBy);
      params.append("ascending", sortOrder === 'asc' ? 'true' : 'false');
    }

    const response = await fetch(`/api/sign-shop-orders?${params.toString()}`);
    const data = await response.json();

    if (data.success && data.orders) {
      return data.orders.map((order: any) => ({
        ...order,
        customer: order.customer || '-',
        branch: order.branch || '-',
        assigned_to: order.assigned_to || 'Unassigned',
        type: order.type || '-',
        order_status: order.order_number == null ? 'DRAFT' : 'SUBMITTED',
        shop_status: order.shop_status === 'not-started' ? 'Not Started' : 
                    order.shop_status === 'in-progress' ? 'In Progress' : 
                    order.shop_status === 'complete' ? 'Complete' : 
                    order.shop_status === 'on-hold' ? 'On Hold' : 
                    order.shop_status || 'Not Started',
        order_type: order.order_type || '-',
        order_number: order.order_number == null ? '' : order.order_number,
      }));
    }
    
    return [];
  };

  // Initiate archive dialog
  const initiateArchiveOrders = useCallback((selectedOrders: SignOrderView[]) => {
    setSelectedRows(selectedOrders);
    setShowArchiveDialog(true);
  }, []);

  // Initiate delete dialog
  const initiateDeleteOrders = useCallback((selectedOrders: SignOrderView[]) => {
    setSelectedRows(selectedOrders);
    setShowDeleteDialog(true);
  }, []);

  // Handle archive confirmation
  const handleArchive = useCallback(async () => {
    const success = await handleArchiveSelected(selectedRows);
    if (success) {
      setShowArchiveDialog(false);
    }
  }, [selectedRows, handleArchiveSelected]);

  // Handle delete confirmation
  const handleDelete = useCallback(async () => {
    const success = await handleDeleteSelected(selectedRows);
    if (success) {
      setShowDeleteDialog(false);
    }
  }, [selectedRows, handleDeleteSelected]);

  // Load data when dependencies change
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Load counts when segment changes
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, activeSegment]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedLoadSheetSearch]);

  const handleRowClick = useCallback((quote: SignOrderView) => {
    // Navigate to the sign order detail page when clicking a row
    router.push(`/takeoffs/sign-order/view/${quote.id}`);
  }, [router]);

  // Handle view details action
  const handleViewDetails = useCallback((row: SignOrderView) => {
    router.push(`/takeoffs/sign-order/view/${row.id}`);
  }, [router]);

  // Handle edit action
  const handleEdit = useCallback((row: SignOrderView) => {
    router.push(`/takeoffs/sign-order/${row.id}/edit`);
  }, [router]);

  // Segments are static, counts handled by DataTable

  const handleUnarchiveSignOrder = useCallback(async (item: SignOrderView) => {
    try {
      startLoading();
      const response = await fetch('/api/sign-orders/unarchive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [item.id] }),
      });
      if (!response.ok) throw new Error('Failed to unarchive sign order');
      toast.success('Sign order unarchived successfully');
      await fetchQuotes();
      await fetchCounts();
    } catch (error) {
      console.error('Error unarchiving sign order:', error);
      toast.error('Failed to unarchive sign order');
    } finally {
      stopLoading();
    }
  }, [fetchQuotes, fetchCounts, startLoading, stopLoading]);

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDateRange(selectedDate);
    if (!selectedDate || (selectedDate.from && selectedDate.to)) {
      setCalendarOpen(false);
    }
  };

  const handleClearDateRange = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDateRange(undefined);
  };

  const handleRefresh = useCallback(async () => {
    await fetchCounts();
    await fetchQuotes();
  }, [fetchCounts, fetchQuotes]);

  const dateLabel = useMemo(() => {
    const today = new Date();
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "LLL d, y")} - ${format(dateRange.to, "LLL d, y")}`;
    }
    if (dateRange?.from) {
      return `${format(dateRange.from, "LLL d, y")} - ${format(today, "LLL d, y")}`;
    }
    return `Jan 1, ${today.getFullYear()} - ${format(today, "LLL d, y")}`;
  }, [dateRange]);

  return (
    <>
      <ConfirmArchiveDialog
        isOpen={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        onConfirm={handleArchive}
        itemCount={allRowsSelected ? totalCount : selectedRows.length}
        itemType="sign order"
      />

      <ConfirmDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        itemCount={allRowsSelected ? totalCount : selectedRows.length}
        itemType="sign order"
      />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-11 z-30 shrink-0 border-b bg-card">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary p-2 text-primary-foreground shadow-sm">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground">Sign Order List</h1>
                <p className="text-xs text-muted-foreground">
                  {totalCount} sign order{totalCount === 1 ? "" : "s"} in the current view
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button size="sm" className="h-9 gap-2 font-semibold shadow-sm" onClick={() => router.push("/takeoffs/sign-order")}>
                <IconPlus className="h-4 w-4" />
                Create Sign Order
              </Button>
            </div>
          </div>
        </header>

        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex items-center justify-end gap-2">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal relative bg-card shadow-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <span className="flex items-center justify-between w-full">
                            <span>{format(dateRange.from, "LLL d, y")} - {format(dateRange.to, "LLL d, y")}</span>
                            <span onClick={handleClearDateRange} className="ml-2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted">
                              <IconX className="h-3 w-3" />
                            </span>
                          </span>
                        ) : (
                          <span>{format(dateRange.from, "LLL d, y")} - {format(new Date(), "LLL d, y")}</span>
                        )
                      ) : (
                        <span>{dateLabel}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      key={`${dateRange?.from?.getTime()}-${dateRange?.to?.getTime()}-load-sheet`}
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateSelect}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" size="sm" className="gap-2 font-semibold shadow-sm" onClick={handleRefresh}>
                  <RefreshCw className={`h-4 w-4 ${isTableLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            <div className="px-4 lg:px-6">
              <TableSearchBar
                value={loadSheetSearch}
                onChange={setLoadSheetSearch}
                placeholder="Search sign orders..."
              />
            </div>

            <DataTable<SignOrderView>
              data={quotes}
              isLoading={isTableLoading}
              columns={SIGN_ORDER_COLUMNS}
              variant="job-list"
              segmentsVariant="productivity"
              segments={SEGMENTS}
              segmentValue={activeSegment}
              segmentCounts={branchCounts}
              onSegmentChange={handleSegmentChange}
              onRowClick={handleRowClick}
              stickyLastColumn
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onArchive={(row) => initiateArchiveOrders([row])}
              // Selection props
              onArchiveSelected={initiateArchiveOrders}
              onDeleteSelected={initiateDeleteOrders}
              tableRef={tableRef}
              setSelectedRows={setSelectedRows}
              allRowsSelected={allRowsSelected}
              onAllRowsSelectedChange={setAllRowsSelected}
              // Pagination props
              pageCount={pageCount}
              pageIndex={pageIndex}
              pageSize={pageSize}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              // Sorting props
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(column, order) => {
                setSortBy(column);
                setSortOrder(order);
              }}
              // Filter props
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
              totalCount={totalCount}
              // Additional filter props for sign orders
              hideDropdown={true}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onUnarchive={handleUnarchiveSignOrder}
            />
          </div>
        </div>
      </div>
    </>
  );
}
