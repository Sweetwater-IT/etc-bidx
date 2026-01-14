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

// Define the type for creators (matches what DataTable expects)
type Creator = {
  id: string;
  display: string;
};

const QUOTES_COLUMNS = [
  { key: "quote_number", title: "Quote #" },
  { key: "status", title: "Status" },
  { key: "type", title: "Type", sortable: true },
  { key: "customer_name", title: "Customer" },
  { key: "point_of_contact", title: "Contact" },
  { key: "county", title: "County" },
  { key: "created_by", title: "Created By" }
  { key: "created_at", title: "Created" },
];

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteGridView[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // New state for creator filter
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);

  const { startLoading, stopLoading, isLoading } = useLoading();

  // Fetch quotes (now includes creator filter)
  const fetchQuotes = async (page = 1, limit = 25) => {
    startLoading();
    try {
      const params = new URLSearchParams();
      if (selectedCreatorId) {
        params.append("user_created", selectedCreatorId);
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

  // Fetch list of creators for the dropdown
  const fetchCreators = async () => {
    try {
      const res = await fetch("/api/users/creators"); // ← Adjust this endpoint to your real API
      const data = await res.json();
      if (data.success || Array.isArray(data)) {
        const creatorList = (data.users || data).map((u: any) => ({
          id: u.user_id || u.id,
          display: u.name 
            ? `${u.name} (${u.email || "no email"})` 
            : u.email || "Unknown User",
        }));
        setCreators(creatorList);
      }
    } catch (err) {
      console.error("Failed to load creators:", err);
      toast.error("Could not load quote creators");
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
        fetchQuotes(pageIndex + 1, pageSize);
      } else {
        toast.error(data.message || "Failed to delete quote");
      }
    } catch (err) {
      console.error("Error deleting quote:", err);
      toast.error("Unexpected error deleting quote");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
    fetchQuotes(newPage + 1, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
    fetchQuotes(1, newSize);
  };

  // When creator changes → reset page and refetch
  useEffect(() => {
    setPageIndex(0);
    fetchQuotes(1, pageSize);
  }, [selectedCreatorId, pageSize]);

  // Initial load
  useEffect(() => {
    fetchCreators();
    fetchQuotes(pageIndex + 1, pageSize);
  }, []);

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
                // NEW props for creator dropdown
                users={creators}
                selectedUserId={selectedCreatorId}
                onUserSelect={setSelectedCreatorId}
                // Removed all segments props
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
