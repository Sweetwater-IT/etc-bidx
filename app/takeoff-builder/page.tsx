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

const SIGN_ORDER_COLUMNS = [
  { key: "requestor", title: "Requestor" },
  { key: "customer", title: "Customer" },
  { key: "job_number", title: "Job Number" },
  { key: "contract_number", title: "Contract Number"},
  { key: "order_date", title: "Order date" },
  { key: "need_date", title: "Need date" },
  { key: "type", title: "Type" },
  { key: "order_number", title: "Order Number" },
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
      
      // Add segment filter
      if (activeSegment !== "all") {
        if (activeSegment === "archived") {
          params.append("status", "archived");
        } else {
          params.append("branch", activeSegment);
        }
      }
      
      // Add active filters
      if (Object.keys(activeFilters).length > 0) {
        params.append("filters", JSON.stringify(activeFilters));
      }

      const response = await fetch(`/api/sign-orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setQuotes(data.data);
        setPageCount(data.pagination.pageCount);
        setTotalCount(data.pagination.totalCount);
      } else {
        console.error("Failed to fetch quotes:", data.error);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      stopLoading();
    }
  }, [activeSegment, pageIndex, pageSize, sortBy, sortOrder, activeFilters, startLoading, stopLoading]);

  // Fetch quote counts for segments
  const fetchQuoteCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/sign-orders?counts=true');
      const data = await response.json();
      
      if (data.success) {
        setBranchCounts({
          all: data.counts.all || 0,
          hatfield: data.counts.hatfield || 0,
          turbotville: data.counts.turbotville || 0,
          bedford: data.counts.bedford || 0,
          archived: data.counts.archived || 0
        });
      }
    } catch (error) {
      console.error("Error fetching quote counts:", error);
    }
  }, []);

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

  // Load counts on initial mount
  useEffect(() => {
    fetchQuoteCounts();
  }, [fetchQuoteCounts]);

  const handleRowClick = (quote: QuoteGridView) => {
    router.push(`/quotes/${quote.id}`);
  };

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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex items-center justify-between px-0 -mb-3">
                <CardActions
                  createButtonLabel="Create Sign Order"
                  onCreateClick={() => router.push('/takeoff-builder/create')}
                  hideCalendar
                  goUpActions
                  hideImportExport
                />
              </div>

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
                onReset={handleResetControls}
                onArchiveSelected={() => {}}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}