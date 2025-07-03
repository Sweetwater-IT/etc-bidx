"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { SignOrderView } from "@/types/SignOrderView";
import { useLoading } from "@/hooks/use-loading";
import { FilterOption } from "@/components/table-controls";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ConfirmArchiveDialog } from "@/components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useCustomers } from "@/hooks/use-customers";
import { fetchReferenceData } from "@/lib/api-client";

const SIGN_ORDER_COLUMNS = [
  { key: "order_number", title: "Order Number" },
  { key: "requestor", title: "Requestor" },
  { key: "shop_status", title: "Build Status" },
  { key: "branch", title: "Branch" }, // Computed field
  { key: "customer", title: "Customer" }, // Computed field
  { key: "order_date", title: "Order date" },
  { key: "need_date", title: "Need date" },
  { key: "order_type", title: "Type" }, // Computed field
  { key: "assigned_to", title: "Assigned to" },
  { key: "contract_number", title: "Contract Number" },
  { key: "job_number", title: "Job Number" },
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

  const { startLoading, stopLoading, isLoading } = useLoading();

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
    startLoading();

    try {
      const params = new URLSearchParams();

      // Add pagination
      params.append("page", (pageIndex + 1).toString());
      params.append("limit", pageSize.toString());

      // Add sorting
      if (sortBy) {
        params.append("orderBy", sortBy);
        params.append("ascending", sortOrder === 'asc' ? 'true' : 'false');
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
      stopLoading();
    }
  }, [activeSegment, pageIndex, pageSize, sortBy, sortOrder, activeFilters, startLoading, stopLoading]);

  // Fetch counts for each segment
  const fetchCounts = useCallback(async () => {
    try {
      const segmentResponse = await fetch(`/api/sign-shop-orders?counts=true&archived=false`);
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
  }, []);

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

  // Update segments with counts
  const segmentsWithCounts = SEGMENTS.map(segment => ({
    ...segment,
    label: `${segment.label.split(' (')[0]} (${branchCounts[segment.value as keyof typeof branchCounts] || 0})`
  }));

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

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold mt-2 ml-0">Sign Order List</h1>
            <div className="flex gap-3">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push('/takeoffs/sign-order')}
                  size="sm"
                >
                  <IconPlus className="h-4 w-4 -mr-[3px] mt-[2px]" />
                  Create sign order
                </Button>
              </div>
            </div>
          </div>
        </SiteHeader>
        
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
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-6 md:gap-6 md:py-12 px-4 md:px-6">
              <DataTable<SignOrderView>
                data={quotes}
                columns={SIGN_ORDER_COLUMNS}
                segments={segmentsWithCounts}
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
      </SidebarInset>
    </SidebarProvider>
  );
}