"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { SignOrderView } from "@/types/SignOrderView";
import { useLoading } from "@/hooks/use-loading";
import { FilterOption } from "@/components/table-controls";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const SIGN_ORDER_COLUMNS = [
  { key: "order_number", title: "Order Number"},
  { key: "requestor", title: "Requestor" },
  { key: "shop_status", title: "Shop Status" },
  { key: "branch", title: "Branch" },
  { key: "customer", title: "Customer" },
  { key: "order_date", title: "Order date" },
  { key: "need_date", title: "Need date" },
  { key: "order_type", title: "Type" },
  { key: "assigned_to", title: "Assigned to" },
  { key: "contract_number", title: "Contract Number"},
  { key: "job_number", title: "Job Number" },
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
  const [sortBy, setSortBy] = useState<string | undefined>("order_date");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filtering state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  
  // Selected rows state
  const [selectedRows, setSelectedRows] = useState<SignOrderView[]>([]);

  // Reference data for dropdowns and filters
  const [referenceData, setReferenceData] = useState<{
    customers: { id: number; name: string }[];
    requestors: { id: number; name: string }[];
    branches: { id: number; name: string; code: string }[];
  }>({
    customers: [],
    requestors: [],
    branches: []
  });

  // Define filter options
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

  const { startLoading, stopLoading, isLoading } = useLoading();

  // Fetch reference data for filters
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch customers
        const customersResponse = await fetch('/api/reference-data?type=customers');
        const customersData = await customersResponse.json();

        // Requestors are fetched directly from sign orders data
        // No need for a separate API call

        // Fetch branches
        const branchesResponse = await fetch('/api/reference-data?type=branches');
        const branchesData = await branchesResponse.json();

        setReferenceData({
          customers: customersData.data || [],
          requestors: [], // We'll populate this from sign orders data if needed
          branches: branchesData.data || []
        });
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    fetchReferenceData();
  }, []);

  // Initialize filter options when reference data is loaded
  useEffect(() => {
    if (referenceData.customers.length > 0 || referenceData.requestors.length > 0) {
      const options: FilterOption[] = [
        {
          label: 'Customer',
          field: 'customer',
          options: referenceData.customers.map(customer => ({
            label: customer.name,
            value: customer.name
          }))
        },
        {
          label: 'Requestor',
          field: 'requestor',
          options: referenceData.requestors.map(requestor => ({
            label: requestor.name,
            value: requestor.name
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
        }
      ];
      setFilterOptions(options);
    }
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
      
      // Add segment filter
      if (activeSegment !== "all") {
        if (activeSegment === "archived") {
          params.append("branch", "archived"); // This will trigger archived status filter in API
        } else {
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
            shop_status: order.shop_status === 'not-started' ? 'Not Started' : order.shop_status,
            order_type: (() => {
              const typeCount = [order.rental, order.sale, order.perm_signs].filter(Boolean).length;
              if (typeCount > 1) return 'M';
              if (order.rental) return 'R';
              if (order.sale) return 'S';
              if (order.perm_signs) return 'P';
              return '-';
            })(),
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
    } finally {
      stopLoading();
    }
  }, [activeSegment, pageIndex, pageSize, sortBy, sortOrder, activeFilters, startLoading, stopLoading]);

  // Fetch counts for each segment
  const fetchCounts = useCallback(async () => {
    try {
      const segmentResponse = await fetch(`/api/sign-shop-orders?counts=true`);
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

  // Handle selected rows actions
  const handleArchiveSelected = useCallback(async (rows: SignOrderView[]) => {
    console.log('Archive selected rows:', rows);
    // Implement archive functionality here
    toast.success(`${rows.length} sign order(s) archived successfully`);
    // Refresh data after archiving
    fetchQuotes();
  }, [fetchQuotes]);
  
  const handleDeleteSelected = useCallback(async (rows: SignOrderView[]) => {
    console.log('Delete selected rows:', rows);
    // Implement delete functionality here
    toast.success(`${rows.length} sign order(s) deleted successfully`);
    // Refresh data after deleting
    fetchQuotes();
  }, [fetchQuotes]);
  
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
              {/* <button
                onClick={() => router.push('/takeoffs/new-load-sheet')}
                className="bg-white text-primary border border-primary hover:bg-primary/5 px-4 py-2 rounded-md text-sm font-medium"
              >
                Create load sheet
              </button>
              <button
                onClick={() => router.push('/takeoffs/new')}
                className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Takeoff
              </button> */}
            </div>
          </div>
        </SiteHeader>
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
                // Selection props
                onArchiveSelected={handleArchiveSelected}
                onDeleteSelected={handleDeleteSelected}
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
                totalCount={totalCount}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
