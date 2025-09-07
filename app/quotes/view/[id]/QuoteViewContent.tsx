"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import FileViewingContainer from "@/components/file-viewing-container";
import { FileMetadata } from "@/types/FileTypes";
import { Note, QuoteNotes } from "@/components/pages/quote-form/QuoteNotes";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { INote } from "@/types/TEstimate";
import { useAuth } from "@/contexts/auth-context";

interface Quote {
  id: number;
  contract_number?: string;
  job_number?: string;
  status?: string;
  customer?: {
    id: number;
    name: string;
    displayName: string;
  };
  requestor?: string;
  quote_date?: string;
  created_at?: string;
  order_status?: string;
  items?: any[];
  contact?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

interface QuoteItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export default function QuoteViewContent({ quoteId }: { quoteId: any }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth()

  const QUOTE_COLUMNS = [
    { key: "description", title: "Description", sortable: false },
    { key: "quantity", title: "Quantity", sortable: false },
    { key: "unitPrice", title: "Unit Price", sortable: false },
    { key: "total", title: "Total", sortable: false },
  ];

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        if (!quoteId) return;

        const res = await fetch(`/api/quotes/${quoteId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch quote");
        }

        setQuote(data);
        setQuoteItems(
          Array.isArray(data.items)
            ? data.items.map((item: any, idx: number) => ({
              id: idx + 1,
              description: item.description || "N/A",
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || 0,
              total: (item.quantity || 0) * (item.unitPrice || 0),
            }))
            : []
        );
        setNotes(Array.isArray(data.notes) ? data.notes : []);
        setFiles(Array.isArray(data.files) ? data.files : []);
      } catch (err) {
        console.error("Error fetching quote:", err);
        toast.error("Error loading quote");
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId]);

  const handleExport = () => {
    alert("Export functionality not implemented yet");
  };

  const handleEditQuote = () => {
    router.push(`/quotes/edit/${quoteId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">Loading...</div>
    );
  }

  if (!quote) {
    return (
      <div className="flex justify-center items-center h-screen">
        Quote not found
      </div>
    );
  }

  const handleSave = async (note: INote, index: number) => {
    const updated = [...notes, { ...note, user_email: user.email }];
    setNotes(updated);

    const response = await fetch('/api/quotes/addNotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quote_id: quoteId,
        timestamp: note.timestamp,
        text: note.text,
        user_email: user.email
      })
    });
    const result = await response.json();

    if (result.ok) {
      setNotes((prev) =>
        prev.map((n, i) => (i === index ? { ...result.data, timestamp: result.data.created_at } : n))
      );
    }
  };

  const handleEdit = async (index: number, updatedNote: INote) => {
    const updated = notes.map((n, i) => (i === index ? updatedNote : n));
    setNotes(updated);

    const resp = await fetch('/api/quotes/addNotes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: updatedNote.id, text: updatedNote.text })
    });
    const result = await resp.json();

    if (result.ok) {
      setNotes((prev) =>
        prev.map((n, i) => (i === index ? { ...result.data, timestamp: result.data.created_at } : n))
      );
    }
  };

  const handleDelete = async (index: number) => {
    const noteToDelete = notes[index];
    const updated = notes.filter((_, i) => i !== index);
    setNotes(updated);

    await fetch('/api/quotes/addNotes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteToDelete.id })
    });
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
        <SiteHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold mt-2 ml-0">View Quote</h1>
            <div className="flex gap-2">
              <Button
                onClick={handleEditQuote}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Edit
              </Button>
              <Button variant="outline" onClick={handleExport}>
                Export
              </Button>
              <Button variant="outline" onClick={() => alert("Send Email pending")}>
                Send Email
              </Button>
            </div>
          </div>
        </SiteHeader>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">                <div className="lg:col-span-2 bg-white p-8 rounded-md shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">
                  Quote Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Quote ID</div>
                    <div className="text-base mt-1 flex items-center gap-2">
                      {quote.id}
                      {quote.status?.toLowerCase() === "submitted" && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Submitted
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Contract Number
                    </div>
                    <div className="text-base mt-1">
                      {quote.contract_number || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Requestor</div>
                    <div className="text-base mt-1">{quote.requestor || "-"}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Customer</div>
                    <div className="text-base mt-1">
                      {quote.customer?.displayName || "-"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Quote Date
                    </div>
                    <div className="text-base mt-1">
                      {quote.quote_date
                        ? format(new Date(quote.quote_date), "MM/dd/yyyy")
                        : "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Created At
                    </div>
                    <div className="text-base mt-1">
                      {quote.created_at
                        ? format(new Date(quote.created_at), "MM/dd/yyyy")
                        : "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Contact Name
                    </div>
                    <div className="text-base mt-1">
                      {quote.contact?.name ?? "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Contact Email
                    </div>
                    <div className="text-base mt-1">
                      {quote.contact?.email ?? "-"}
                    </div>
                  </div>
                </div>
              </div>

                <div className="flex flex-col gap-y-2">
                  <FileViewingContainer files={files} onFilesChange={setFiles} />

                  <QuoteNotes
                    notes={notes}
                    onSave={(note: INote) => handleSave(note, notes.length)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    title="Notes"
                  />
                </div>
              </div>

            
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4">Quote Items</h2>
                  <DataTable
                    data={
                      quoteItems.length === 0
                        ? [
                          {
                            description: "-",
                            quantity: "-",
                            unitPrice: "-",
                            total: "-",
                          } as any,
                        ]
                        : quoteItems
                    }
                    columns={QUOTE_COLUMNS}
                    hideDropdown
                  />
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>

  );
}
