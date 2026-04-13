"use client";

import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { QuoteGridView } from "@/types/QuoteGridView";
import { QUOTE_CREATOR_SEGMENTS } from "@/lib/quote-creator-segments";
import { IconPlus } from "@tabler/icons-react";
import { FileText } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TableSearchBar } from "@/components/TableSearchBar";
import { useTableSearchState } from "@/hooks/use-table-search-state";

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
  ...QUOTE_CREATOR_SEGMENTS.map(segment => ({
    label: segment.segmentLabel,
    value: segment.value,
  })),
];

export default function QuotesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<QuoteGridView[]>([]);
  const currentParams = useMemo(
    () => new URLSearchParams(searchParams?.toString() ?? ""),
    [searchParams]
  );
  const urlFilter = currentParams.get("created_by") || "all";
  const parsedPage = Number.parseInt(currentParams.get("page") || "1", 10);
  const parsedPageSize = Number.parseInt(currentParams.get("limit") || "25", 10);
  const urlPageIndex = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage - 1 : 0;
  const urlPageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 25;
  const [activeFilter, setActiveFilter] = useState(urlFilter);
  const [quoteCounts, setQuoteCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries([["all", 0], ...QUOTE_CREATOR_SEGMENTS.map(segment => [segment.value, 0])])
  );
  const [pageIndex, setPageIndex] = useState(urlPageIndex);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const { search: quotesSearch, setSearch: setQuotesSearch, debouncedSearch: debouncedQuotesSearch } = useTableSearchState();

  const fetchQuotes = useCallback(async (filter = "all", page = 1, limit = 25, search = "") => {
    setIsTableLoading(true);

    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("created_by", filter);
      }
      if (search.trim()) {
        params.append("search", search.trim());
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
  }, []);

  const fetchQuoteCounts = useCallback(async (search = "") => {
    try {
      const params = new URLSearchParams();
      params.append("counts", "true");
      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(`/api/quotes?${params.toString()}`);
      const data = await response.json();
      setQuoteCounts(data);
    } catch (error) {
      console.error("Error fetching quote counts:", error);
    }
  }, []);

  const handleDeleteQuote = async (quote: QuoteGridView) => {
    setIsTableLoading(true);
    try {
      const res = await fetch(`/api/quotes/delete/${quote.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Quote ${quote.quote_number} deleted`);
        fetchQuotes(activeFilter, pageIndex + 1, pageSize, debouncedQuotesSearch);
        fetchQuoteCounts(debouncedQuotesSearch);
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

  useEffect(() => {
    fetchQuoteCounts(debouncedQuotesSearch);
    fetchQuotes(activeFilter, pageIndex + 1, pageSize, debouncedQuotesSearch);
  }, [activeFilter, pageIndex, pageSize, debouncedQuotesSearch, fetchQuoteCounts, fetchQuotes]);

  useEffect(() => {
    setActiveFilter(prev => (prev === urlFilter ? prev : urlFilter));
    setPageIndex(prev => (prev === urlPageIndex ? prev : urlPageIndex));
    setPageSize(prev => (prev === urlPageSize ? prev : urlPageSize));
  }, [urlFilter, urlPageIndex, urlPageSize]);

  useEffect(() => {
    const nextParams = new URLSearchParams(currentParams.toString());

    if (activeFilter !== "all") {
      nextParams.set("created_by", activeFilter);
    } else {
      nextParams.delete("created_by");
    }

    if (pageIndex > 0) {
      nextParams.set("page", String(pageIndex + 1));
    } else {
      nextParams.delete("page");
    }

    if (pageSize !== 25) {
      nextParams.set("limit", String(pageSize));
    } else {
      nextParams.delete("limit");
    }

    const nextQuery = nextParams.toString();
    const currentQuery = currentParams.toString();
    const currentPath = pathname ?? "/quotes";

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${currentPath}?${nextQuery}` : currentPath, {
        scroll: false,
      });
    }
  }, [activeFilter, currentParams, pageIndex, pageSize, pathname, router]);

  const handleRowClick = (quote: QuoteGridView) => {
    const query = currentParams.toString();
    router.push(query ? `/quotes/view/${quote.id}?${query}` : `/quotes/view/${quote.id}`);
  };

  return (
    <>
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
              <TableSearchBar
                value={quotesSearch}
                onChange={setQuotesSearch}
                placeholder="Search quotes..."
              />
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
            />
          </div>
        </div>
      </div>
    </>
  );
}
