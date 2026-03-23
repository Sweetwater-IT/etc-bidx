"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { CardActions } from "@/components/card-actions";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QuoteGridView } from "@/types/QuoteGridView";
import { toast } from "sonner";
import { Search } from "lucide-react";

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
  const searchParams = useSearchParams();
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
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const fetchAbortRef = useRef<AbortController | null>(null);
  const externalSearch = searchParams.get("search") || "";

  useEffect(() => {
    setSearchTerm(externalSearch);
    setPageIndex(0);
  }, [externalSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      console.log("[QuotesPage] debounced search term", {
        raw: searchTerm,
        trimmed: searchTerm.trim(),
      });
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, []);

  const fetchQuotes = async (filter = "all", page = 1, limit = 25, search = "") => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
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
      if (search) {
        params.append("search", search);
      }

      const requestUrl = `/api/quotes?${params.toString()}`;
      console.log("[QuotesPage] fetching quotes", {
        filter,
        page,
        limit,
        search,
        requestUrl,
      });

      const response = await fetch(requestUrl, {
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await response.json();

      if (data.success) {
        console.log("[QuotesPage] fetched quotes result", {
          search,
          returnedRows: data.data?.length ?? 0,
          totalCount: data.pagination?.totalCount ?? 0,
          pageCount: data.pagination?.pageCount ?? 0,
          quoteNumbers: Array.isArray(data.data)
            ? data.data.map((row: QuoteGridView) => row.quote_number)
            : [],
        });
        setQuotes(data.data);
        setPageCount(data.pagination.pageCount);
        setTotalCount(data.pagination.totalCount);
      } else {
        console.error("Failed to fetch quotes:", data.error);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[QuotesPage] fetch aborted", { search, page, limit });
        return;
      }
      console.error("Error fetching quotes:", error);
    } finally {
      if (fetchAbortRef.current === controller) {
        setIsTableLoading(false);
      }
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
  };

  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
  };

  useEffect(() => {
    fetchQuoteCounts();
  }, []);

  useEffect(() => {
    fetchQuotes(activeFilter, pageIndex + 1, pageSize, debouncedSearchTerm);
  }, [activeFilter, pageIndex, pageSize, debouncedSearchTerm]);

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

              <div className="px-6 -mb-2">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer, contact, quote #, type, or created by..."
                    value={searchTerm}
                    onChange={(e) => {
                      console.log("[QuotesPage] search input change", {
                        value: e.target.value,
                      });
                      setSearchTerm(e.target.value);
                      setPageIndex(0);
                    }}
                    className="pl-9 w-full"
                  />
                </div>
              </div>

              <DataTable<QuoteGridView>
                data={quotes}
                columns={QUOTES_COLUMNS}
                searchableColumns={[
                  "customer_name",
                  "point_of_contact",
                  "quote_number",
                  "type",
                  "created_by_name",
                ]}
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
