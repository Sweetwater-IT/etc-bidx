"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { CardActions } from "@/components/card-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuoteGridView } from "@/types/QuoteGridView";
import { toast } from "sonner";

const QUOTES_COLUMNS = [
  { key: "quote_number", title: "Quote #" },
  { key: "status", title: "Status" },
  { key: "type", title: "Type", sortable: true },
  { key: "customer_name", title: "Customer" },
  { key: "point_of_contact", title: "Contact" },
  { key: "county", title: "County" },
  { key: "created_by_name", title: "Created By" },
  { key: "created_at", title: "Created" },
];

const SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Napoleon", value: "Napoleon" },
  { label: "Sidney", value: "Sidney" },
  { label: "Jim", value: "Jim" },
  { label: "Larry", value: "Larry" },
  { label: "John", value: "John" },
  { label: "Garret", value: "Garret" },
  { label: "Eric", value: "Eric" },
];

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteGridView[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [quoteCounts, setQuoteCounts] = useState({
    all: 0,
    Napoleon: 0,
    Sidney: 0,
    Jim: 0,
    Larry: 0,
    John: 0,
    Garret: 0,
    Eric: 0,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [isTableLoading, setIsTableLoading] = useState(false);

  const fetchQuotes = async (filter = "all", page = 1, limit = 25) => {
    setIsTableLoading(true);

    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("created_by", filter);
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
      setIsTableLoading(false);
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
    setIsTableLoading(true);
    try {
      const res = await fetch(`/api/quotes/delete/${quote.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Quote ${quote.quote_number} deleted`);
        fetchQuotes(activeFilter, pageIndex + 1, pageSize);
        fetchQuoteCounts();
      } else {
        toast.error(data.message || "Failed to delete quote");
      }
    } catch (err) {
      console.error("Error deleting quote:", err);
      toast.error("Unexpected error deleting quote");
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    setPageIndex(0);
    fetchQuotes(value, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
    fetchQuotes(activeFilter, newPage + 1, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
    fetchQuotes(activeFilter, 1, newSize);
  };

  useEffect(() => {
    fetchQuoteCounts();
    fetchQuotes(activeFilter, pageIndex + 1, pageSize);
  }, [activeFilter, pageIndex, pageSize]);

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
                segmentValue={activeFilter}
                segmentCounts={quoteCounts}
                onSegmentChange={handleFilterChange}
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