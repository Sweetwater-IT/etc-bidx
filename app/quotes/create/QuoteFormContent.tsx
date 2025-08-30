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

// Mapper para enviar al backend en snake_case
function mapAdminDataToApi(adminData: AdminData, quoteId: number) {
  return {
    quote_id: quoteId,
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
}

export default function QuoteFormContent() {
  const router = useRouter()
  const {
    selectedCustomers,
    sending,
    setSending,
    quoteId,
    setQuoteId,
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

  // Crear draft apenas entro
  useEffect(() => {
    async function initDraft() {
      if (!quoteId) {
        try {
          const res = await fetch('/api/quotes', { method: 'POST' })
          if (!res.ok) throw new Error('Failed to create draft')
          const data = await res.json()
          setQuoteId(data.data.id)
          setQuoteNumber(data.data.quote_number || '')
        } catch (err) {
          console.error('Error creating draft', err)
          toast.error('Could not start a new draft')
        }
      }
    }
    initDraft()
  }, [quoteId, setQuoteId, setQuoteNumber])

  // Notes
  useEffect(() => {
    async function fetchNotes() {
      setLoadingNotes(true)
      try {
        if (!quoteId) return
        const res = await fetch(`/api/quotes?id=${quoteId}`)
        if (res.ok) {
          const data = await res.json()
          setNotesState(Array.isArray(data.notes) ? data.notes : [])
        }
      } finally {
        setLoadingNotes(false)
      }
    }
    fetchNotes()
  }, [quoteId])

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

  // Autosave effect
  useEffect(() => {
    if (!quoteId) return

    const hasQuoteItemsChanged = !isEqual(
      quoteItems,
      prevStateRef.current.quoteItems
    )
    const hasAdminDataChanged = !isEqual(
      adminData,
      prevStateRef.current.adminData
    )

    if (!hasQuoteItemsChanged && !hasAdminDataChanged) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => {
      autosave()
    }, 5000)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [quoteItems, adminData, quoteId])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondCounter((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  const autosave = async () => {


  
    if (!quoteId) {
      console.log('⏭️ Skipping autosave because no quoteId yet')
      return false
    }

    prevStateRef.current = { quoteItems, adminData }


    // 🔎 Log para ver qué valores tenemos antes de enviar
    console.log("📝 [AUTOSAVE] quoteId:", quoteId)
    console.log("📝 [AUTOSAVE] adminData BEFORE mapping:", adminData)
    console.log("📝 [AUTOSAVE] adminData AFTER mapping:", mapAdminDataToApi(adminData ?? defaultAdminObject, quoteId))


    try {
      const payload = {
        id: quoteId,
        items: quoteItems,
        admin_data: mapAdminDataToApi(adminData ?? defaultAdminObject, quoteId),
        status: 'DRAFT',
        notes: notesState,
        subject,
        body: emailBody,
        from_email: sender?.email || null,
        recipients: [
          ...(pointOfContact
            ? [{ email: pointOfContact.email, point_of_contact: true }]
            : []),
          ...ccEmails.map((email) => ({ email, cc: true })),
          ...bccEmails.map((email) => ({ email, bcc: true })),
        ],
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
      console.error("💥 [AUTOSAVE] Exception:", error)
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
              <Button variant="outline">Download</Button>
              <Button disabled={sending || !pointOfContact}>
                {sending ? 'Sending...' : 'Send Quote'}
              </Button>
            </div>
          </div>
        }
      />

      <div className="flex gap-6 p-6 max-w-full">
        <div className="w-3/4 space-y-6">
          <QuoteAdminInformation />
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
