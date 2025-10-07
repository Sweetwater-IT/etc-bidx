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
import { Check, Edit2, Loader, Loader2, X } from 'lucide-react';
import SelectBid from '@/components/SelectBid';
import SelectJob from '@/components/SelectJob';
import { useCustomerSelection } from '@/hooks/use-csutomers-selection';
import CustomerSelect from './components/CustomerSelector';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from 'recharts';

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

const exclusions = "Arrow Panels/Changeable Message Sign/Radar Trailer unless specified\nShadow vehicles/Truck Mounted Attenuators and operators unless specified\nTraffic Signal activation/deactivation/flash (contractors responsibility)\nTemporary signals, lighting, related signage and traffic control unless specified\nAll Traffic Signal Work, modifying\nShop/plan drawings and/or layout for MPT signing – professional engineering services\nWork Zone Liquidated Damages\nHoliday or work stoppage removal of signs and/or devices\nPavement Marking and Removal\nNotification of (including permits from) officials (i.e., Police, Government, DOT)/business and property owners\nAll electrical work/line and grade work/Location of Utilities Not Covered by PA One Call\nIncidental items not specifically included above";

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
    notes: meta.notes || '',
    exclusions: meta.exclusions ?? exclusions,
    tax_rate: meta.tax_rate,
    aditionalExclusions: meta.aditionalExclusions,
  };

  const commonFields = {
    customer: meta.customer ?? {},
    customer_name: meta.customer_name,
    customer_contact: meta.customer_contact ?? {},
    customer_email: meta.customer_email ?? "",
    customer_phone: meta.customer_phone ?? "",
    customer_address: meta.customer_address ?? "",
    customer_job_number: meta.customer_job_number ?? "",
    purchase_order: meta.purchase_order ?? "",
    etc_point_of_contact: meta.etc_point_of_contact ?? "",
    etc_poc_email: meta.etc_poc_email ?? "",
    etc_poc_phone_number: "",
    etc_branch: meta.etc_branch ?? "",
    etc_job_number: meta.etc_job_number ?? ""
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
      etc_job_number: meta.etc_job_number ?? ""
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
  const [creatingQuote, setCreatingQuote] = useState<boolean>(false);

  const [editAll, setEditAll] = useState(false)
  const [tempData, setTempData] = useState<QuoteState | null>(null)

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
    setQuoteItems,
    canAutosave
  } = useQuoteForm()

  const [isSaving, setIsSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [secondCounter, setSecondCounter] = useState(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const [firstSave, setFirstSave] = useState(false)
  const prevStateRef = useRef({ quoteItems, adminData, notes, quoteData: quoteMetadata || quoteMetadata })
  const numericQuoteId = useNumericQuoteId(quoteId)
  const [userBranch, setUserBranch] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [files, setFiles] = useState<any>([])



  const handleFileSelect = (fileId: string) => {
    setQuoteMetadata((prev: any) => ({
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
    if (quoteId) {
      autosave();
      return;
    }

    const shouldCreate =
      (quoteMetadata?.type_quote === "straight_sale" && quoteMetadata?.customer && quoteMetadata.customer_name) ||
      (quoteMetadata?.type_quote === "to_project" && quoteMetadata?.job_id) ||
      (quoteMetadata?.type_quote === "estimate_bid" && quoteMetadata?.estimate_id);

    if (shouldCreate) {
      handleCreateDraft().then((data: any) => {
        if (data?.success) {
          setQuoteId(data.data.id);
        }
      });
    }
  }, [
    quoteMetadata?.type_quote,
    quoteMetadata?.customer,
    quoteMetadata?.job_id,
    quoteMetadata?.estimate_id,
    selectedJob,
  ]);

  const createQuoteBase = async (status: "DRAFT" | "NOT SENT") => {
    const payload = {
      type_quote: quoteMetadata?.type_quote,
      status,
      subject,
      body: emailBody,
      from_email: sender?.email || null,
      recipients: [
        ...(pointOfContact ? [{ email: pointOfContact.email, point_of_contact: true }] : []),
        ...ccEmails.map((email) => ({ email, cc: true })),
        ...bccEmails.map((email) => ({ email, bcc: true })),
      ],
      notes,
      ...quoteMetadata,
      items: quoteItems,
      quoteId: quoteId
    };

    const res = await fetch("/api/quotes", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    return res.json();
  };

  const handleCreateDraft = async () => {
    const res = await createQuoteBase("DRAFT");
    if (res.success) {
      setQuoteId(res.data.id);
      setQuoteNumber(res.data.quote_number);
      setQuoteMetadata((prev) => ({
        ...prev,
        id: res.data.id,
        quote_number: res.data.quote_number,
        status: "DRAFT",
      }));
    }
    return res;
  };
  const handleCreateQuote = async () => {
    try {
      setCreatingQuote(true);

      const data = await createQuoteBase("NOT SENT");

      if (data.success) {
        const uploadedFiles: { name: string; url: string }[] = [];
        for (const file of files) {
          try {
            const response = await fetch(file.preview);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append("file", new File([blob], file.name, { type: file.type }));
            formData.append("uniqueIdentifier", data.data.id?.toString() || "temp");
            formData.append("folder", "quotes");

            const uploadRes = await fetch("/api/files", {
              method: "POST",
              body: formData,
            });

            const uploadData = await uploadRes.json();
            if (uploadData.success) {
              uploadedFiles.push({
                name: file.name,
                url: uploadData.url,
              });
            }
          } catch (err) {
            console.error(`Unexpected error uploading file ${file.name}:`, err);
          }
        }

        router.push('/quotes')
        toast.success("Quote created successfully!");
      }

    } catch (err) {
      console.error("Error creating quote", err);
      toast.error("Could not create quote");
    } finally {
      setCreatingQuote(false);
    }
  };

  const autosave = React.useCallback(async () => {
    if (!numericQuoteId || !canAutosave) return false;

    try {
      const payload = {
        id: numericQuoteId,
        estimate_id: estimateId || quoteMetadata?.estimate_id,
        job_id: jobId || quoteMetadata?.job_id,
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
        ...quoteMetadata,
      };

      const res = await fetch(`/api/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      prevStateRef.current = { quoteItems, adminData, notes, quoteData: quoteMetadata };
      setSecondCounter(1);
      if (!firstSave) setFirstSave(true);

      return true;
    } catch (err) {
      toast.error('Quote not successfully saved as draft: ' + err);
      return false;
    }
  }, [
    numericQuoteId, adminData, notes, quoteMetadata, estimateId, jobId,
    subject, emailBody, sender, pointOfContact, ccEmails, bccEmails, selectedCustomers,
    includeTerms, customTerms, paymentTerms, firstSave
  ]);


  useEffect(() => {
    if (!numericQuoteId) return;

    const hasChanges =
      !isEqual(adminData, prevStateRef.current.adminData) ||
      !isEqual(notes, prevStateRef.current.notes) ||
      !isEqual(quoteMetadata, prevStateRef.current.quoteData) ||
      !isEqual(
        [quoteMetadata?.selectedfilesids, quoteMetadata?.aditionalFiles, quoteMetadata?.aditionalTerms],
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
  }, [adminData, notes, quoteMetadata, numericQuoteId, autosave]);


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
    setQuoteMetadata((prev) => ({
      ...prev,
      type_quote: type
    }));
    if (!needSetObject) return;
    const today = new Date().toISOString().slice(0, 10);


    const defaultValues = {
      etc_point_of_contact: user?.user_metadata?.name ?? "",
      etc_poc_email: user?.email ?? "",
      etc_poc_phone_number: "",
      etc_branch: userBranch?.name ?? "",
      aditionalFiles: false,
      aditionalTerms: false,
      selectedfilesids: [],
      pdf_url: "",
      tax_rate: 6,
      exclusions: exclusions,
      aditionalExclusions: false
    };

    let newQuoteData: QuoteState = { ...quoteMetadata };

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
        bid_date: today,
        start_date: today,
        end_date: today,
        duration: 0,
        project_title: "",
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
        bid_date: today,
        start_date: today,
        end_date: today,
        duration: 0,
        project_title: "",
        description: "",
        ...defaultValues,
      };
    }

    setQuoteMetadata(newQuoteData);
    handleSaveQuote(newQuoteData);
  };

  async function handleSaveQuote(dataToSave?: QuoteState) {
    if (!quoteId) return;

    const payload = { ...dataToSave || quoteMetadata, id: quoteId };

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
          exclusions={quoteMetadata?.exclusions}
          notes={quoteMetadata?.notes}
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
          quoteData={quoteMetadata}
          quoteType={quoteMetadata?.type_quote || "straight_sale"}
          termsAndConditions={quoteMetadata?.aditionalTerms}
          allowExclusions={quoteMetadata?.aditionalExclusions}
        />
      ).toBlob()

      const formData = new FormData()
      formData.append("quoteId", quoteId.toString())
      formData.append("uniqueIdentifier", quoteId.toString())
      formData.append("file", new File([pdfBlob], `Quote-${quoteId}.pdf`, { type: "application/pdf" }))

      const filesToUpload = files.filter((f) => quoteMetadata?.selectedfilesids?.includes(f.id))

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

      setQuoteMetadata((prev: any) => ({
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

  const handleSaveAndExit = async () => {
    if (!quoteId) {
      router.push('/quotes')
    }
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
    if (quoteMetadata?.id && quoteMetadata?.type_quote && canAutosave) {
      const normalizedQuote = normalizeQuoteMetadata(quoteMetadata);
      setQuoteMetadata(prev => ({
        ...prev,
        etc_point_of_contact: prev?.etc_point_of_contact || user?.user_metadata?.name || "",
        etc_poc_email: prev?.etc_poc_email || user?.email || "",
        etc_poc_phone_number: prev?.etc_poc_phone_number || "",
        etc_branch: prev?.etc_branch || userBranch?.name || "",
      }));
      handleQuoteTypeChange(normalizedQuote.type_quote as any, false);
    }
  }, [quoteMetadata?.type_quote]);

  const handleEditClick = () => {
    setTempData(quoteMetadata)
    setEditAll(true)
  }

  const handleSaveClick = async () => {
    if (quoteMetadata) {
      await handleSaveQuote(quoteMetadata)
    }
    setEditAll(false)
    setTempData(null)
  }

  const handleCancelClick = () => {
    if (tempData) setQuoteMetadata(tempData)
    setEditAll(false)
    setTempData(null)
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeaderWithSaving
        heading={(edit ? "Edit" : "Create") + " Quote"}
        handleSubmit={handleSaveAndExit}
        showX
        saveButtons={
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {getSaveStatusMessage()}
            </div>
            <div className="flex items-center gap-2">
              <QuotePreviewButton exclusion={quoteMetadata?.exclusions ?? ''} quoteType={quoteMetadata?.type_quote} termsAndConditions={quoteMetadata?.aditionalTerms || false} />
              <Button disabled={downloading} variant="outline" onClick={handleDownload}>
                {downloading ? (
                  <Loader className="animate-spin w-5 h-5 text-gray-600" />
                ) : (
                  "Download"
                )}
              </Button>
              {!edit && (
                <Button disabled={!quoteMetadata?.type_quote} onClick={handleCreateQuote}>
                  {
                    creatingQuote ?
                      <Loader className="animate-spin w-5 h-5 text-gray-600" />
                      :
                      "Create quote"
                  }
                </Button>
              )}
            </div>
          </div>
        }
      />

      <div className="flex gap-6 p-6 pt-0 pr-0 max-w-full">
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
                  <Select onValueChange={handleQuoteTypeChange} value={quoteMetadata?.type_quote || ""}>
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

                {quoteMetadata?.type_quote === "straight_sale" && quoteMetadata && (
                  <div className='w-1/2'>
                    <CustomerSelect
                      data={quoteMetadata as any}
                      setData={setQuoteMetadata}
                    />
                  </div>
                )}

                {quoteMetadata?.type_quote === "to_project" && quoteMetadata && (
                  <div className="w-1/2">
                    <p className="font-semibold mb-1">Select a job number</p>
                    <SelectJob
                      quoteData={quoteMetadata}
                      onChangeQuote={setQuoteMetadata}
                      selectedJob={selectedJob}
                      onChange={setSelectedJob}
                    />
                  </div>
                )}

                {quoteMetadata?.type_quote === "estimate_bid" && quoteMetadata && (
                  <div className="w-1/2">
                    <p className="font-semibold mb-1">Select a contract number</p>
                    <SelectBid
                      quoteData={quoteMetadata}
                      selectedBid={selectedBid}
                      onChange={setSelectedBid}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-row justify-end gap-2 mb-4">
                {!editAll ? (
                  <Button variant={'link'} size="sm" onClick={handleEditClick} className="flex items-center gap-2 underline">
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={handleSaveClick} className="flex items-center gap-2">
                      <Check className="w-2 h-2" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelClick} className="flex items-center gap-2">
                      <X className="w-2 h-2" /> Cancel
                    </Button>
                  </>
                )}
              </div>

              <div className='my-4'>
                {quoteMetadata?.type_quote === "straight_sale" && quoteMetadata && (
                  <RenderSaleQuoteFields
                    data={quoteMetadata as Partial<StraightSaleQuote>}
                    setData={setQuoteMetadata}
                    editAll={editAll}
                  />
                )}

                {quoteMetadata?.type_quote === "to_project" && quoteMetadata && (
                  <RenderProjectQuoteFields
                    selectedJob={selectedJob}
                    data={quoteMetadata as Partial<ToProjectQuote>}
                    setData={setQuoteMetadata}
                    onSaveData={handleSaveQuote}
                    editAll={editAll}
                  />
                )}

                {quoteMetadata?.type_quote === "estimate_bid" && quoteMetadata && (
                  <RenderEstimateBidQuoteFields
                    selectedBid={selectedBid}
                    data={quoteMetadata as Partial<EstimateBidQuote>}
                    setData={setQuoteMetadata}
                    onSaveData={handleSaveQuote}
                    editAll={editAll}
                    setQuoteItems={setQuoteItems}
                  />
                )}
              </div>

              <div className='my-4'>
                <QuoteItems />
              </div>

              <div className="my-4">
                <p className="font-semibold mb-2">Notes</p>
                <Textarea
                  value={quoteMetadata?.notes || ""}
                  onChange={(e) =>
                    setQuoteMetadata((prev: any) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Add your notes here..."
                  maxLength={5000}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                <p className="text-sm text-gray-500 text-right mt-1">
                  {5000 - (quoteMetadata?.notes?.length || 0)} characters remaining
                </p>
              </div>

              <div className="my-4">
                <div className='flex justify-between items-center'>
                  <p className="font-semibold mb-2">Exclusions</p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      className='shadow-sm'
                      id="terms"
                      checked={quoteMetadata?.aditionalExclusions || false}
                      onCheckedChange={(checked) =>
                        setQuoteMetadata(prev => ({ ...prev, aditionalExclusions: !!checked }))
                      }
                    />
                    <p>Include?</p>
                  </div>
                </div>
                <Textarea
                  value={quoteMetadata?.exclusions || exclusions}
                  onChange={(e) => setQuoteMetadata((prev: any) => ({
                    ...prev,
                    exclusions: e.target.value
                  }))}
                  maxLength={5000}
                  placeholder="Add your exclusion here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div className='my-4'>
                <QuoteAdditionalFiles
                  setQuoteData={setQuoteMetadata}
                  quoteData={quoteMetadata}
                  handleFileSelect={(field: any) => handleFileSelect(field)}
                  files={files}
                  setFiles={setFiles} />
              </div>
            </div>
          )
        }

        <div className="w-1/2 space-y-6">
          <div className="bg-[#F4F5F7] p-6 rounded-lg sticky mt-[-22px]">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            <div className="min-h-[1000px] overflow-y-auto bg-white p-4 mt-4 border rounded-md">
              <BidProposalWorksheet
                allowExclusions={quoteMetadata?.aditionalExclusions}
                exclusions={quoteMetadata?.exclusions}
                quoteData={quoteMetadata}
                quoteType={quoteMetadata?.type_quote || "straight_sale"}
                notes={quoteMetadata?.notes}
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
                termsAndConditions={quoteMetadata?.aditionalTerms}
                files={files.filter((f) => quoteMetadata?.selectedfilesids?.includes(f.id))}
              />
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
