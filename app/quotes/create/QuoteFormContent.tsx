'use client'

import { Button } from '@/components/ui/button'
import React, { useEffect, useState, useRef, useCallback } from 'react'
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
import { QuoteItem } from '@/types/IQuoteItem';

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

const termsString = `PLEASE NOTE THE FOLLOWING CONDITIONS MUST BE INCLUDED ON ALL SUBCONTRACT AGREEMENTS:
\t• The Contractor is responsible for all lost, stolen, damaged materials and equipment. In the event of lost, stolen or damaged material or equipment the contractor will be invoiced at replacement cost. Payment terms for lost, stolen, or damaged material are Net 30 days.
\t• All material supplied and quoted pricing is project specific and shall only be used for the quoted project.
\t• Payment terms for sale items accepted as a part of this proposal are Net 14 days. All rental invoices accepted as a part of this proposal are net 30 days.
\t• Quoted pricing does not include sales tax, delivery or shipping unless explicitly stated.
\t• No additional work will be performed without a written change order. Extra work orders signed by an agent of the contractor shall provide full payment within 30 days of invoice date, regardless of whether the project owner has paid the contractor.
\t• If payment by owner to contractor is delayed due to a dispute between owner and contractor, not involving the work performed by Established Traffic Control, Inc. (“ETC”), then payment by the contractor to ETC shall not likewise be delayed.
\t• All pricing for sale items is valid for 60 days from quote date. Sale items requested 60 days or more after quote date require a revised quote.
\t• Permanent sign items are subject to a 5% escalation per year throughout the contract duration, effective December 31 of every year from original quote date to contract end.
\t• ETC requires a minimum notice of 14 business days’ (28 days for permanent signs) for all projects start and/or changes with approved drawings or additional fees may apply.
\t• Retainage will not be withheld on subcontractor agreements less than $50,000.
\t• No retainage will be withheld on rental or sale items regardless of value / price.
\t• Contractor must supply certificate of insurance for rental items upon pick-up.`;

const exclusions = `PLEASE NOTE THE FOLLOWING ITEMS OR SERVICES ARE EXCLUDED FROM OUR PROPOSAL UNLESS OTHERWISE STATED:
\t• Traffic control supervisor, unless otherwise noted.
\t• Notification of (including permits from) officials (i.e. police, government, DOT), business and / or property owners.
\t• Core drilling, backfilling, grading, excavation or removal of excavated material.
\t• Snow and / or ice removal for placement maintenance and / or removal of temporary signs.
\t• Short-term signs and stands.
\t• Constant surveillance, daily adjustments / resets, pedestrian protection.
\t• Shop / plan drawings and / or layout for MPT signing.
\t• High reach trucks and / or overhead signage.
\t• Shadow vehicles and operators, unless specified above.
\t• Arrow panels, message boards, shadow vehicles, radar trailers, shadow vehicles (and operators), unless specified above.
\t• Reinstallation of signs removed by the contractor for construction.
\t• Restoration or surface repairs.
\t• Temporary signals, lighting, related signage.
\t• Temporary rumble strips, pavement marking or delineators, unless otherwise specified.
\t• Holiday or work stoppage removal of signs and / or devices.`;



export async function createQuoteItem(item: QuoteItem) {
  const res = await fetch("/api/quotes/quoteItems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  return res.json();
}


function normalizeQuoteMetadata(meta: any): QuoteState {
  const base: Partial<Quote> = {
    id: meta.id,
    quote_number: meta.quote_number,
    type_quote: meta.type_quote,
    status: meta.status,
    date_sent: meta.date_sent,
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
    exclusionsText: meta.exclusionsText ?? exclusions,
    termsText: meta.termsText ?? termsString,
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
  const didInitRef = useRef(false);

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
    if (loadingMetadata) return;

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
    loadingMetadata
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
      quoteId: quoteId,
      userEmail: user.email,
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
    if (!numericQuoteId || !canAutosave || loadingMetadata) return false;

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
    includeTerms, customTerms, paymentTerms, firstSave, quoteItems
  ]);


  useEffect(() => {
    if (!numericQuoteId || loadingMetadata) return;

    const hasChanges =
      !isEqual(adminData, prevStateRef.current.adminData) ||
      !isEqual(notes, prevStateRef.current.notes) ||
      !isEqual(quoteMetadata, prevStateRef.current.quoteData) ||
      !isEqual(
        [quoteMetadata?.selectedfilesids, quoteMetadata?.aditionalFiles, quoteMetadata?.aditionalTerms, quoteMetadata?.aditionalExclusions],
        [prevStateRef.current.quoteData?.selectedfilesids,
        prevStateRef.current.quoteData?.aditionalFiles,
        prevStateRef.current.quoteData?.aditionalTerms,
        prevStateRef.current.quoteData?.aditionalExclusions,]
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

  const secondCounterRef = useRef(0);


  const getSaveStatusMessage = useCallback(() => {
    const secondCounter = secondCounterRef.current;
    if (isSaving && !firstSave) return 'Saving...';
    if (!firstSave) return '';
    if (secondCounter < 60) {
      return `Draft saved ${secondCounter} second${secondCounter !== 1 ? 's' : ''} ago`;
    } else if (secondCounter < 3600) {
      const minutesAgo = Math.floor(secondCounter / 60);
      return `Draft saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
    } else {
      const hoursAgo = Math.floor(secondCounter / 3600);
      return `Draft saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
    }
  }, [isSaving, firstSave]);

  const SecondCounterComponent = ({ getSaveStatusMessage }: { getSaveStatusMessage: () => string }) => {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
      const intervalId = setInterval(() => {
        secondCounterRef.current += 1;
        forceUpdate((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(intervalId);
    }, []);

    return <span>{getSaveStatusMessage()}</span>;
  };

  const SecondCounter = React.memo(SecondCounterComponent);
  SecondCounter.displayName = 'SecondCounter';

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
      aditionalFiles: true,
      aditionalTerms: true,
      selectedfilesids: [],
      pdf_url: "",
      tax_rate: 6,
      exclusionsText: exclusions,
      termsText: termsString,
      aditionalExclusions: true
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
        customer_email: "",
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
          exclusions={quoteMetadata?.exclusionsText}
          terms={quoteMetadata?.termsText}
          notes={quoteMetadata?.notes}
          items={quoteItems}
          quoteStatus={quoteMetadata?.status || ""}
          quoteDate={new Date()}
          quoteData={quoteMetadata}
          quoteType={quoteMetadata?.type_quote || "straight_sale"}
          termsAndConditions={quoteMetadata?.aditionalTerms}
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


  React.useEffect(() => {
    if (quoteMetadata?.id && quoteMetadata?.type_quote && canAutosave) {
      const normalizedQuote = normalizeQuoteMetadata(quoteMetadata);

      setQuoteMetadata(prev => {
        const updated = {
          ...prev,
          etc_point_of_contact: prev?.etc_point_of_contact || user?.user_metadata?.name || "",
          etc_poc_email: prev?.etc_poc_email || user?.email || "",
          etc_poc_phone_number: prev?.etc_poc_phone_number || "",
          etc_branch: prev?.etc_branch || userBranch?.name || "",
        };
        return isEqual(prev, updated) ? prev : updated;
      });

      if (quoteMetadata.type_quote !== normalizedQuote.type_quote) {
        handleQuoteTypeChange(normalizedQuote.type_quote as any, false);
      }
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

  const importItems = async (
    bid: any
  ) => {
    if (!bid || !quoteId) return;
    console.log(bid);

    const existingNumbers = quoteItems.map(item => item.itemNumber);

    const rentalItems = (bid.equipment_rental || [])
      .filter((item: any) => !existingNumbers.includes(item.item_number))
      .map((item: any) => ({
        itemNumber: item.item_number,
        description: item.name,
        uom: 'EA',
        notes: item.notes || "",
        quantity: item.quantity,
        unitPrice: item.revenue / item.quantity,
        discount: 0,
        discountType: 'dollar',
        associatedItems: [],
        isCustom: false,
        tax: 0,
        is_tax_percentage: false,
        quote_id: quoteId
      }));

    const saleItems = (bid.sale_items || [])
      .filter((item: any) => !existingNumbers.includes(item.item_number))
      .map((item: any) => ({
        itemNumber: item.item_number,
        description: item.name,
        uom: 'EA',
        notes: item.notes || "",
        quantity: item.quantity,
        unitPrice: item.quotePrice / item.quantity,
        discount: 0,
        discountType: 'dollar',
        associatedItems: [],
        isCustom: false,
        tax: 0,
        is_tax_percentage: false,
        quote_id: quoteId,
      }));

    const phaseItems = (bid.mpt_rental.phases || [])
      .filter((phase: any) => phase.itemNumber && phase.itemName)
      .filter((phase: any) => !existingNumbers.includes(phase.itemNumber))
      .map((phase: any) => {
        const baseRevenue = bid.mpt_rental._summary?.revenue || 0;

        const serviceWorksCost = bid.service_work
          ? Object.values(bid.service_work).reduce(
            (sum: number, sw: any) => sum + (sw.cost || 0),
            0
          )
          : 0;

        const flaggingCost = bid.flagging
          ? Object.values(bid.flagging).reduce(
            (sum: number, fg: any) => sum + (fg.cost || 0),
            0
          )
          : 0;

        const totalPhaseCost = baseRevenue + serviceWorksCost + flaggingCost;

        return {
          itemNumber: phase.itemNumber,
          description: phase.itemName,
          uom: "EA",
          notes: "",
          quantity: 1,
          unitPrice: totalPhaseCost,
          extendedPrice: totalPhaseCost,
          discount: 0,
          discountType: "dollar",
          associatedItems: [],
          isCustom: false,
          tax: 0,
          is_tax_percentage: false,
          quote_id: quoteId,
        };
      });

    if (rentalItems.length === 0 && saleItems.length === 0 && phaseItems.length === 0)
      return;

    const allItems = [...rentalItems, ...saleItems, ...phaseItems];

    const finalList = await Promise.all(
      allItems.map(async (item) => {
        const result = await createQuoteItem(item);
        return result.item;
      })
    );

    setQuoteItems((prev) => [...finalList, ...prev,]);
  };

  const combinedText = `${quoteMetadata?.exclusionsText || ''}\n---TERMS---\n${quoteMetadata?.termsText || ''}`;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeaderWithSaving
        heading={(edit ? "Edit" : "Create") + " Quote"}
        handleSubmit={handleSaveAndExit}
        showX
        saveButtons={
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <SecondCounter getSaveStatusMessage={getSaveStatusMessage} />

            </div>
            <div className="flex items-center gap-2">
              <QuotePreviewButton terms={quoteMetadata?.termsText} exclusion={quoteMetadata?.exclusionsText ?? ''} quoteType={quoteMetadata?.type_quote} termsAndConditions={quoteMetadata?.aditionalTerms || false} />
              <Button disabled={downloading || !quoteId} variant="outline" onClick={handleDownload}>
                {downloading ? (
                  <>
                    <p>Downloading </p>
                    <Loader className="animate-spin w-5 h-5 text-gray-600" />
                  </>
                ) : (
                  "Download"
                )}
              </Button>
              {!edit ? (
                <Button disabled={!quoteMetadata?.type_quote} onClick={handleCreateQuote}>
                  {creatingQuote ? (
                    <Loader className="animate-spin w-5 h-5 text-gray-600" />
                  ) : (
                    "Create quote"
                  )}
                </Button>
              ) : (
                <Button
                  variant="default"
                  disabled={!firstSave}
                  onClick={() => router.push(`/quotes/view/${quoteId}`)}
                >
                  Update Quote
                </Button>
              )}
            </div>
          </div>
        }
      />

      <div className="flex gap-4 p-6 pt-0 pr-0 max-w-full h-[calc(100vh-80px)] overflow-hidden">
        {
          loadingMetadata ? (
            <div className=' w-1/2 h-full flex flex-row items-center justify-center'>
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="flex w-1/2 flex-col overflow-y-auto px-2">
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
                      onChangeQuote={setQuoteMetadata}
                      selectedBid={selectedBid}
                      onChange={setSelectedBid}
                      extraFunctionCall={(bid) =>
                        importItems(bid)
                      }
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
                  <p className="font-semibold mb-2">Terms and Condition</p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      className='shadow-sm'
                      id="terms"
                      checked={quoteMetadata?.aditionalTerms || false}
                      onCheckedChange={(checked) =>
                        setQuoteMetadata(prev => ({ ...prev, aditionalTerms: !!checked }))
                      }
                    />
                    <p>Include?</p>
                  </div>
                </div>
                <Textarea
                  value={combinedText}
                  onChange={(e) => {
                    let value = e.target.value;

                    if (!value.includes('---TERMS---')) {
                      value = value + '\n---TERMS---';
                    }

                    const lines = value.split("\n");
                    const separatorIndex = lines.indexOf("---TERMS---");

                    let newExclusions: string[] = [];
                    let newTerms: string[] = [];

                    if (separatorIndex >= 0) {
                      newExclusions = lines.slice(0, separatorIndex);
                      newTerms = lines.slice(separatorIndex + 1);
                    } else {
                      newExclusions = lines;
                    }

                    setQuoteMetadata((prev: any) => ({
                      ...prev,
                      exclusionsText: newExclusions.join("\n"),
                      termsText: newTerms.join("\n"),
                    }));
                  }}
                  maxLength={5000}
                  placeholder="Add your exclusions and terms..."
                  className="w-full h-50 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />

              </div>
              {
                quoteMetadata?.type_quote && (quoteMetadata?.estimate_id || quoteMetadata?.job_id || quoteMetadata?.customer) &&
                < div className='my-4'>
                  <QuoteAdditionalFiles
                    useButton={true}
                    setQuoteData={setQuoteMetadata}
                    quoteData={quoteMetadata}
                    handleFileSelect={(field: any) => handleFileSelect(field)}
                    files={files}
                    setFiles={setFiles} />
                </div>
              }
            </div>
          )
        }

        <div className="w-1/2 overflow-y-auto ">
          <div className="bg-[#F4F5F7] p-6 rounded-lg sticky ">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            <div className=" min-h-[1000px] overflow-y-auto bg-white p-4 mt-4 border rounded-md">
              {
                loadingMetadata ?
                  <div className='flex-1 h-[1000px] flex flex-row justify-center items-center'>
                    <Loader2 className="w-6 h-6 animate-spin m-auto text-gray-500" />
                  </div>
                  :
                  <BidProposalWorksheet
                    exclusions={quoteMetadata?.exclusionsText}
                    terms={quoteMetadata?.termsText}
                    quoteData={quoteMetadata}
                    quoteType={quoteMetadata?.type_quote || "straight_sale"}
                    notes={quoteMetadata?.notes}
                    items={quoteItems}
                    quoteDate={new Date()}
                    termsAndConditions={quoteMetadata?.aditionalTerms}
                    files={files.filter((f) => quoteMetadata?.selectedfilesids?.includes(f.id))}
                  />
              }
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
