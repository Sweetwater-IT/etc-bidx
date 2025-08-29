'use client'

import { Button } from '@/components/ui/button'
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
import { sendQuoteEmail } from '@/lib/api-client'
import { toast } from 'sonner'
import ReactPDF, { PDFDownloadLink } from '@react-pdf/renderer'
import { BidProposalReactPDF } from '@/components/pages/quote-form/BidProposalReactPDF'
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData'
import { useState, useEffect, useRef, useMemo } from 'react'
import PageHeaderWithSaving from '@/components/PageContainer/PageHeaderWithSaving'
import { useRouter } from 'next/navigation'
import { Document, Page, Text } from "@react-pdf/renderer";
import { BidDetailsResponse } from '@/types/TBidDetails';


// ========================
// Componente Principal
// ========================
export default function QuoteFormContent() {
  const router = useRouter()

  const {
    selectedCustomers,
    emailSent,
    emailError,
    sending,
    setSending,
    setEmailSent,
    setEmailError,
    quoteId,
    quoteItems,
    paymentTerms,
    emailBody,
    subject,
    ccEmails,
    bccEmails,
    pointOfContact,
    status,
    includeTerms,
    includeFiles,
    customTerms,
    adminData,
    county,
    stateRoute,
    ecmsPoNumber,
    notes,
    additionalFiles,
    uniqueToken,
    setUniqueToken,
    quoteDate,
    setStatus,
    quoteType,
    associatedContractNumber,
    sender,
  } = useQuoteForm()

  const [notesState, setNotesState] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)

  // Autosave states
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [secondCounter, setSecondCounter] = useState<number>(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const [firstSave, setFirstSave] = useState<boolean>(false)

  // ========================
  // Fetch notas
  // ========================
  useEffect(() => {
    async function fetchNotes() {
      setLoadingNotes(true);
      try {
        if (!quoteId) return;
        const res = await fetch(`/api/quotes/bid-details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractNumber: quoteId,
            type: "estimate" // o "job" según tu caso
          }),
        });

        if (res.ok) {
          const data: BidDetailsResponse = await res.json();
          if (data?.data) {
            console.log("Bid details:", data.data);
            // ahora TS ya sabe qué propiedades tiene data.data
          }
        }
      } finally {
        setLoadingNotes(false);
      }
    }
    fetchNotes();
  }, [quoteId]);

  // ========================
  // Notas handlers
  // ========================
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

  const handleEditNote = async (index: number, updatedNote: Note) => {
    const updatedNotes = notesState.map((n, i) =>
      i === index ? updatedNote : n
    )
    setNotesState(updatedNotes)
    if (quoteId) {
      await fetch(`/api/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quoteId, notes: updatedNotes }),
      })
    }
  }

  const handleDeleteNote = async (index: number) => {
    const updatedNotes = notesState.filter((_, i) => i !== index)
    setNotesState(updatedNotes)
    if (quoteId) {
      await fetch(`/api/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quoteId, notes: updatedNotes }),
      })
    }
  }

  // ========================
  // Función enviar Quote (PDF + email)
  // ========================
  const handleSendQuote = async () => {
    if (!pointOfContact) {
      toast.error('Please select a point of contact before sending the quote')
      return
    }

    setSending(true)
    setEmailError(null)

    if (!uniqueToken) {
      const newToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      setUniqueToken(newToken)
    }

    try {
      const recipients: {
        email: string
        contactId: number | undefined
        point_of_contact?: boolean
        cc?: boolean
        bcc?: boolean
      }[] = []

      if (pointOfContact) {
        recipients.push({
          email: pointOfContact.email,
          contactId: getContactIdFromEmail(pointOfContact.email),
          point_of_contact: true,
        })
      }

      ccEmails.forEach((email) =>
        recipients.push({ email, contactId: getContactIdFromEmail(email), cc: true })
      )
      bccEmails.forEach((email) =>
        recipients.push({ email, contactId: getContactIdFromEmail(email), bcc: true })
      )

      const pdfBlob = await ReactPDF.pdf(
        <BidProposalReactPDF
          adminData={adminData ?? defaultAdminObject}
          items={quoteItems}
          customers={selectedCustomers}
          quoteDate={new Date(quoteDate)}
          quoteNumber={quoteId}
          pointOfContact={{
            name: pointOfContact?.name || '',
            email: pointOfContact?.email || '',
          }}
          sender={sender}
          paymentTerms={paymentTerms as PaymentTerms}
          includedTerms={includeTerms}
          customTaC={includeTerms['custom-terms'] ? customTerms : ''}
          county={county}
          sr={stateRoute}
          ecms={ecmsPoNumber}
        />
      ).toBlob()

      const pdfFile = new File([pdfBlob], `Quote-${quoteId}.pdf`, {
        type: 'application/pdf',
      })
      const allFiles = [pdfFile, ...(additionalFiles || [])]

      const success = await sendQuoteEmail(
        {
          adminData,
          date: new Date(quoteDate),
          quoteNumber: quoteId,
          customerName: pointOfContact?.name || '',
          customers: selectedCustomers,
          totalAmount: calculateQuoteTotal(quoteItems),
          items: quoteItems,
          createdBy: 'User',
          createdAt: new Date().toISOString(),
          paymentTerms: paymentTerms as PaymentTerms,
          includedTerms: includeTerms,
          ecmsPoNumber,
          stateRoute,
          county,
          notes: notesState.map((n) => n.text).join('\n'),
          status,
          customTerms,
          attachmentFlags: includeFiles,
          uniqueToken:
            uniqueToken ||
            Math.random().toString(36).substring(2, 15),
          quoteType,
          associatedContract: associatedContractNumber ?? '',
        },
        {
          pointOfContact,
          fromEmail: sender.email || 'it@establishedtraffic.com',
          recipients,
          cc: ccEmails,
          bcc: bccEmails,
          subject,
          body: emailBody,
          files: allFiles,
          standardDocs: getStandardDocsFromFlags(includeFiles),
        }
      )

      if (success) {
        setEmailSent(true)
        toast.success(`Quote sent successfully to ${pointOfContact.email}!`)
        setStatus('Sent')
        setTimeout(() => setEmailSent(false), 5000)
      } else {
        setEmailError('Failed to send email, but quote has been saved.')
        toast.error(
          'There was a problem sending the email, but your quote has been saved.'
        )
      }
    } catch (error) {
      console.error('Error sending quote email:', error)
      setEmailError('An error occurred while sending the quote.')
    } finally {
      setSending(false)
    }
  }

  // ========================
  // Helpers
  // ========================
  const getContactIdFromEmail = (email: string): number | undefined => {
    for (const customer of selectedCustomers) {
      if (
        customer.contactIds &&
        customer.emails &&
        customer.emails.length === customer.contactIds.length
      ) {
        const emailIndex = customer.emails.findIndex((e) => e === email)
        if (emailIndex >= 0 && emailIndex < customer.contactIds.length) {
          return customer.contactIds[emailIndex]
        }
      }
    }
    return undefined
  }

  const calculateQuoteTotal = (items: any[]): number => {
    if (!items?.length) return 0

    return items.reduce((total, item) => {
      const discount = item.discount || 0
      const discountType = item.discountType || 'percentage'
      const quantity = item.quantity || 0
      const unitPrice = item.unitPrice || 0
      const basePrice = quantity * unitPrice

      const discountAmount =
        discountType === 'dollar' ? discount : basePrice * (discount / 100)

      const compositeTotal =
        item.associatedItems && item.associatedItems.length > 0
          ? item.associatedItems.reduce(
            (subSum, compositeItem) =>
              subSum +
              (compositeItem.quantity || 0) * (compositeItem.unitPrice || 0),
            0
          )
          : 0

      return total + (basePrice + compositeTotal - discountAmount)
    }, 0)
  }

  const getStandardDocsFromFlags = (
    flags: Record<string, boolean>
  ): string[] => {
    const docs: string[] = []
    if (flags['flagging-price-list']) docs.push('Flagging Price List')
    if (flags['flagging-service-area']) docs.push('Flagging Service Area')
    if (flags['bedford-branch']) docs.push('Sell Sheet')
    return docs
  }

  const getSaveStatusMessage = () => {
    if (isSaving && !firstSave) return 'Saving...'
    if (!firstSave) return ''
    if (secondCounter < 60) {
      return `Draft saved ${secondCounter} second${secondCounter !== 1 ? 's' : ''} ago`
    } else if (secondCounter < 3600) {
      const minutesAgo = Math.floor(secondCounter / 60)
      return `Draft saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
    } else {
      const hoursAgo = Math.floor(secondCounter / 3600)
      return `Draft saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
    }
  }

  // ========================
  // PDF Document Memo
  // ========================
  const pdfDoc = useMemo(() => {
    if (!pointOfContact) {
      return (
        <Document>
          <Page>
            <Text>No contact selected</Text>
          </Page>
        </Document>
      );
    }

    return (
      <BidProposalReactPDF
        adminData={adminData ?? defaultAdminObject}
        items={quoteItems}
        customers={selectedCustomers}
        quoteDate={new Date(quoteDate)}
        quoteNumber={quoteId}
        pointOfContact={pointOfContact}
        sender={sender}
        paymentTerms={paymentTerms as PaymentTerms}
        includedTerms={includeTerms}
        customTaC={includeTerms["custom-terms"] ? customTerms : ""}
        county={county}
        sr={stateRoute}
        ecms={ecmsPoNumber}
      />
    );
  }, [
    adminData,
    quoteItems,
    selectedCustomers,
    quoteDate,
    quoteId,
    pointOfContact,
    sender,
    paymentTerms,
    includeTerms,
    customTerms,
    county,
    stateRoute,
    ecmsPoNumber,
  ]);


  // ========================
  // Render
  // ========================
  return (
    <div className="flex flex-1 flex-col">
      <PageHeaderWithSaving
        heading="Quote Form"
        handleSubmit={() => router.push('/quotes')}
        showX
        saveButtons={
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {getSaveStatusMessage()}
            </div>
            <PDFDownloadLink document={pdfDoc} fileName={`Quote-${quoteId}.pdf`}>
              <Button variant="outline">Download PDF</Button>
            </PDFDownloadLink>
            <QuotePreviewButton />
            <Button onClick={handleSendQuote} disabled={sending || !pointOfContact}>
              {sending ? 'Sending...' : 'Send Quote'}
            </Button>
          </div>
        }
      />

      <div className="flex gap-6 p-6 max-w-full">
        <div className="flex-3/4 space-y-6">
          <QuoteAdminInformation />
          <QuoteItems />
          <QuoteEmailDetails />
        </div>

        <div className="flex-1/4 space-y-6">
          <QuoteNumber />
          <QuoteAdditionalFiles />
          <QuoteTermsAndConditions />
          <QuoteNotes
            notes={notesState}
            onSave={handleSaveNote}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
            loading={loadingNotes}
          />
        </div>
      </div>
    </div>
  )
}
