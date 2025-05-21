"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { CardActions } from "@/components/card-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuoteGridView } from "@/types/QuoteGridView";
import { useLoading } from "@/hooks/use-loading";

const QUOTES_COLUMNS = [
  { key: "requestor", title: "Requestor" },
  { key: "customer", title: "Customer" },
  { key: "order_date", title: "Order date" },
  { key: "need_date", title: "Need date" },
  { key: "job_type", title: "Job type" },
  { key: "sale", title: "Sale" },
  { key: "rental", title: "Rental" },
  { key: "job_number", title: "Job number" },
];

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Not started", value: "not-started" },
  { label: "In process", value: "in-process" },
  { label: "On order", value: "on-order" },
  { label: "Complete", value: "complete" },
];

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteGridView[]>([]);
  const [activeSegment, setActiveSegment] = useState("all");
  const [quoteCounts, setQuoteCounts] = useState({
    all: 0,
    not_started: 0,
    in_process: 0,
    on_order: 0,
    complete: 0
  });
  
  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const {startLoading, stopLoading, isLoading} = useLoading();

  // Fetch quotes
  const fetchQuotes = async (status = "all", page = 1, limit = 25) => {
    startLoading();

    try {
      const params = new URLSearchParams();
      if (status !== "all") {
        params.append("status", status);
      }
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      params.append("orderBy", "order_date");
      params.append("ascending", "false");
      params.append("detailed", "true");

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
  };

  // Fetch quote counts
  const fetchQuoteCounts = async () => {
    try {
      const response = await fetch('/api/quotes?counts=true');
      const data = await response.json();
      
      if (data) {
        setQuoteCounts({
          all: data.all || 0,
          not_started: data.not_started || 0,
          in_process: data.in_process || 0,
          on_order: data.on_order || 0,
          complete: data.complete || 0
        });
      }
    } catch (error) {
      console.error("Error fetching quote counts:", error);
    }
  };

  // Handle segment change
  const handleSegmentChange = (value: string) => {
    setActiveSegment(value);
    setPageIndex(0); // Reset to first page
    fetchQuotes(value, 1, pageSize);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
    fetchQuotes(activeSegment, newPage + 1, pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0); // Reset to first page
    fetchQuotes(activeSegment, 1, newSize);
  };

  // Initial data fetch
  useEffect(() => {
    fetchQuoteCounts();
    fetchQuotes();
  }, []);

  const handleRowClick = (quote: QuoteGridView) => {
    router.push(`/quotes/${quote.id}`);
  };

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
                  onCreateClick={() => router.push('/sign-order/create')}
                  hideCalendar
                  goUpActions
                  hideImportExport
                />
              </div>

              <DataTable<QuoteGridView>
                data={quotes}
                columns={QUOTES_COLUMNS}
                segments={SEGMENTS}
                segmentValue={activeSegment}
                segmentCounts={quoteCounts}
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
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}