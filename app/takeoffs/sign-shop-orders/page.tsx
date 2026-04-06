"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { SignOrderView } from "@/types/SignOrderView";
import { useLoading } from "@/hooks/use-loading";
import { FilterOption } from "@/components/table-controls";
import { toast } from "sonner";
import { IconPlus, IconX } from "@tabler/icons-react";
import { ConfirmArchiveDialog } from "@/components/confirm-archive-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useCustomers } from "@/hooks/use-customers";
import { fetchReferenceData } from "@/lib/api-client";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Factory, RefreshCw, Search, Calendar as CalendarIcon } from "lucide-react";

const SIGN_ORDER_COLUMNS = [
  { key: "order_number", title: "Order Number" },
  { key: "requestor", title: "Requestor" },
  { key: "branch", title: "Branch" },
  { key: "customer", title: "Customer" },
  { key: "order_date", title: "Order date" },
  { key: "need_date", title: "Need date" },
  { key: "order_type", title: "Type" },
  { key: "assigned_to", title: "Assigned to" },
  { key: "contract_number", title: "Contract Number" },
  { key: "job_number", title: "Job Number" },
  { key: "shop_status", title: "Build Status" },
  { key: "created_at", title: "Created At" }
];

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Not started", value: "not-started" },
  { label: "In Process", value: "in-process" },
  { label: "On Order", value: "on-order" },
  { label: "Complete", value: "complete" },
  { label: "Archived", value: "archived" },
];

export default function SignOrderPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SignOrderView[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [activeSegment, setActiveSegment] = useState("all");
  const [segmentCounts, setSegmentCounts] = useState({
    all: 0,
    "not-started": 0,
    "in-process": 0,
    "on-order": 0,
    complete: 0,
    archived: 0,
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [selectedRows, setSelectedRows] = useState<SignOrderView[]>([]);
  const [allRowsSelected, setAllRowsSelected] = useState<boolean>(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [signShopSearch, setSignShopSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const tableRef = useRef<{ resetRowSelection: () => void }>(null);
  const [referenceData, setReferenceData] = useState<{
    customers: { id: number; display_name: string }[];
    requestors: string[];
    assignees: string[];
  }>({
    customers: [],
    requestors: [],
    assignees: []
  });
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const { startLoading, stopLoading } = useLoading();
  const { customers, getCustomers } = useCustomers();

  useEffect(() => {
    getCustomers();
  }, [getCustomers]);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const ordersResponse = await fetch("/api/sign-shop-orders?page=1&limit=1000");
        const ordersData = await ordersResponse.json();
        const users = await fetchReferenceData("users");

        let uniqueAssignees: string[] = [];
        if (ordersData.success && ordersData.orders) {
          uniqueAssignees = [...new Set(ordersData.orders.map((order: any) => order.assigned_to).filter(Boolean))] as string[];
        }

        setReferenceData({
          customers: customers.filter(c => !!c.id && !!c.displayName).map(c => ({ id: c.id, display_name: c.displayName })),
          requestors: users.map(u => u.name),
          assignees: uniqueAssignees
        });
      } catch (error) {
        console.error("Error fetching reference data:", error);
      }
    };

    fetchFilterData();
  }, [customers]);

  useEffect(() => {
    const options: FilterOption[] = [
      {
        label: "Customer",
        field: "customer",
        options: referenceData.customers.map(customer => ({
          label: customer.display_name,
          value: customer.display_name
        }))
      },
      {
        label: "Requestor",
        field: "requestor",
        options: referenceData.requestors.map(requestor => ({
          label: requestor,
          value: requestor
        }))
      },
      {
        label: "Branch",
        field: "branch",
        options: [
          { label: "Hatfield", value: "hatfield" },
          { label: "Turbotville", value: "turbotville" },
          { label: "Bedford", value: "bedford" }
        ]
      },
      {
        label: "Shop Status",
        field: "shop_status",
        options: [
          { label: "Not Started", value: "not-started" },
          { label: "In Process", value: "in-process" },
          { label: "On Order", value: "on-order" },
          { label: "Complete", value: "complete" },
          { label: "On Hold", value: "on-hold" }
        ]
      },
      {
        label: "Assigned To",
        field: "assigned_to",
        options: referenceData.assignees.map(assignee => ({
          label: assignee,
          value: assignee
        }))
      },
      {
        label: "Order Type",
        field: "order_type",
        options: [
          { label: "Rental", value: "R" },
          { label: "Sale", value: "S" },
          { label: "Permanent Signs", value: "P" },
          { label: "Multiple", value: "M" }
        ]
      }
    ];
    setFilterOptions(options);
  }, [referenceData]);

  const buildDateParams = () => {
    const params: { startDate?: string; endDate?: string } = {};
    if (dateRange?.from) params.startDate = dateRange.from.toISOString().split("T")[0];
    if (dateRange?.to) params.endDate = dateRange.to.toISOString().split("T")[0];
    return params;
  };

  const fetchQuotes = useCallback(async () => {
    setIsTableLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("page", (pageIndex + 1).toString());
      params.append("limit", pageSize.toString());

      if (sortBy) {
        params.append("orderBy", sortBy);
        params.append("ascending", sortOrder === "asc" ? "true" : "false");
      }

      if (activeSegment === "archived") {
        params.append("archived", "true");
        if (Object.keys(activeFilters).length > 0) {
          params.append("filters", JSON.stringify(activeFilters));
        }
      } else if (activeSegment !== "all") {
        params.append("filters", JSON.stringify({ ...activeFilters, shop_status: [activeSegment] }));
      } else if (Object.keys(activeFilters).length > 0) {
        params.append("filters", JSON.stringify(activeFilters));
      }

      const dateParams = buildDateParams();
      if (dateParams.startDate) params.append("startDate", dateParams.startDate);
      if (dateParams.endDate) params.append("endDate", dateParams.endDate);

      const response = await fetch(`/api/sign-shop-orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (data.orders && Array.isArray(data.orders)) {
          const processedOrders = data.orders.map((order: any) => ({
            ...order,
            customer: order.customer || "-",
            branch: order.branch || "-",
            assigned_to: order.assigned_to || "Unassigned",
            type: order.type || "-",
            shop_status: order.shop_status || "",
            order_type: order.order_type || "-",
            order_number: order.order_number == null ? "" : order.order_number,
          }));

          setQuotes(processedOrders);
        } else {
          setQuotes([]);
        }

        setTotalCount(data.pagination?.total || 0);
        setPageCount(data.pagination?.pages || 0);
      } else {
        toast.error("Failed to load sign shop orders");
      }
    } catch (error) {
      toast.error("Failed to load sign shop orders");
    } finally {
      setIsTableLoading(false);
    }
  }, [activeSegment, pageIndex, pageSize, sortBy, sortOrder, activeFilters, dateRange?.from, dateRange?.to]);

  const fetchCounts = useCallback(async () => {
    try {
      const countParams = new URLSearchParams();
      countParams.append("counts", "true");
      const dateParams = buildDateParams();
      if (dateParams.startDate) countParams.append("startDate", dateParams.startDate);
      if (dateParams.endDate) countParams.append("endDate", dateParams.endDate);

      const response = await fetch(`/api/sign-shop-orders?${countParams.toString()}`);
      const data = await response.json();
      if (data.success) {
        setSegmentCounts({
          all: data.counts?.all || 0,
          "not-started": data.counts?.["not-started"] || 0,
          "in-process": data.counts?.["in-process"] || 0,
          "on-order": data.counts?.["on-order"] || 0,
          complete: data.counts?.complete || 0,
          archived: data.counts?.archived || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching segment counts:", error);
    }
  }, [dateRange?.from, dateRange?.to]);

  const handleSegmentChange = useCallback((value: string) => {
    setActiveSegment(value);
    setPageIndex(0);
  }, []);

  const handleFilterChange = useCallback((filters: Record<string, string[]>) => {
    setActiveFilters(filters);
    setPageIndex(0);
  }, []);

  const fetchAllFilteredOrders = async (): Promise<SignOrderView[]> => {
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("limit", totalCount.toString() || "10000");

    let filters = { ...activeFilters };
    if (activeSegment === "archived") {
      params.append("archived", "true");
    } else if (activeSegment !== "all") {
      filters = { ...filters, shop_status: [activeSegment] };
    }

    if (Object.keys(filters).length > 0) {
      params.append("filters", JSON.stringify(filters));
    }

    if (sortBy) {
      params.append("orderBy", sortBy);
      params.append("ascending", sortOrder === "asc" ? "true" : "false");
    }

    const dateParams = buildDateParams();
    if (dateParams.startDate) params.append("startDate", dateParams.startDate);
    if (dateParams.endDate) params.append("endDate", dateParams.endDate);

    const response = await fetch(`/api/sign-shop-orders?${params.toString()}`);
    const data = await response.json();

    if (data.success && data.orders) {
      return data.orders.map((order: any) => ({
        ...order,
        customer: order.customer || "-",
        branch: order.branch || "-",
        assigned_to: order.assigned_to || "Unassigned",
        type: order.type || "-",
        shop_status: order.shop_status || "",
        order_type: order.order_type || "-",
        order_number: order.order_number == null ? "" : order.order_number,
      }));
    }

    return [];
  };

  const handleArchiveSelected = useCallback(async (rows: SignOrderView[]) => {
    try {
      startLoading();
      let ordersToArchive: SignOrderView[] = [];
      if (allRowsSelected) {
        ordersToArchive = await fetchAllFilteredOrders();
        ordersToArchive = ordersToArchive.filter(order => !order.archived);
      } else {
        ordersToArchive = rows.filter(order => !order.archived);
      }
      if (ordersToArchive.length === 0) {
        toast.error("No orders to archive. All selected orders are already archived.");
        return false;
      }
      const ids = ordersToArchive.map(order => order.id);
      const response = await fetch("/api/sign-orders/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Successfully archived ${ordersToArchive.length} sign order(s)`);
        await fetchQuotes();
        await fetchCounts();
        tableRef.current?.resetRowSelection();
        return true;
      }
      throw new Error(result.message || "Failed to archive sign orders");
    } catch (error) {
      toast.error("Failed to archive sign orders. Please try again.");
      return false;
    } finally {
      stopLoading();
    }
  }, [allRowsSelected, fetchCounts, fetchQuotes, startLoading, stopLoading, totalCount, activeFilters, activeSegment, sortBy, sortOrder, dateRange?.from, dateRange?.to]);

  const handleDeleteSelected = useCallback(async (rows: SignOrderView[]) => {
    try {
      startLoading();
      let ordersToDelete: SignOrderView[] = [];
      if (allRowsSelected) {
        const allOrders = await fetchAllFilteredOrders();
        ordersToDelete = allOrders.filter(order => order.archived);
      } else {
        ordersToDelete = rows.filter(order => order.archived);
      }
      if (ordersToDelete.length === 0) {
        toast.error("No archived sign orders found to delete.");
        return false;
      }
      const ids = ordersToDelete.map(order => order.id);
      const response = await fetch("/api/sign-orders/archive", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Successfully deleted ${ordersToDelete.length} sign order(s)`);
        await fetchQuotes();
        await fetchCounts();
        tableRef.current?.resetRowSelection();
        return true;
      }
      throw new Error(result.message || "Failed to delete sign orders");
    } catch (error) {
      toast.error("Failed to delete sign orders. Please try again.");
      return false;
    } finally {
      stopLoading();
    }
  }, [allRowsSelected, fetchCounts, fetchQuotes, startLoading, stopLoading, totalCount, activeFilters, activeSegment, sortBy, sortOrder, dateRange?.from, dateRange?.to]);

  const initiateArchiveOrders = useCallback((selectedOrders: SignOrderView[]) => {
    setSelectedRows(selectedOrders);
    setShowArchiveDialog(true);
  }, []);

  const initiateDeleteOrders = useCallback((selectedOrders: SignOrderView[]) => {
    setSelectedRows(selectedOrders);
    setShowDeleteDialog(true);
  }, []);

  const handleArchive = useCallback(async () => {
    const success = await handleArchiveSelected(selectedRows);
    if (success) setShowArchiveDialog(false);
  }, [selectedRows, handleArchiveSelected]);

  const handleDelete = useCallback(async () => {
    const success = await handleDeleteSelected(selectedRows);
    if (success) setShowDeleteDialog(false);
  }, [selectedRows, handleDeleteSelected]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, activeSegment]);

  const handleRowClick = useCallback((row: SignOrderView) => {
    router.push(`/takeoffs/sign-order/${row.id}`);
  }, [router]);

  const handleViewDetails = useCallback((row: SignOrderView) => {
    router.push(`/takeoffs/sign-order/${row.id}`);
  }, [router]);

  const handleUnarchiveSignOrder = useCallback(async (item: SignOrderView) => {
    try {
      startLoading();
      const response = await fetch("/api/sign-orders/unarchive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [item.id] }),
      });
      if (!response.ok) throw new Error("Failed to unarchive sign order");
      toast.success("Sign order unarchived successfully");
      await fetchQuotes();
      await fetchCounts();
    } catch (error) {
      toast.error("Failed to unarchive sign order");
    } finally {
      stopLoading();
    }
  }, [fetchCounts, fetchQuotes, startLoading, stopLoading]);

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

  const summaryCards = useMemo(
    () => [
      { title: "Total Orders", value: String(segmentCounts.all || 0) },
      { title: "Not Started", value: String(segmentCounts["not-started"] || 0) },
      { title: "In Process", value: String(segmentCounts["in-process"] || 0) },
      { title: "On Order", value: String(segmentCounts["on-order"] || 0) },
      { title: "Complete", value: String(segmentCounts.complete || 0) },
    ],
    [segmentCounts]
  );

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
        <SiteHeader showTitleBlock={false} />

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

        <div className="flex flex-1 flex-col bg-[#F9FAFB]">
          <header className="sticky top-11 z-30 shrink-0 border-b bg-card">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary p-2 text-primary-foreground shadow-sm">
                  <Factory className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-foreground">Sign Shop Orders</h1>
                  <p className="text-xs text-muted-foreground">
                    {totalCount} sign shop order{totalCount === 1 ? "" : "s"} in the current view
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
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
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
                      key={`${dateRange?.from?.getTime()}-${dateRange?.to?.getTime()}-sign-shop-orders`}
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

              <SectionCards data={summaryCards} variant="productivity" />

              <div className="px-4 lg:px-6">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search sign shop orders..."
                    value={signShopSearch}
                    onChange={(e) => setSignShopSearch(e.target.value)}
                    className="h-9 border-border bg-card pl-9 shadow-sm"
                  />
                </div>
              </div>

              <DataTable<SignOrderView>
                data={quotes}
                isLoading={isTableLoading}
                columns={SIGN_ORDER_COLUMNS}
                variant="job-list"
                segmentsVariant="productivity"
                segments={SEGMENTS}
                segmentValue={activeSegment}
                segmentCounts={segmentCounts}
                onSegmentChange={handleSegmentChange}
                onRowClick={handleRowClick}
                stickyLastColumn
                onViewDetails={handleViewDetails}
                onArchiveSelected={initiateArchiveOrders}
                onDeleteSelected={initiateDeleteOrders}
                tableRef={tableRef}
                setSelectedRows={setSelectedRows}
                allRowsSelected={allRowsSelected}
                onAllRowsSelectedChange={setAllRowsSelected}
                pageCount={pageCount}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(column, order) => {
                  setSortBy(column);
                  setSortOrder(order);
                }}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                activeFilters={activeFilters}
                totalCount={totalCount}
                hideDropdown={true}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onUnarchive={handleUnarchiveSignOrder}
                enableSearch
                searchableColumns={["order_number", "requestor", "branch", "customer", "order_date", "need_date", "order_type", "assigned_to", "contract_number", "job_number", "shop_status", "created_at"]}
                searchValue={signShopSearch}
                onSearchChange={setSignShopSearch}
                showSearchBar={false}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
