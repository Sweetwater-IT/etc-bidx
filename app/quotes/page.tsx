"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { CardActions } from "@/components/card-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuoteGridView } from "@/types/QuoteGridView";
import { toast } from "sonner";
import { useQuotesSWR, deleteQuoteOptimistic } from "@/hooks/use-quotes-swr";

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
  const [activeFilter, setActiveFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const {
    quotes,
    pagination,
    quoteCounts,
    isLoading,
    error,
    mutate
  } = useQuotesSWR({
    page: pageIndex + 1,
    pageSize,
    created_by: activeFilter,
    orderBy: 'created_at',
    ascending: false,
    detailed: false
  });

  const handleDeleteQuote = async (quote: QuoteGridView) => {
    try {
      // Optimistically update the cache
      await deleteQuoteOptimistic(mutate, quote.id);

      const res = await fetch(`/api/quotes/delete/${quote.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Quote ${quote.quote_number} deleted`);
        // Revalidate the cache
        await mutate();
      } else {
        toast.error(data.message || "Failed to delete quote");
        // Revert optimistic update on error
        await mutate();
      }
    } catch (err) {
      console.error("Error deleting quote:", err);
      toast.error("Unexpected error deleting quote");
      // Revert optimistic update on error
      await mutate();
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
                pageCount={pagination.pageCount}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                totalCount={pagination.totalCount}
                isLoading={isLoading}
                onDelete={(quote) => handleDeleteQuote(quote)}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}