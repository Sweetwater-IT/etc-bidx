"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { QuoteGridView } from "@/types/QuoteGridView";
import { IconPlus } from "@tabler/icons-react";
import { FileText, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  { label: "Eric", value: "Eric" },
  { label: "Rad", value: "Rad" },
  { label: "Ken", value: "Ken" },
  { label: "Turner", value: "Turner" },
  { label: "Redden", value: "Redden" },
  { label: "John", value: "John" },
];

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteGridView[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [quoteCounts, setQuoteCounts] = useState({
    all: 0,
    Napoleon: 0,
    Eric: 0,
    Rad: 0,
    Ken: 0,
    Turner: 0,
    Redden: 0,
    John: 0,
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [quotesSearch, setQuotesSearch] = useState("");

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
      const params = new URLSearchParams();
      params.append("counts", "true");

      const response = await fetch(`/api/quotes?${params.toString()}`);
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

  const handleRefreshQuotes = () => {
    fetchQuoteCounts();
    fetchQuotes(activeFilter, pageIndex + 1, pageSize);
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
        <SiteHeader showTitleBlock={false} />
        <div className="flex flex-1 flex-col bg-[#F9FAFB]">
          <header className="sticky top-11 z-30 shrink-0 border-b bg-card">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary p-2 text-primary-foreground shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-foreground">Quotes</h1>
                  <p className="text-xs text-muted-foreground">
                    {totalCount} quote{totalCount === 1 ? "" : "s"} in the current view
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button size="sm" className="h-9 gap-2 font-semibold shadow-sm" onClick={() => router.push("/quotes/create")}>
                  <IconPlus className="h-4 w-4" />
                  Create Quote
                </Button>
              </div>
            </div>
          </header>

          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" className="gap-2 font-semibold shadow-sm" onClick={handleRefreshQuotes}>
                    <RefreshCw className={`h-4 w-4 ${isTableLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes..."
                    value={quotesSearch}
                    onChange={(e) => setQuotesSearch(e.target.value)}
                    className="h-9 border-border bg-card pl-9 shadow-sm"
                  />
                </div>
              </div>

              <DataTable<QuoteGridView>
                data={quotes}
                columns={QUOTES_COLUMNS}
                variant="job-list"
                segmentsVariant="productivity"
                segments={SEGMENTS}
                segmentValue={activeFilter}
                segmentCounts={quoteCounts}
                onSegmentChange={handleFilterChange}
                onViewDetails={handleRowClick}
                stickyLastColumn
                pageCount={pageCount}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                totalCount={totalCount}
                isLoading={isTableLoading}
                onDelete={(quote) => handleDeleteQuote(quote)}
                enableSearch
                searchableColumns={["quote_number", "status", "type", "customer_name", "point_of_contact", "county", "created_by_name", "created_at"]}
                searchValue={quotesSearch}
                onSearchChange={setQuotesSearch}
                showSearchBar={false}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
