'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { useQuoteForm } from './QuoteFormProvider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { PaymentTerms, QuoteAdminInformation } from '@/components/pages/quote-form/QuoteAdminInformation'
import { QuoteItems } from '@/components/pages/quote-form/QuoteItems'
import { QuoteNumber } from '@/components/pages/quote-form/QuoteNumber'
import { QuoteAdditionalFiles } from '@/components/pages/quote-form/QuoteAdditionalFiles'
import { QuoteTermsAndConditions } from '@/components/pages/quote-form/QuoteTermsAndConditions'
import { QuoteNotes, Note } from '@/components/pages/quote-form/QuoteNotes'
import { QuotePreviewButton } from '@/components/pages/quote-form/PreviewButton'
import { toast } from 'sonner'
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData'
import PageHeaderWithSaving from '@/components/PageContainer/PageHeaderWithSaving'
import isEqual from 'lodash/isEqual'
import { useRouter } from 'next/navigation'
import { AdminData } from '@/types/TAdminData'
import ReactPDF from '@react-pdf/renderer'
import { BidProposalWorksheet } from './BidProposalWorksheet'
import { BidProposalReactPDF } from '@/components/pages/quote-form/BidProposalReactPDF'
import { useAuth } from '@/contexts/auth-context'
import RenderEstimateBidQuoteFields from './components/RenderEstimateBidQuoteFields';
import RenderSaleQuoteFields from './components/RenderSaleQuoteFields';
import RenderProjectQuoteFields from './components/RenderProjectQuoteFields';
import { EstimateBidQuote, Quote, StraightSaleQuote, ToProjectQuote } from './types';

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


type QuoteState =
  | Partial<StraightSaleQuote>
  | Partial<ToProjectQuote>
  | Partial<EstimateBidQuote>;

function mapAdminDataToApi(adminData: AdminData, estimateId?: number | null, jobId?: number | null) {
  const mapped = {

    bid_estimate_id: estimateId ?? null,
    job_id: jobId ?? null,
    contract_number: adminData.contractNumber,
    estimator: adminData.estimator,
    division: adminData.division,
    letting_date: adminData.lettingDate,
    owner: adminData.owner,
    county: adminData.county,
    sr_route: adminData.srRoute,
    location: adminData.location,
    dbe: adminData.dbe,
    start_date: adminData.startDate,
    end_date: adminData.endDate,
    winter_start: adminData.winterStart,
    winter_end: adminData.winterEnd,
    ow_travel_time_hours: adminData.owTravelTimeHours,
    ow_travel_time_minutes:
      adminData.owTravelTimeMinutes ?? adminData.owTravelTimeMins,
    ow_mileage: adminData.owMileage,
    fuel_cost_per_gallon: adminData.fuelCostPerGallon,
    emergency_job: adminData.emergencyJob,
    rated: adminData.rated,
    emergency_fields: adminData.emergencyFields,
  }
  console.log('[mapAdminDataToApi] mapped:', mapped)

  console.log('mapped es', mapped);

  return mapped
}

const useNumericQuoteId = (rawId: unknown) => {
  const id = typeof rawId === 'number' && Number.isFinite(rawId) ? rawId : null
  return id
}

export default function QuoteFormContent({ showInitialAdminState = false }: { showInitialAdminState?: boolean }) {
  const { user } = useAuth()
  const router = useRouter()
  const [quoteType, setQuoteType] = useState<"straight_sale" | "to_project" | "estimate_bid">('straight_sale')
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
  } = useQuoteForm()

  const [isSaving, setIsSaving] = useState(false)
  const [secondCounter, setSecondCounter] = useState(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const [firstSave, setFirstSave] = useState(false)
  const prevStateRef = useRef({ quoteItems, adminData, notes })
  const numericQuoteId = useNumericQuoteId(quoteId)
  const initCalled = useRef(false);

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

  const handleSaveNote = async (note: Note) => {
    setNotes((prevNotes) => [...prevNotes, { ...note, user_email: user.email }]);
  };

  const autosave = async () => {
    if (!numericQuoteId) {

      return false
    }

    prevStateRef.current = { quoteItems, adminData, notes }

    try {
      const payload = {
        id: numericQuoteId,
        estimate_id: estimateId,
        job_id: jobId,
        items: quoteItems,
        admin_data: mapAdminDataToApi(
          adminData ?? defaultAdminObject,
          estimateId,
          jobId
        ),
        status: 'DRAFT',
        notes: notes,
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
      }



      const res = await fetch(`/api/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Failed to save draft')
      }

      setSecondCounter(1)
      if (!firstSave) setFirstSave(true)
      return true
    } catch (error) {

      toast.error('Quote not successfully saved as draft: ' + error)
      return false
    }
  }

  const handleEditNote = (index: number, updatedNote: Note) => {
    setNotes((prevNotes) =>
      prevNotes.map((n, i) => (i === index ? updatedNote : n))
    );
  };

  const handleDeleteNote = (index: number) => {
    setNotes((prevNotes) => prevNotes.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!numericQuoteId) return

    const hasQuoteItemsChanged = !isEqual(quoteItems, prevStateRef.current.quoteItems)
    const hasAdminDataChanged = !isEqual(adminData, prevStateRef.current.adminData)
    const haveNotesChanged = !isEqual(notes, prevStateRef.current.notes);
    if (!hasQuoteItemsChanged && !hasAdminDataChanged && !haveNotesChanged) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => {
      autosave()
    }, 5000)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [quoteItems, adminData, notes, numericQuoteId, autosave])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondCounter((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  const handleQuoteTypeChange = (type: "straight_sale" | "to_project" | "estimate_bid") => {
    setQuoteType(type);

    if (type === "straight_sale") {
      setQuoteData({
        type_quote: quoteType,
        customer: {},
        customer_contact: {},
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        customer_job_number: "",
        purchase_order: "",
        etc_point_of_contact: "",
        etc_poc_email: "",
        etc_poc_phone_number: "",
        etc_branch: "",
        project_title: "",
        description: "",
      });
    }

    if (type === "to_project") {
      setQuoteData({
        type_quote: quoteType,
        customer: {},
        customer_contact: {},
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        customer_job_number: "",
        purchase_order: "",
        etc_point_of_contact: "",
        etc_poc_email: "",
        etc_poc_phone_number: "",
        etc_branch: "",
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
      });
    }

    if (type === "estimate_bid") {
      setQuoteData({
        type_quote: quoteType,
        customer: {},
        customer_contact: {},
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        customer_job_number: "",
        etc_point_of_contact: "",
        etc_poc_email: "",
        etc_poc_phone_number: "",
        etc_branch: "",
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
      });
    }
  };


  async function handleSaveQuote() {
    if (!quoteId) {
      return;
    }
    try {
      const result = await fetch('/api/quotes', {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...quoteData, id: quoteId })
      })

      const resp = await result.json()

      if (resp.success) {
        toast.success("Quote data successfully edited")
      }

    } catch (error) {
      toast.success("There was an error updating the quote")
      console.log(error);
    }

  }

  const handleDownload = async () => {
    try {
      if (!quoteId) {
        toast.error("No quote available to download")
        return
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
        />
      ).toBlob()


      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Quote-${quoteId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success("PDF downloaded successfully!")
    } catch (err) {
      console.error("Error downloading PDF:", err)
      toast.error("Could not download PDF")
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
              <QuotePreviewButton />
              <Button variant="outline" onClick={handleDownload}>
                Download
              </Button>
              <Button disabled={sending || !pointOfContact} onClick={handleSendQuote}>
                {sending ? 'Sending...' : 'Send Quote'}
              </Button>
            </div>
          </div>
        }
      />

      <div className="flex gap-6 p-6 max-w-full">
        <div className="w-1/2 space-y-6">

          <div className='flex flex-col'>
            <div>
              <p className='font-bold text-xl mb-2'>Quote type</p>
              <div className='w-1/4'>
                <p className='font-semibold mb-2 text-md'>Select Quote Type</p>
                <Select value={quoteType ?? ""} onValueChange={handleQuoteTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Quote Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeQuotes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* <QuoteAdminInformation showInitialAdminState={showInitialAdminState} /> */}
            <div className='my-4'>
              {quoteType === "straight_sale" && quoteData && (
                <RenderSaleQuoteFields
                  data={quoteData as Partial<StraightSaleQuote>}
                  setData={setQuoteData}
                  onSaveInformation={handleSaveQuote}
                />
              )}

              {quoteType === "to_project" && quoteData && (
                <RenderProjectQuoteFields
                  data={quoteData as Partial<ToProjectQuote>}
                  setData={setQuoteData}
                  onSaveInformation={handleSaveQuote}
                />
              )}

              {quoteType === "estimate_bid" && quoteData && (
                <RenderEstimateBidQuoteFields
                  data={quoteData as Partial<EstimateBidQuote>}
                  setData={setQuoteData}
                  onSaveInformation={handleSaveQuote}
                />
              )}
            </div>

            <QuoteItems />
            <QuoteNotes
              notes={notes}
              onSave={handleSaveNote}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              canEdit={true}
            />
            {/* <QuoteAdditionalFiles /> */}
            {/* <QuoteTermsAndConditions /> */}

          </div>

        </div>

        <div className="w-1/2 space-y-6">
          <div className="bg-[#F4F5F7] p-6 rounded-lg sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            <div className="min-h-[1000px] overflow-y-auto bg-white p-4 mt-4 border rounded-md">
              <BidProposalWorksheet
                quoteData={quoteData}
                quoteType={quoteType}
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
              />
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
