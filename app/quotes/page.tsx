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
import { toast } from "sonner";

const QUOTES_COLUMNS = [
  { key: "quote_number", title: "Quote #" },
  { key: "estimate_id", title: "Estimate ID" }, 
  { key: "job_id", title: "Job ID" },
  { key: "status", title: "Status" },
  { key: "date_sent", title: "Date Sent" },
  { key: "customer_name", title: "Customer" },
  { key: "point_of_contact", title: "Contact" },
  { key: "total_items", title: "Items" },
  { key: "county", title: "County" },
  { key: "created_at", title: "Created" },
  { key: "has_attachments", title: "Attachments" },

];

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Not Sent", value: "Not Sent" },
  { label: "Sent", value: "Sent" },
  { label: "Accepted", value: "Accepted" },
];

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteGridView[]>([]);
  const [activeSegment, setActiveSegment] = useState("all");
  const [quoteCounts, setQuoteCounts] = useState({
    all: 0,
    not_sent: 0,
    sent: 0,
    accepted: 0,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const { startLoading, stopLoading, isLoading } = useLoading();


  const fetchQuotes = async (status = "all", page = 1, limit = 25) => {
    startLoading();

    try {
      const params = new URLSearchParams();
      if (status !== "all") {
        params.append("status", status);
      }
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      params.append("orderBy", "created_at");
      params.append("ascending", "false");
      params.append("detailed", "false");

      const response = await fetch(`/api/quotes?${params.toString()}`);
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

  const fetchQuoteCounts = async () => {
    try {
      const response = await fetch("/api/quotes?counts=true");
      const data = await response.json();
      setQuoteCounts(data);
    } catch (error) {
      console.error("Error fetching quote counts:", error);
    }
  };

  const handleDeleteQuote = async (quote: QuoteGridView) => {
    try {
      const res = await fetch(`/api/quotes/delete/${quote.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Quote ${quote.quote_number} deleted`);
        fetchQuotes(activeSegment, pageIndex + 1, pageSize);
        fetchQuoteCounts();
      } else {
        toast.error(data.message || "Failed to delete quote");
      }
    } catch (err) {
      console.error("Error deleting quote:", err);
      toast.error("Unexpected error deleting quote");
    }
  };
  
  const handleSegmentChange = (value: string) => {
    setActiveSegment(value);
    setPageIndex(0);
    fetchQuotes(value, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
    fetchQuotes(activeSegment, newPage + 1, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
    fetchQuotes(activeSegment, 1, newSize);
  };

  useEffect(() => {
    fetchQuoteCounts();
    fetchQuotes(activeSegment, pageIndex + 1, pageSize);
  }, [activeSegment, pageIndex, pageSize]);

  const handleRowClick = (quote: QuoteGridView) => {
    router.push(`/quotes/view/${quote.id}`);
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
                  createButtonLabel="Create Quote"
                  onCreateClick={() => router.push("/quotes/create")}
                  hideCalendar
                  goUpActions
                />
              </div>

              <DataTable<QuoteGridView>
                data={quotes}
                columns={QUOTES_COLUMNS}
                segments={SEGMENTS}
                segmentValue={activeSegment}
                segmentCounts={quoteCounts}
                onSegmentChange={handleSegmentChange}
                onViewDetails={handleRowClick}
                stickyLastColumn
                pageCount={pageCount}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                totalCount={totalCount}

                onDelete={(quote) => handleDeleteQuote(quote)}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
