"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { CardActions } from "@/components/card-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { QuoteGridView } from "@/types/QuoteGridView";
import { useLoading } from "@/hooks/use-loading";
import { FilterOption } from "@/components/table-controls";
import { StatusTabs } from "@/components/ui/status-tabs";
import { toast } from "sonner";

const SIGN_ORDER_COLUMNS = [
  { key: "requestor", title: "Requestor" },
  { key: "customer", title: "Customer" },
  { key: "job_number", title: "Job Number" },
  { key: "contract_number", title: "Contract Number"},
  { key: "order_date", title: "Order date" },
  { key: "need_date", title: "Need date" },
  { key: "status", title: "Status", render: (row: any) => (
    <span className={`px-2 py-1 rounded-full text-xs ${row.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
      {row.status || 'N/A'}
    </span>
  )},
  { key: "type", title: "Type" },
  { key: "order_number", title: "Order Number" },
];

// Tabs for sign order status
const TABS = [
  { label: "Draft", value: "in-process" },
  { label: "Submitted", value: "completed" },
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
  const [quotes, setQuotes] = useState<QuoteGridView[]>([]);
  const [activeTab, setActiveTab] = useState("in-process");
  const [activeSegment, setActiveSegment] = useState("all");
  const [tabCounts, setTabCounts] = useState({
    "in-process": 0,
    completed: 0
  });
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

  // Reference data for dropdowns and filters
  const [referenceData, setReferenceData] = useState<{
    customers: { id: number; name: string }[];
    requestors: { id: number; name: string }[];
    branches: { id: number; name: string; code: string }[];
    types: { id: number; name: string }[];
  }>({
    customers: [],
    requestors: [],
    branches: [],
    types: []
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

        // Fetch requestors
        const requestorsResponse = await fetch('/api/reference-data?type=requestors');
        const requestorsData = await requestorsResponse.json();

        // Fetch branches
        const branchesResponse = await fetch('/api/reference-data?type=branches');
        const branchesData = await branchesResponse.json();

        // Fetch sign order types
        const typesResponse = await fetch('/api/reference-data?type=sign-order-types');
        const typesData = await typesResponse.json();

        setReferenceData({
          customers: customersData.data || [],
          requestors: requestorsData.data || [],
          branches: branchesData.data || [],
          types: typesData.data || []
        });
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    fetchReferenceData();
  }, [activeTab]);

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
          label: 'Type',
          field: 'type',
          options: referenceData.types.map(type => ({
            label: type.name,
            value: type.name
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

  // Options for filter dropdowns
  const branchOptions = referenceData.branches.map(branch => ({
    label: branch.name || '',
    value: branch.name?.toLowerCase() || ''
  }));

  const customerOptions = referenceData.customers.map(customer => ({
    label: customer.name,
    value: customer.name
  }));

  const requestorOptions = referenceData.requestors.map(requestor => ({
    label: requestor.name,
    value: requestor.name
  }));

  const typeOptions = referenceData.types.map(type => ({
    label: type.name,
    value: type.name
  }));

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
      
      // Add status filter based on active tab
      params.append("status", activeTab);
      
      // Add segment filter
      if (activeSegment !== "all") {
        if (activeSegment === "archived") {
          params.append("branch", "archived"); // This will trigger archived status filter in API
        }
        // Note: branch filtering is temporarily disabled since the sign_orders table
        // doesn't have a branch field yet. We'll re-enable this when the schema is updated.
      }
      
      // Add active filters
      if (Object.keys(activeFilters).length > 0) {
        params.append("filters", JSON.stringify(activeFilters));
      }

      const response = await fetch(`/api/sign-orders?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setQuotes(data.data || []);
        setTotalCount(data.totalCount || 0);
        setPageCount(data.pageCount || 0);
      } else {
        console.error("Error fetching sign orders:", data.error);
        toast.error("Failed to load sign orders");
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      stopLoading();
    }
  }, [activeTab, activeSegment, pageIndex, pageSize, sortBy, sortOrder, activeFilters, startLoading, stopLoading]);

  // Fetch counts for each tab and segment
  const fetchCounts = useCallback(async () => {
    try {
      // Fetch tab counts
      const tabResponse = await fetch('/api/sign-orders?counts=true&countBy=status');
      const tabData = await tabResponse.json();
      
      if (tabData.success) {
        setTabCounts({
          "in-process": tabData.counts["in-process"] || 0,
          completed: tabData.counts.completed || 0
        });
      } else {
        console.error("Error fetching tab counts:", tabData.error);
      }
      
      // Fetch segment counts filtered by active tab
      const segmentResponse = await fetch(`/api/sign-orders?counts=true&status=${activeTab}`);
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
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0); // Reset to first page
  };
  
  // Handle segment change
  const handleSegmentChange = (value: string) => {
    setActiveSegment(value);
    setPageIndex(0); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0); // Reset to first page
  };

  // Handle sorting changes
  const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
    console.log(`Sorting by ${column} ${direction}`);
    setSortBy(column);
    setSortOrder(direction);
    setPageIndex(0); // Reset to first page
  };

  // Handle filter changes
  const handleFilterChange = (filters: Record<string, string[]>) => {
    console.log('Applying filters:', filters);
    setActiveFilters(filters);
    setPageIndex(0); // Reset to first page
  };

  // Handle reset of all filters and sorts
  const handleResetControls = () => {
    console.log('Resetting all filters and sorts');
    setActiveFilters({});
    setSortBy("order_date");
    setSortOrder('desc');
    setPageIndex(0);
  };

  // Load data when dependencies change
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Load counts when tab or segment changes
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, activeTab, activeSegment]);

  const handleRowClick = (quote: QuoteGridView) => {
    router.push(`/takeoffs/sign-order/${quote.id}`);
  };

  // Use tabs without counts
  const tabsWithCounts = TABS;
  
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
              <button
                onClick={() => router.push('/takeoffs/new')}
                className="bg-white text-primary border border-primary hover:bg-primary/5 px-4 py-2 rounded-md text-sm font-medium"
              >
                Create sign order
              </button>
              <button
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
              </button>
            </div>
          </div>
        </SiteHeader>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">

              {/* Status Tabs */}
              <StatusTabs
                tabs={tabsWithCounts}
                value={activeTab}
                onChange={handleTabChange}
              />
              
              <DataTable<QuoteGridView>
                data={quotes}
                columns={SIGN_ORDER_COLUMNS}
                segments={segmentsWithCounts}
                segmentValue={activeSegment}
                segmentCounts={branchCounts}
                onSegmentChange={handleSegmentChange}
                onRowClick={handleRowClick}
                stickyLastColumn
                // Pagination props
                pageCount={pageCount}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                totalCount={totalCount}
                onArchive={() => {}}
                // Sorting props
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                // Filtering props
                filterOptions={filterOptions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onArchiveSelected={() => {}}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}