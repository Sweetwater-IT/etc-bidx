'use client'

import { Button } from '@/components/ui/button'
import { useQuoteForm } from './QuoteFormProvider'
import {
  PaymentTerms,
  QuoteAdminInformation
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
import ReactPDF from '@react-pdf/renderer'
import { BidProposalReactPDF } from '@/components/pages/quote-form/BidProposalReactPDF'
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData'
import { useState, useEffect } from 'react'

export default function QuoteFormContent () {
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
    sender
  } = useQuoteForm()

  const [notesState, setNotesState] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)

  // Fetch notes for the quote on mount (if editing an existing quote)
  useEffect(() => {
    async function fetchNotes () {
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
        body: JSON.stringify({ id: quoteId, notes: updatedNotes })
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
        body: JSON.stringify({ id: quoteId, notes: updatedNotes })
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
        body: JSON.stringify({ id: quoteId, notes: updatedNotes })
      })
    }
  }

  const handleSendQuote = async () => {
    if (!pointOfContact) {
      toast.error('Please select a point of contact before sending the quote')
      return
    }

    setSending(true)
    setEmailError(null)

    // Generate a unique token if not already set
    if (!uniqueToken) {
      const newToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      setUniqueToken(newToken)
    }

    try {
      // Create recipients array with proper contact IDs
      const recipients: {
        email: string
        contactId: number | undefined
        point_of_contact?: boolean
        cc?: boolean
        bcc?: boolean
      }[] = []

      // Add point of contact
      if (pointOfContact) {
        recipients.push({
          email: pointOfContact.email,
          contactId: getContactIdFromEmail(pointOfContact.email),
          point_of_contact: true
        })
      }

      // Add CC recipients
      ccEmails.forEach(email => {
        recipients.push({
          email,
          contactId: getContactIdFromEmail(email),
          cc: true
        })
      })

      // Add BCC recipients
      bccEmails.forEach(email => {
        recipients.push({
          email,
          contactId: getContactIdFromEmail(email),
          bcc: true
        })
      })

      // Generate the PDF quote document
      const pdfBlob = await ReactPDF.pdf(
        <BidProposalReactPDF
          adminData={adminData ?? defaultAdminObject}
          items={quoteItems}
          customers={selectedCustomers}
          quoteDate={new Date(quoteDate)}
          quoteNumber={quoteId}
          pointOfContact={pointOfContact}
          sender={{ ...sender, name: sender.name || '' }}
          paymentTerms={paymentTerms as PaymentTerms}
          includedTerms={includeTerms}
          customTaC={includeTerms['custom-terms'] ? customTerms : ''}
          county={county}
          sr={stateRoute}
          ecms={ecmsPoNumber}
        />
      ).toBlob()

      // Create a File object from the blob for attachment
      const pdfFile = new File([pdfBlob], `Quote-${quoteId}.pdf`, {
        type: 'application/pdf'
      })

      // Add the PDF to additional files
      const allFiles = [pdfFile, ...(additionalFiles || [])]

      const success = await sendQuoteEmail(
        {
          adminData: adminData,
          date: new Date(quoteDate), // Use the date from the form
          quoteNumber: quoteId,
          customerName: pointOfContact?.name || '',
          customers: selectedCustomers,
          totalAmount: calculateQuoteTotal(quoteItems),
          items: quoteItems,
          createdBy: 'User', // This should be the logged-in user
          createdAt: new Date().toISOString(),
          paymentTerms: paymentTerms as PaymentTerms,
          includedTerms: includeTerms,
          ecmsPoNumber: ecmsPoNumber,
          stateRoute: stateRoute,
          county: county,
          notes: notesState.map(n => n.text).join('\n'),
          status: status,
          customTerms: customTerms,
          attachmentFlags: includeFiles,
          uniqueToken:
            uniqueToken ||
            Math.random().toString(36).substring(2, 15) +
              Math.random().toString(36).substring(2, 15),
          quoteType,
          associatedContract: associatedContractNumber ?? ''
        },
        {
          pointOfContact: pointOfContact,
          fromEmail: sender.email || 'it@establishedtraffic.com',
          recipients: recipients,
          cc: ccEmails,
          bcc: bccEmails,
          subject: subject,
          body: emailBody,
          files: allFiles, // Include the PDF and any additional files
          standardDocs: getStandardDocsFromFlags(includeFiles)
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

  // Helper function to get contact ID from email
  const getContactIdFromEmail = (email: string): number | undefined => {
    // Look through all selected customers' contacts
    for (const customer of selectedCustomers) {
      // Check if customer has contactIds array and it matches the number of emails
      if (
        customer.contactIds &&
        customer.emails &&
        customer.emails.length === customer.contactIds.length
      ) {
        // Find the index of the matching email
        const emailIndex = customer.emails.findIndex(e => e === email)
        if (emailIndex >= 0 && emailIndex < customer.contactIds.length) {
          return customer.contactIds[emailIndex]
        }
      }
    }
    return undefined
  }

  // Helper function to calculate the total quote amount
  const calculateQuoteTotal = (items: any[]): number => {
    if (!items?.length) return 0

    return items.reduce((total, item) => {
      const discount = item.discount || 0
      const discountType = item.discountType || 'percentage'

      // Calculate parent item value
      const quantity = item.quantity || 0
      const unitPrice = item.unitPrice || 0
      const basePrice = quantity * unitPrice

      // Calculate discount amount based on type
      const discountAmount =
        discountType === 'dollar' ? discount : basePrice * (discount / 100)

      // Calculate composite items total if they exist
      const compositeTotal =
        item.associatedItems && item.associatedItems.length > 0
          ? item.associatedItems.reduce(
              (subSum, compositeItem) =>
                subSum +
                (compositeItem.quantity || 0) * (compositeItem.unitPrice || 0),
              0
            )
          : 0

      // Apply discount to the combined total
      return total + (basePrice + compositeTotal - discountAmount)
    }, 0)
  }

  // Helper function to get standard docs from flags
  const getStandardDocsFromFlags = (
    flags: Record<string, boolean>
  ): string[] => {
    const docs: string[] = []

    if (flags['flagging-price-list']) {
      docs.push('Flagging Price List')
    }

    if (flags['flagging-service-area']) {
      docs.push('Flagging Service Area')
    }

    if (flags['bedford-branch']) {
      docs.push('Sell Sheet')
    }

    return docs
  }

  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex items-center justify-between border-b px-6 py-3'>
        <div className='flex items-center gap-2'>
          <h1 className='text-2xl font-semibold'>Quote Form</h1>
        </div>
        <div className='flex items-center gap-2'>
          <QuotePreviewButton />
          <Button
            onClick={handleSendQuote}
            disabled={sending || !pointOfContact}
          >
            {sending ? 'Sending...' : 'Send Quote'}
          </Button>
          <Button variant='outline'>Download</Button>
        </div>
      </div>

      <div className='flex gap-6 p-6 max-w-full'>
        {/* Main Form Column (2/3) */}
        <div className='flex-3/4 space-y-6'>
          <QuoteAdminInformation />
          <QuoteItems />
          <QuoteEmailDetails />
        </div>

        {/* Right Column (1/3) */}
        <div className='flex-1/4 space-y-6'>
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
