'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { useQuoteForm } from './QuoteFormProvider'
import {
  PaymentTerms,
  QuoteAdminInformation,
} from '@/components/pages/quote-form/QuoteAdminInformation'
import { QuoteItems } from '@/components/pages/quote-form/QuoteItems'
import { QuoteEmailDetails } from '@/components/pages/quote-form/QuoteEmailDetails'
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
import { BidProposalReactPDF } from '@/components/pages/quote-form/BidProposalReactPDF'

// Mapper para enviar al backend en snake_case
function mapAdminDataToApi(adminData: AdminData, quoteId: number, estimateId?: number | null, jobId?: number | null) {
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
  return mapped
}

// helper: garantiza que trabajamos SOLO con IDs numéricos
const useNumericQuoteId = (rawId: unknown) => {
  const id = typeof rawId === 'number' && Number.isFinite(rawId) ? rawId : null
  useEffect(() => {
    if (rawId != null && typeof rawId !== 'number') {
    }
  }, [rawId])
  return id
}

export default function QuoteFormContent({ showInitialAdminState = false }: { showInitialAdminState?: boolean }) {
  const router = useRouter()
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
  } = useQuoteForm()

  const [notesState, setNotesState] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [secondCounter, setSecondCounter] = useState(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const [firstSave, setFirstSave] = useState(false)
  const prevStateRef = useRef({ quoteItems, adminData })
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

  }, []);






  useEffect(() => {
    async function fetchNotes() {
      setLoadingNotes(true)
      try {
        if (!numericQuoteId) return
        const res = await fetch(`/api/quotes/${numericQuoteId}`)
        if (res.ok) {
          const data = await res.json()
          setNotesState(Array.isArray(data.notes) ? data.notes : [])
        }
      } finally {
        setLoadingNotes(false)
      }
    }
    fetchNotes()
  }, [numericQuoteId])

  const handleSaveNote = async (note: Note) => {
    const updatedNotes = [...notesState, note]
    setNotesState(updatedNotes)
    if (quoteId) {
      await fetch(`/api/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quoteId, notes: updatedNotes }),
      })
    }
  }


  useEffect(() => {
    if (!numericQuoteId) return

    const hasQuoteItemsChanged = !isEqual(quoteItems, prevStateRef.current.quoteItems)
    const hasAdminDataChanged = !isEqual(adminData, prevStateRef.current.adminData)
    if (!hasQuoteItemsChanged && !hasAdminDataChanged) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => {
      autosave()
    }, 5000)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [quoteItems, adminData, numericQuoteId])
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondCounter((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])



  const handleDownload = async () => {
    try {
      if (!quoteId) {
        toast.error("No quote available to download")
        return
      }

      // Generar el PDF como blob
      const pdfBlob = await ReactPDF.pdf(
        <BidProposalReactPDF
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

      // Forzar la descarga en el navegador
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



  const autosave = async () => {
    if (!numericQuoteId) {

      return false
    }

    prevStateRef.current = { quoteItems, adminData }



    try {
      const payload = {
        id: numericQuoteId,
        estimate_id: estimateId,
        job_id: jobId,
        items: quoteItems,
        admin_data: mapAdminDataToApi(
          adminData ?? defaultAdminObject,
          numericQuoteId,
          estimateId,
          jobId
        ),
        status: 'DRAFT',
        notes: notesState,
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
              <Button disabled={sending || !pointOfContact}>
                {sending ? 'Sending...' : 'Send Quote'}
              </Button>
            </div>
          </div>
        }
      />

      <div className="flex gap-6 p-6 max-w-full">
        <div className="w-3/4 space-y-6">
          <QuoteAdminInformation showInitialAdminState={showInitialAdminState} />
          <QuoteItems />
          <QuoteEmailDetails />
        </div>
        <div className="w-1/4 space-y-6">
          <QuoteNumber />
          <QuoteAdditionalFiles />
          <QuoteTermsAndConditions />
          <QuoteNotes
            notes={notesState}
            onSave={handleSaveNote}
            onEdit={() => { }}
            onDelete={() => { }}
            loading={loadingNotes}
          />
        </div>
      </div>
    </div>
  )
}
