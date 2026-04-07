"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { QuoteNotes } from "@/components/pages/quote-form/QuoteNotes";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { INote } from "@/types/TEstimate";
import { useAuth } from "@/contexts/auth-context";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ChevronDown, ArrowLeft, Loader, Download, Loader2, FileText, Send } from "lucide-react"
import { BidProposalReactPDF } from "@/components/pages/quote-form/BidProposalReactPDF";
import ReactPDF from '@react-pdf/renderer'
import BidProposalWorksheet from "../../create/BidProposalWorksheet";
import { Quote } from "@/types/MPTEquipmentCost";


export interface ContactInfo {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
}

function formatDateTime(ts: number | string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default function QuoteViewContent({ quoteId }: { quoteId: any }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteType, setQuoteType] = useState<'quote' | 'sale_ticket'>('quote');

  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) return;
      try {
        const res = await fetch(`/api/quotes/${quoteId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch quote");

        setQuote({
          ...data,
          items: data.items?.map((item: any) => ({
            id: item.id ?? crypto.randomUUID(),
            description: item.description || "N/A",
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unit_price || item.unitPrice) || 0,
            total: (Number(item.quantity) || 0) * (Number(item.unit_price || item.unitPrice) || 0),

            tax: item.tax != null ? Number(item.tax) : 0,
            is_tax_percentage: Boolean(item.is_tax_percentage),

            confirmed: item.confirmed ? "YES" : "NO",
            itemNumber: item.item_number || "",
            notes: item.notes || "",
            uom: item.uom,
          })) ?? [],
        });
      } catch (err) {
        console.error("Error fetching quote:", err);
        toast.error("Error loading quote");
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [quoteId]);

  const handleGenerateAndUpload = async (type: 'saleTicket' | 'quote'): Promise<string | null> => {
    setDownloading(true)
    try {
      if (!quote || !quote.id) {
        toast.error("No quote available");
        return null;
      }

      const pdfBlob = await ReactPDF.pdf(
        <BidProposalReactPDF
          exclusions={quote.exclusionsText}
          terms={quote?.termsText ?? ''}
          notes={quote?.notesText}
          items={quote?.items ?? []}
          quoteDate={new Date()}
          quoteStatus={type === 'quote' ? ("DRAFT") : (quote?.status ?? '')}
          quoteData={quote as any}
          quoteType={quote?.type_quote || "straight_sale"}
          termsAndConditions={quote?.aditionalTerms}
        />
      ).toBlob();

      const formData = new FormData();
      formData.append("quoteId", quote.id.toString());
      formData.append("uniqueIdentifier", quote.id.toString());
      formData.append(
        "file",
        new File([pdfBlob], `Quote-${quote.quote_number}.pdf`, { type: "application/pdf" })
      );

      const filesToUpload = quote?.files?.filter((f) =>
        quote.selectedfilesids?.includes(f.id)
      );

      for (const f of filesToUpload ?? []) {
        const response = await fetch(f.file_url);
        if (!response.ok) continue;
        const blob = await response.blob();
        formData.append("file", new File([blob], f.filename, { type: f.file_type }));
      }

      const res = await fetch("/api/files/combine-pdfs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Error merging PDFs");

      setQuote((prev) => (prev ? { ...prev, pdf_url: data.url } : prev));

      return data.url;
    } catch (err) {
      console.error("Error generating/uploading PDF:", err);
      toast.error("Could not generate PDF");
      return null;
    } finally {
      setDownloading(false)
    }
  };


  const handleDownload = async (type: 'saleTicket' | 'quote') => {
    try {
      const url: any = await handleGenerateAndUpload(type);
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Error opening PDF");
    }
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

  const handleSaveNote = async (note: INote) => {
    if (!quote) return;
    try {
      const res = await fetch("/api/quotes/addNotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_id: quote.id,
          timestamp: note.timestamp,
          text: note.text,
          user_email: user.email,
        }),
      });
      const result = await res.json();
      if (result.ok) {
        setQuote((prev) =>
          prev ? { ...prev, notes: [...(prev.notes || []), { ...result.data, timestamp: result.data.created_at ? new Date(result.data.created_at).getTime() : Date.now() }] } : prev
        );
      }
    } catch (err) {
      toast.error("Error saving note");
    }
  };

  const handleEditNote = async (index: number, updatedNote: INote) => {
    if (!quote) return;
    try {
      const res = await fetch("/api/quotes/addNotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updatedNote.id, text: updatedNote.text }),
      });
      const result = await res.json();
      if (result.ok) {
        setQuote((prev) => {
          if (!prev?.notes) return prev;
          const updatedNotes = [...prev.notes];
          updatedNotes[index] = {
            ...result.data,
            timestamp: result.data.created_at ? new Date(result.data.created_at).getTime() : Date.now(),

          };
          return { ...prev, notes: updatedNotes };
        });
      }
    } catch (err) {
      toast.error("Error editing note");
    }
  };

  const handleDeleteNote = async (index: number) => {
    if (!quote || !quote.notes) return;
    const noteToDelete = quote.notes[index];
    try {
      await fetch("/api/quotes/addNotes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noteToDelete.id }),
      });
      setQuote((prev) => {
        if (!prev?.notes) return prev;
        const updatedNotes = prev.notes.filter((_, i) => i !== index);
        return { ...prev, notes: updatedNotes };
      });
    } catch (err) {
      toast.error("Error deleting note");
    }
  };

  const onStatusChange = async (status: string) => {
    try {
      const res = await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quote.id, status, userEmail: user.email }),
      })


      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update status")

      if (status === 'Sent') {
        setQuote((prev: any) => ({ ...prev, status, user_sent: user.email, date_sent: new Date() }))
      } else {
        setQuote((prev: any) => ({ ...prev, status, user_sent: null, date_sent: null  }))
      }
    } catch (error) {
      console.error("Error updating quote status:", error)
    }
  }

  const getStatusStyles = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "accepted":
        return "bg-green-100 text-green-700 border-green-300";
      case "declined":
        return "bg-red-100 text-red-700 border-red-300";
      case "sent":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
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
        <SiteHeader paddingTop={12} marginBottom={6}>
        </SiteHeader>
        <div className="flex w-full px-8 items-center justify-between">
          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-2">
                <Button
                  role="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="rounded-full flex flex-row"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <p>Back to Quotes</p>

              </div>
              <div className="flex flex-row items-center gap-2">
                <Button
                  role="button"
                  onClick={handleEditQuote}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Edit Quote
                </Button>

                <Button role="button"
                  variant="outline" size={'sm'} onClick={() => handleDownload('quote')}>
                  <Download />
                  {downloading ? (
                    <>
                      <p>Downloading </p>
                      <Loader className="animate-spin w-5 h-5 text-gray-600" />
                    </>
                  ) : (
                    "Download Quote"
                  )}
                </Button>
                {
                  quote.status === 'Accepted' &&
                  <Button variant="outline" size={'sm'} onClick={() => handleDownload('saleTicket')}>
                    <Download />
                    {downloading ? (
                      <>
                        <p>Downloading </p>
                        <Loader className="animate-spin w-5 h-5 text-gray-600" />
                      </>
                    ) : (
                      "Download Sale Ticket"
                    )}
                  </Button>
                }
              </div>
            </div>

            <div className="flex w-full flex-row items-center justify-start gap-4">
              <h2 className="text-3xl font-semibold">Quote {quote?.quote_number}</h2>
              <Badge
                variant="outline"
                className={`flex items-center rounded-2xl gap-2 text-sm px-3 py-1 ${getStatusStyles(quote?.status ?? '')}`}
              >
                {quote?.status || "N/A"}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size={'sm'} className="flex items-center gap-2">
                    {quote?.status}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {["Sent", "Declined", "Accepted"].map((s) => (
                    <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>
        </div>
        {/* <div className="p-6">
          <p className="font-bold mb-2 text-[20px]">Customer Quote Link</p>
          <div className="w-full flex flex-row gap-4 items-center">
            <div className="flex-1 bg-gray-200/60 rounded-md p-4 flex items-center justify-between">
              <p className="truncate text-gray-600">{process.env.NEXT_PUBLIC_BASE_APP_URL + '/customer-view-quote/' + quote.id}</p>
            </div>

            <button
              className="cursor-pointer p-4 rounded-md hover:bg-gray-200/60"
              role="button"
              title="Copy link"
              onClick={() => {
                navigator.clipboard.writeText(process.env.NEXT_PUBLIC_BASE_APP_URL + '/customer-view-quote/' + quote.id);
                toast.success("Link copied!");
              }}
            >
              <Copy className="w-5 h-5 text-gray-600 hover:text-gray-800" />
            </button>

            <button
              className="cursor-pointer p-4 rounded-md hover:bg-gray-200/60"
              role="button"
              title="Open link"
              disabled={!quote.pdf_url}
              onClick={() =>
                window.open(
                  process.env.NEXT_PUBLIC_BASE_APP_URL + '/customer-view-quote/' + quote.id,
                  "_blank"
                )
              }
            >
              <Eye className="w-5 h-5 text-gray-600 hover:text-gray-800" />
            </button>
          </div>
          <p className="mt-2 text-gray-500">
            Share this link with your customer so they can view and accept/decline the quote.
          </p>
        </div> */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
              <div className="w-full">
              <div className="bg-[#F4F5F7] w-full p-6 rounded-lg">
                <h2 className="font-bold text-2xl mb-4">Preview</h2>
                <div className="flex gap-4 border-b border-gray-300 mb-4">
                  <button
                    className={`pb-2 font-semibold ${quoteType === "quote"
                      ? "text-black border-b-2 border-indigo-500"
                      : "text-gray-500 hover:text-black"
                      }`}
                    onClick={() => setQuoteType("quote")}
                  >
                    Quote
                  </button>

                  {quote?.status === "Accepted" && (
                    <button
                      className={`pb-2 font-semibold ${quoteType === "sale_ticket"
                        ? "text-black border-b-2 border-indigo-500"
                        : "text-gray-500 hover:text-black"
                        }`}
                      onClick={() =>
                        setQuoteType("sale_ticket")
                      }
                    >
                      Sale Ticket
                    </button>
                  )}
                </div>
                <div className="min-h-[1000px] overflow-y-auto bg-white p-4 mt-0 border rounded-md">
                  {loading ? (
                    <div className="flex-1 h-[1000px] flex justify-center items-center">
                      <Loader2 className="w-6 h-6 animate-spin m-auto text-gray-500" />
                    </div>
                  ) : (
                    <BidProposalWorksheet
                      exclusions={quote?.exclusionsText}
                      terms={quote?.termsText}
                      quoteData={(quoteType === 'sale_ticket' ? { ...quote, status: 'Accepted' } : { ...quote, status: "Sent" }) as any}
                      quoteType={quote.type_quote ?? "to_project"}
                      notes={quote?.notesText}
                      items={quote?.items ?? []}
                      quoteDate={new Date()}
                      termsAndConditions={quote?.aditionalTerms}
                      files={quote?.files?.filter((f) => quote?.selectedfilesids?.includes(f.id))}
                    />
                  )}
                </div>
              </div>
            </div>

              {/* <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4">Quote Items</h2>
                  <DataTable
                    data={
                      quote?.items?.length === 0
                        ? [
                          {
                            description: "-",
                            quantity: "-",
                            unitPrice: "-",
                            total: "-",
                          } as any,
                        ]
                        : (quote.items?.map((q) => ({
                          description: q.description,
                          quantity: q.quantity,
                          unitPrice: q.unitPrice,
                          total: q.quantity * q.unitPrice,
                          tax: (q.tax ?? 0) + " %",
                          confirmed: q.confirmed ? "YES" : "NO"
                        })) ?? [])
                    }
                    columns={QUOTE_COLUMNS}
                    hideDropdown
                  />
                </div>
              </div> */}

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>

  );
}
