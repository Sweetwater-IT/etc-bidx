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
import { ChevronDown, ArrowLeft, Loader, Download } from "lucide-react"
import { BidProposalReactPDF } from "@/components/pages/quote-form/BidProposalReactPDF";
import ReactPDF from '@react-pdf/renderer'


export interface ContactInfo {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
}

export interface Quote {
  id: number;
  quote_number?: string | null;
  contract_number?: string | null;
  status?: "DRAFT" | "Not Sent" | "Sent" | "Accepted" | null;
  created_at?: string | null;
  date_sent?: string | null;
  customer?: any;
  contact?: ContactInfo | null;
  ccEmails?: string[];
  bccEmails?: string[];
  requestor?: string | null;
  quote_date?: string | null;
  items?: any[];
  admin_data?: any | null;
  files?: any[];
  notes?: any | null;
  from_email?: string | null;
  subject?: string | null;
  body?: string | null;
  estimate_id?: number | null;
  job_id?: number | null;
  response_token?: string | null;
  custom_terms_conditions?: string | null;
  payment_terms?: string;
  county?: string | null;
  state_route?: string | null;
  ecms_po_number?: string | null;
  bedford_sell_sheet?: boolean;
  flagging_price_list?: boolean;
  flagging_service_area?: boolean;
  standard_terms?: boolean;
  rental_agreements?: boolean;
  equipment_sale?: boolean;
  flagging_terms?: boolean;
  updated_at?: string | null;
  type_quote: "straight_sale" | "to_project" | "estimate_bid";
  customer_contact?: Record<string, any>;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_job_number?: string;
  purchase_order?: string | null;
  etc_point_of_contact?: string;
  etc_poc_email?: string;
  etc_poc_phone_number?: string;
  etc_branch?: string;
  township?: string;
  sr_route?: string;
  job_address?: string;
  ecsm_contract_number?: string;
  bid_date?: string;
  start_date?: string;
  end_date?: string | null;
  duration?: number;
  pdf_url: string;
  digital_signature: string;
  comments: string;
  exclusionsText: string;
  termsText: string;
  aditionalTerms: boolean;
  selectedfilesids: any[];
  notesText: string;
}

export default function QuoteViewContent({ quoteId }: { quoteId: any }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false)

  const QUOTE_COLUMNS = [
    { key: "description", title: "Description", sortable: false },
    { key: "quantity", title: "Quantity", sortable: false },
    { key: "unitPrice", title: "Unit Price", sortable: false },
    { key: "total", title: "Total", sortable: false },
    { key: "tax", title: "Tax", sortable: false },
    { key: "confirmed", title: "Confirmed", sortable: false },
  ];

  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) return;
      try {
        const res = await fetch(`/api/quotes/${quoteId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch quote");

        setQuote({
          ...data,
          items: Array.isArray(data.items)
            ? data.items.map((item: any, idx: number) => ({
              id: idx + 1,
              description: item.description || "N/A",
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || 0,
              total: (item.quantity || 0) * (item.unitPrice || 0),
              tax: item.tax || "0",
              confirmed: item.confirmed || "NO",
            }))
            : [],
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
        body: JSON.stringify({ id: quote.id, status }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update status")

      setQuote((prev: any) => ({ ...prev, status }))
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
                  onClick={handleEditQuote}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Edit Quote
                </Button>

                <Button variant="outline" size={'sm'} onClick={() => handleDownload('quote')}>
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

              <div className="flex flex-row w-full gap-4 ">
                <div className="w-3/4 flex flex-col gap-4">
                  <div className="grid grid-cols-1 w-full gap-8">
                    <div className="lg:col-span-2 w-full bg-white p-8 rounded-md shadow-sm border border-gray-100">
                      <h2 className="text-xl font-semibold mb-4">
                        Customer Information
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Customer Name
                          </div>
                          <div className="text-base mt-1">
                            {quote?.customer || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Customer Address
                          </div>
                          <div className="text-base mt-1">
                            {quote?.customer_address || "-"}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">Customer Email</div>
                          <div className="text-base mt-1">{quote.customer_email || "-"}</div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">Customer Job Number</div>
                          <div className="text-base mt-1">
                            {quote.customer_job_number || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Customer Phone</div>
                          <div className="text-base mt-1">
                            {quote.customer_phone || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1  gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-md shadow-sm border border-gray-100">
                      <h2 className="text-xl font-semibold mb-4">
                        Quote Information
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                            {quote.customer || "-"}
                          </div>
                        </div>
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

                        {quote.type_quote === "straight_sale" && (
                          <>
                            <div>
                              <div className="text-sm text-muted-foreground">Purchase Order</div>
                              <div className="text-base mt-1">{quote?.purchase_order || "-"}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Job Number</div>
                              <div className="text-base mt-1">{quote.customer_job_number || "-"}</div>
                            </div>
                          </>
                        )}

                        {quote.type_quote === "to_project" && (
                          <>
                            <div>
                              <div className="text-sm text-muted-foreground">Bid Date</div>
                              <div className="text-base mt-1">{quote.bid_date || "-"}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Start Date</div>
                              <div className="text-base mt-1">{quote.start_date || "-"}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">End Date</div>
                              <div className="text-base mt-1">{quote.end_date || "-"}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Duration</div>
                              <div className="text-base mt-1">{quote.duration || "-"}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Purchase Order</div>
                              <div className="text-base mt-1">{quote.purchase_order || "-"}</div>
                            </div>
                          </>
                        )}

                        {quote.type_quote === "estimate_bid" && (
                          <>
                            <div>
                              <div className="text-sm text-muted-foreground">Bid Date</div>
                              <div className="text-base mt-1">{quote?.bid_date ?? "-"}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Start Date</div>
                              <div className="text-base mt-1">{quote.start_date || "-"}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">End Date</div>
                              <div className="text-base mt-1">{quote.end_date || "-"}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Duration</div>
                              <div className="text-base mt-1">{quote.duration || "-"}</div>
                            </div>
                          </>
                        )}
                      </div>


                    </div>
                  </div>
                </div>
                <div className="w-1/4">
                  <div className="flex flex-col gap-y-2">
                    <QuoteNotes
                      notes={quote?.notes || []}
                      onSave={handleSaveNote}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                      title="Recent Activity"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {
                  quote.comments && (
                    <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100">
                      <h2 className="text-xl font-semibold mb-4">Customer Comments</h2>
                      <p className="text-base text-gray-700 whitespace-pre-line">
                        {quote.comments || "No comments provided"}
                      </p>
                    </div>
                  )
                }

                {
                  quote.digital_signature &&
                  <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Digital Signature</h2>
                    <p className="text-base text-gray-700 whitespace-pre-line">
                      {quote.digital_signature || "No digital signature provided"}
                    </p>
                  </div>
                }

              </div>



              <div className="grid grid-cols-1 gap-8">
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
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>

  );
}
