'use client'

import { Button } from '@/components/ui/button'
import React, { useEffect, useState, useRef } from 'react'
import { useQuoteForm } from './QuoteFormProvider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { PaymentTerms, QuoteAdminInformation } from '@/components/pages/quote-form/QuoteAdminInformation'
import { QuoteItems } from '@/components/pages/quote-form/QuoteItems'
import { QuoteAdditionalFiles } from '@/components/pages/quote-form/QuoteAdditionalFiles'
import { QuotePreviewButton } from '@/components/pages/quote-form/PreviewButton'
import { toast } from 'sonner'
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData'
import PageHeaderWithSaving from '@/components/PageContainer/PageHeaderWithSaving'
import isEqual from 'lodash/isEqual'
import { useRouter } from 'next/navigation'
import ReactPDF from '@react-pdf/renderer'
import { BidProposalWorksheet } from './BidProposalWorksheet'
import { BidProposalReactPDF } from '@/components/pages/quote-form/BidProposalReactPDF'
import { useAuth } from '@/contexts/auth-context'
import RenderEstimateBidQuoteFields from './components/RenderEstimateBidQuoteFields';
import RenderSaleQuoteFields from './components/RenderSaleQuoteFields';
import RenderProjectQuoteFields from './components/RenderProjectQuoteFields';
import { EstimateBidQuote, Quote, StraightSaleQuote, ToProjectQuote } from './types';
import { Loader, Loader2 } from 'lucide-react';
import SelectBid from '@/components/SelectBid';
import SelectJob from '@/components/SelectJob';
import { useCustomerSelection } from '@/hooks/use-csutomers-selection';
import CustomerSelect from './components/CustomerSelector';

const typeQuotes = [
  {
    key: "Straight Sale",
    value: "straight_sale",
  },
  {
    key: "To Project",
    value: "to_project",
  },
  {
    key: "Estimate/Bid",
    value: "estimate_bid",
  }
]

function normalizeQuoteMetadata(meta: any): QuoteState {
  const base: Partial<Quote> = {
    id: meta.id,
    quote_number: meta.quote_number,
    type_quote: meta.type_quote,
    status: meta.status,
    date_sent: meta.date_sent,
    project_title: meta.project_title,
    description: meta.description,
    estimate_id: meta.estimate_id,
    job_id: meta.job_id,
    county: meta.county,
    updated_at: meta.updated_at,
    created_at: meta.created_at,
    selectedfilesids: meta.selectedfilesids,
    aditionalFiles: meta.aditionalFiles,
    aditionalTerms: meta.aditionalTerms,
    pdf_url: meta.pdf_url,
  };

  const commonFields = {
    customer: meta.customer ?? {},
    customer_contact: meta.customer_contact ?? {},
    customer_email: meta.customer_email ?? "",
    customer_phone: meta.customer_phone ?? "",
    customer_address: meta.customer_address ?? "",
    customer_job_number: meta.customer_job_number ?? "",
    purchase_order: meta.purchase_order ?? "",
    etc_point_of_contact: meta.etc_point_of_contact ?? "",
    etc_poc_email: meta.etc_poc_email ?? "",
    etc_poc_phone_number: meta.etc_poc_phone_number ?? "",
    etc_branch: meta.etc_branch ?? "",
  };

  if (meta.type_quote === "straight_sale") {
    return {
      ...base,
      ...commonFields,
    } as StraightSaleQuote;
  }

  if (meta.type_quote === "to_project") {
    return {
      ...base,
      ...commonFields,
      township: meta.township ?? "",
      county: meta.county ?? "",
      sr_route: meta.sr_route ?? "",
      job_address: meta.job_address ?? "",
      ecsm_contract_number: meta.ecsm_contract_number ?? "",
      bid_date: meta.bid_date ?? "",
      start_date: meta.start_date ?? "",
      end_date: meta.end_date ?? "",
      duration: meta.duration ?? 0,
    } as ToProjectQuote;
  }

  if (meta.type_quote === "estimate_bid") {
    return {
      ...base,
      ...commonFields,
      township: meta.township ?? "",
      county: meta.county ?? "",
      sr_route: meta.sr_route ?? "",
      job_address: meta.job_address ?? "",
      ecsm_contract_number: meta.ecsm_contract_number ?? "",
      bid_date: meta.bid_date ?? "",
      start_date: meta.start_date ?? "",
      end_date: meta.end_date ?? "",
      duration: meta.duration ?? 0,
    } as EstimateBidQuote;
  }

  return base as QuoteState;
}

type QuoteState =
  | Partial<StraightSaleQuote>
  | Partial<ToProjectQuote>
  | Partial<EstimateBidQuote>;

const useNumericQuoteId = (rawId: unknown) => {
  const id = typeof rawId === 'number' && Number.isFinite(rawId) ? rawId : null
  return id
}

export default function QuoteFormContent({ showInitialAdminState = false, edit }: { showInitialAdminState?: boolean, edit?: true }) {
  const { user } = useAuth()
  const router = useRouter()
  const [quoteType, setQuoteType] = useState<"straight_sale" | "to_project" | "estimate_bid" | "">("")
  const [quoteData, setQuoteData] = useState<QuoteState | null>(null);

  const {
    selectedCustomers,
    sending,
    setSending,
    quoteId,
    jobId,
    includeTerms,
    customTerms,
    setSelectedCustomers,
    setPointOfContact,
    setJobId,
    setQuoteId,
    estimateId,
    setEstimateId,
    quoteNumber,
    setQuoteNumber,
    quoteItems,
    paymentTerms,
    emailBody,
    subject,
    ccEmails,
    bccEmails,
    pointOfContact,
    adminData,
    sender,
    notes,
    setNotes,
    quoteMetadata,
    loadingMetadata,
    setQuoteMetadata,
  } = useQuoteForm()

  const [isSaving, setIsSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [secondCounter, setSecondCounter] = useState(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const [firstSave, setFirstSave] = useState(false)
  const prevStateRef = useRef({ quoteItems, adminData, notes, quoteData: quoteData || quoteMetadata })
  const numericQuoteId = useNumericQuoteId(quoteId)
  const initCalled = useRef(false);
  const [userBranch, setUserBranch] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [files, setFiles] = useState<any>([])

  const handleFileSelect = (fileId: string) => {
    setQuoteData((prev: any) => ({
      ...prev,
      selectedfilesids: (prev?.selectedfilesids ?? []).includes(fileId)
        ? prev.selectedfilesids!.filter((id) => id !== fileId)
        : [...(prev?.selectedfilesids ?? []), fileId],
    }));
  };

  useEffect(() => {
    const fetchUserBranch = async () => {
      try {
        const res = await fetch(`/api/users?email=${user.email}`);
        const result = await res.json();
        if (result.success) setUserBranch(result.branchData[0]);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUserBranch();
  }, [user.email, edit]);

  useEffect(() => {
    async function initDraft() {
      if (initCalled.current) return;
      initCalled.current = true;

      if (!quoteId) {
        try {
          const res = await fetch("/api/quotes", { method: "POST" });
          if (!res.ok) throw new Error("Failed to create draft");
          const data = await res.json();
          setQuoteId(data.data.id);
          setQuoteNumber(data.data.quote_number || "");

          console.log("🚀 Draft initialized with:", data.data.id, data.data.quote_number);
        } catch (err) {
          console.error("Error creating draft", err);
          toast.error("Could not start a new draft");
        }
      }
    }
    initDraft();
  }, [quoteId, setQuoteId, setQuoteNumber]);

  const autosave = React.useCallback(async () => {
    if (!numericQuoteId) return false;

    try {
      const payload = {
        id: numericQuoteId,
        estimate_id: estimateId || quoteData?.estimate_id,
        job_id: jobId || quoteData?.job_id,
        status: 'DRAFT',
        subject,
        body: emailBody,
        from_email: sender?.email || null,
        recipients: [
          ...(pointOfContact ? [{ email: pointOfContact.email, point_of_contact: true }] : []),
          ...ccEmails.map((email) => ({ email, cc: true })),
          ...bccEmails.map((email) => ({ email, bcc: true })),
        ],
        customers: selectedCustomers.map(c => ({ id: c.id })),
        include_terms: includeTerms,
        custom_terms: customTerms,
        payment_terms: paymentTerms,
        ...quoteData,
      };

      const res = await fetch(`/api/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      prevStateRef.current = { quoteItems, adminData, notes, quoteData };
      setSecondCounter(1);
      if (!firstSave) setFirstSave(true);

      return true;
    } catch (err) {
      toast.error('Quote not successfully saved as draft: ' + err);
      return false;
    }
  }, [
    numericQuoteId, adminData, notes, quoteData, estimateId, jobId,
    subject, emailBody, sender, pointOfContact, ccEmails, bccEmails, selectedCustomers,
    includeTerms, customTerms, paymentTerms, firstSave
  ]);


  useEffect(() => {
    if (!numericQuoteId) return;

    const hasChanges =
      !isEqual(adminData, prevStateRef.current.adminData) ||
      !isEqual(notes, prevStateRef.current.notes) ||
      !isEqual(quoteData, prevStateRef.current.quoteData) ||
      !isEqual(
        [quoteData?.selectedfilesids, quoteData?.aditionalFiles, quoteData?.aditionalTerms],
        [prevStateRef.current.quoteData?.selectedfilesids,
        prevStateRef.current.quoteData?.aditionalFiles,
        prevStateRef.current.quoteData?.aditionalTerms]
      );

    if (!hasChanges) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      autosave();
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [adminData, notes, quoteData, numericQuoteId, autosave]);


  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondCounter((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  const handleQuoteTypeChange = (
    type: "straight_sale" | "to_project" | "estimate_bid",
    needSetObject = true
  ) => {
    setQuoteType(type);
    if (!needSetObject) return;

    const defaultValues = {
      etc_point_of_contact: user?.user_metadata?.name ?? "",
      etc_poc_email: user?.email ?? "",
      etc_poc_phone_number: userBranch?.address ?? "",
      etc_branch: userBranch?.name ?? "",
      aditionalFiles: false,
      aditionalTerms: false,
      selectedfilesids: [],
      pdf_url: ""
    };

    let newQuoteData: QuoteState = { ...quoteData };

    if (type === "straight_sale") {
      newQuoteData = {
        ...newQuoteData,
        type_quote: 'straight_sale',
        customer_name: "",
        customer: {},
        customer_contact: "",
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        customer_job_number: "",
        purchase_order: "",
        project_title: "",
        description: "",
        ...defaultValues,
      };
    }

    if (type === "to_project") {
      newQuoteData = {
        ...newQuoteData,
        type_quote: "to_project",
        job_id: null,
        customer_name: "",
        customer: null,
        customer_contact: "",
        customer_email: "juancho",
        customer_phone: "",
        customer_address: "",
        customer_job_number: "",
        purchase_order: "",
        township: "",
        county: "",
        sr_route: "",
        job_address: "",
        ecsm_contract_number: "",
        bid_date: "",
        start_date: "",
        end_date: "",
        duration: 0,
        project_title: "jajajja",
        description: "",
        ...defaultValues,
      };
    }

    if (type === "estimate_bid") {
      newQuoteData = {
        ...newQuoteData,
        type_quote: "estimate_bid",
        estimate_id: null,
        customer_name: "",
        customer: null,
        customer_contact: "",
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        customer_job_number: "",
        township: "",
        county: "",
        sr_route: "",
        job_address: "",
        ecsm_contract_number: "",
        bid_date: "",
        start_date: "",
        end_date: "",
        duration: 0,
        project_title: "",
        description: "",
        ...defaultValues,
      };
    }

    setQuoteData(newQuoteData);
    handleSaveQuote(newQuoteData);
  };

  async function handleSaveQuote(dataToSave?: QuoteState) {
    if (!quoteId) return;

    const payload = { ...dataToSave || quoteData, id: quoteId };

    try {
      const result = await fetch('/api/quotes', {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await result.json();


    } catch (error) {
      toast.error("There was an error updating the quote");
      console.log(error);
    }
  }

  const handleGenerateAndUpload = async (): Promise<string | null> => {
    try {
      if (!quoteId) {
        toast.error("No quote available")
        return null
      }

      const pdfBlob = await ReactPDF.pdf(
        <BidProposalReactPDF
          notes={notes}
          adminData={adminData ?? defaultAdminObject}
          items={quoteItems}
          customers={selectedCustomers}
          quoteDate={new Date()}
          quoteNumber={quoteId?.toString() ?? ""}
          pointOfContact={pointOfContact ?? { name: "", email: "" }}
          sender={sender}
          paymentTerms={paymentTerms as PaymentTerms}
          includedTerms={includeTerms}
          customTaC={includeTerms['custom-terms'] ? customTerms : ''}
          county={adminData?.county?.country || ''}
          sr={adminData?.srRoute || ''}
          ecms={adminData?.contractNumber || ''}
          quoteData={quoteData}
          quoteType={quoteType || "straight_sale"}
          termsAndConditions={quoteData?.aditionalTerms}
        />
      ).toBlob()

      const formData = new FormData()
      formData.append("quoteId", quoteId.toString())
      formData.append("uniqueIdentifier", quoteId.toString())
      formData.append("file", new File([pdfBlob], `Quote-${quoteId}.pdf`, { type: "application/pdf" }))

      const filesToUpload = files.filter((f) => quoteData?.selectedfilesids?.includes(f.id))

      for (const f of filesToUpload) {
        const response = await fetch(f.file_url)
        const blob = await response.blob()
        const file = new File([blob], f.filename, { type: f.file_type })
        formData.append("file", file)
      }
      const res = await fetch("/api/files/combine-pdfs", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error merging PDFs")

      setQuoteData((prev: any) => ({
        ...prev,
        pdf_url: data.url
      }))

      return data.url
    } catch (err) {
      console.error("Error generating/uploading PDF:", err)
      toast.error("Could not generate PDF")
      return null
    }
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)

      const url = await handleGenerateAndUpload()
      if (!url) return

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch PDF")

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `Quote-${quoteId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Release the blob URL
      window.URL.revokeObjectURL(blobUrl)

    } catch (error) {
      console.log(error)
    } finally {
      setDownloading(false)
    }
  }


  const handleSendQuote = async () => {
    if (!numericQuoteId || !pointOfContact) {
      toast.error("A point of contact is required to send the quote.");
      return;
    }

    setSending(true);
    try {
      const saved = await autosave();
      if (!saved) {
        throw new Error("Could not save the latest draft before sending.");
      }

      const res = await fetch('/api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: numericQuoteId }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to send quote email.");
      }

      toast.success("Quote sent successfully!");
      router.push('/quotes');

    } catch (error: any) {
      console.error("Error sending quote:", error);
      toast.error(error.message || "An unexpected error occurred while sending the quote.");
    } finally {
      setSending(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    try {
      setIsSaving(true)
      const success = await autosave()
      if (success) router.push('/quotes')
    } catch (error) {
      toast.error('Could not save draft before exiting: ' + error)
    } finally {
      setIsSaving(false)
    }
  }

  const getSaveStatusMessage = () => {
    if (isSaving && !firstSave) return 'Saving...'
    if (!firstSave) return ''
    if (secondCounter < 60) {
      return `Draft saved ${secondCounter} second${secondCounter !== 1 ? 's' : ''
        } ago`
    } else if (secondCounter < 3600) {
      const minutesAgo = Math.floor(secondCounter / 60)
      return `Draft saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''
        } ago`
    } else {
      const hoursAgo = Math.floor(secondCounter / 3600)
      return `Draft saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
    }
  }

  React.useEffect(() => {
    if (quoteMetadata?.id) {
      const normalizedQuote = normalizeQuoteMetadata(quoteMetadata);
      setQuoteData(prev => ({
        ...normalizedQuote,
        etc_point_of_contact: prev?.etc_point_of_contact || user?.user_metadata?.name || "",
        etc_poc_email: prev?.etc_poc_email || user?.email || "",
        etc_poc_phone_number: prev?.etc_poc_phone_number || userBranch?.address || "",
        etc_branch: prev?.etc_branch || userBranch?.name || "",
      }));
      handleQuoteTypeChange(normalizedQuote.type_quote as any, false);
    }
  }, [quoteMetadata, user, userBranch]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeaderWithSaving
        heading="Create Quote"
        handleSubmit={handleSaveAndExit}
        showX
        saveButtons={
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {getSaveStatusMessage()}
            </div>
            <div className="flex items-center gap-2">
              <QuotePreviewButton quoteType={quoteType} termsAndConditions={quoteData?.aditionalTerms || false} />
              <Button disabled={downloading} variant="outline" onClick={handleDownload}>
                {downloading ? (
                  <Loader className="animate-spin w-5 h-5 text-gray-600" />
                ) : (
                  "Download"
                )}
              </Button>
              <Button disabled={sending || !pointOfContact} onClick={handleSendQuote}>
                {sending ? 'Sending...' : 'Send Quote'}
              </Button>
            </div>
          </div>
        }
      />

      <div className="flex gap-6 p-6 max-w-full">
        {
          loadingMetadata ? (
            <div className=' w-1/2 h-full flex flex-row items-center justify-center'>
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className='flex w-1/2 flex-col'>
              <div className="flex flex-row gap-4 mb-4 w-full">
                <div className="w-1/2 gap-4">
                  <p className="font-semibold mb-1">Quote Type</p>
                  <Select onValueChange={handleQuoteTypeChange} value={quoteType || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Quote Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeQuotes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {quoteType === "straight_sale" && quoteData && (
                  <div className='w-1/2'>
                    <CustomerSelect
                      data={quoteData as any}
                      setData={setQuoteData}
                    />
                  </div>
                )}

                {quoteType === "to_project" && quoteData && (
                  <div className="w-1/2">
                    <p className="font-semibold mb-1">Select a job number</p>
                    <SelectJob
                      quoteData={quoteData}
                      onChangeQuote={setQuoteData}
                      selectedJob={selectedJob}
                      onChange={setSelectedJob}
                    />
                  </div>
                )}

                {quoteType === "estimate_bid" && quoteData && (
                  <div className="w-1/2">
                    <p className="font-semibold mb-1">Select a contract number</p>
                    <SelectBid
                      quoteData={quoteData}
                      selectedBid={selectedBid}
                      onChange={setSelectedBid}
                    />
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className='my-4'>
                {quoteType === "straight_sale" && quoteData && (
                  <RenderSaleQuoteFields
                    data={quoteData as Partial<StraightSaleQuote>}
                    setData={setQuoteData}
                  />
                )}

                {quoteType === "to_project" && quoteData && (
                  <RenderProjectQuoteFields
                    selectedJob={selectedJob}
                    data={quoteData as Partial<ToProjectQuote>}
                    setData={setQuoteData}
                    onSaveData={handleSaveQuote}
                  />
                )}

                {quoteType === "estimate_bid" && quoteData && (
                  <RenderEstimateBidQuoteFields
                    selectedBid={selectedBid}
                    data={quoteData as Partial<EstimateBidQuote>}
                    setData={setQuoteData}
                    onSaveData={handleSaveQuote}
                  />
                )}
              </div>

              <div className='my-4'>
                <QuoteItems />
              </div>

              <div className='my-4'>
                <QuoteAdditionalFiles
                  setQuoteData={setQuoteData}
                  quoteData={quoteData}
                  handleFileSelect={(field: any) => handleFileSelect(field)}
                  files={files}
                  setFiles={setFiles} />
              </div>
            </div>
          )
        }

        <div className="w-1/2 space-y-6">
          <div className="bg-[#F4F5F7] p-6 rounded-lg sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            <div className="min-h-[1000px] overflow-y-auto bg-white p-4 mt-4 border rounded-md">
              <BidProposalWorksheet
                quoteData={quoteData}
                quoteType={quoteType || "straight_sale"}
                notes={notes}
                adminData={adminData ?? defaultAdminObject}
                items={quoteItems}
                customers={selectedCustomers}
                quoteDate={new Date()}
                quoteNumber={quoteNumber || quoteId?.toString() || ''}
                pointOfContact={pointOfContact ?? { name: '', email: '' }}
                sender={sender}
                paymentTerms={paymentTerms as PaymentTerms}
                includedTerms={includeTerms}
                customTaC={includeTerms['custom-terms'] ? customTerms : ''}
                county={adminData ? adminData.county?.name || '' : ''}
                sr={adminData ? adminData.srRoute || '' : ''}
                ecms={adminData ? adminData.contractNumber || '' : ''}
                termsAndConditions={quoteData?.aditionalTerms}
                files={files.filter((f) => quoteData?.selectedfilesids?.includes(f.id))}
              />
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
