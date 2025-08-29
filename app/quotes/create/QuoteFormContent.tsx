'use client'

import { Button } from '@/components/ui/button'
import { useQuoteForm } from './QuoteFormProvider'
import {
  QuoteAdminInformation,
} from '@/components/pages/quote-form/QuoteAdminInformation'
import { QuoteItems } from '@/components/pages/quote-form/QuoteItems'
import { QuoteEmailDetails } from '@/components/pages/quote-form/QuoteEmailDetails'
import { QuoteNumber } from '@/components/pages/quote-form/QuoteNumber'
import { QuoteAdditionalFiles } from '@/components/pages/quote-form/QuoteAdditionalFiles'
import { QuoteTermsAndConditions } from '@/components/pages/quote-form/QuoteTermsAndConditions'
import { QuoteNotes, Note } from '@/components/pages/quote-form/QuoteNotes'
import { toast } from 'sonner'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { BidProposalReactPDF } from '@/components/pages/quote-form/BidProposalReactPDF'
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData'
import { useState, useRef } from 'react'
import PageHeaderWithSaving from '@/components/PageContainer/PageHeaderWithSaving'
import { useRouter } from 'next/navigation'
import { calculateQuoteTotals } from '@/hooks/calculateQuoteTotals'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TermsNames } from './QuoteFormProvider'

export default function QuoteFormContent() {
  const router = useRouter()

  const {
    selectedCustomers,
    sending,
    setSending,
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

  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [secondCounter, setSecondCounter] = useState<number>(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const [firstSave, setFirstSave] = useState<boolean>(false)

  const [openPreview, setOpenPreview] = useState(false)

  // 👉 calcular totales
  const { grandTotal } = calculateQuoteTotals(quoteItems)

  // ✅ Default para evitar error de TS
  const defaultIncludedTerms: Record<TermsNames, boolean> = {
    'standard-terms': false,
    'rental-agreements': false,
    'equipment-sale': false,
    'flagging-terms': false,
    'custom-terms': false,
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

  console.log("BidProposalReactPDF props:", {
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
  });
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

            {/* Botón para descargar PDF */}
            <PDFDownloadLink
              document={
                <BidProposalReactPDF
                  adminData={adminData ?? defaultAdminObject}   // 👈 nunca undefined
                  items={quoteItems || []}
                  customers={selectedCustomers || []}
                  quoteDate={quoteDate ? new Date(quoteDate) : new Date()}
                  quoteNumber={quoteId || "Q-UNKNOWN"}
                  pointOfContact={pointOfContact ?? { name: "Unknown", email: "" }}  // 👈 fallback
                  sender={sender ?? { name: "System", email: "system@test.com", role: "Admin" }}
                  paymentTerms={paymentTerms || "NET30"}
                  includedTerms={includeTerms ?? {
                    "standard-terms": false,
                    "rental-agreements": false,
                    "equipment-sale": false,
                    "flagging-terms": false,
                    "custom-terms": false,
                  }}
                  customTaC={includeTerms?.["custom-terms"] ? customTerms : ""}
                  county={county || ""}
                  sr={stateRoute || ""}
                  ecms={ecmsPoNumber || ""}
                />
              }
              fileName={`Quote-${quoteId}.pdf`}
            >
              <Button variant="outline">Download PDF</Button>
            </PDFDownloadLink>

            {/* Botón para abrir preview en modal */}
            <Button variant="outline" onClick={() => setOpenPreview(true)}>
              Preview PDF
            </Button>

            <Button onClick={() => toast.info("Send logic aquí")} disabled={sending || !pointOfContact}>
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
            onSave={() => { }}
            onEdit={() => { }}
            onDelete={() => { }}
            loading={loadingNotes}
          />
        </div>
      </div>

      {/* Modal Preview */}
      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
        <DialogContent className="w-[95vw] h-[95vh] p-0">
          <PDFViewer style={{ width: '100%', height: '100%' }}>
            <BidProposalReactPDF
              adminData={adminData ?? defaultAdminObject}
              items={quoteItems || []}
              customers={selectedCustomers || []}
              quoteDate={quoteDate ? new Date(quoteDate) : new Date()}
              quoteNumber={quoteId || "Q-UNKNOWN"}
              pointOfContact={pointOfContact ?? { name: "Unknown", email: "" }}
              sender={sender ?? { name: "System", email: "system@test.com", role: "Admin" }}
              paymentTerms={paymentTerms || "NET30"}
              includedTerms={includeTerms ?? {
                "standard-terms": false,
                "rental-agreements": false,
                "equipment-sale": false,
                "flagging-terms": false,
                "custom-terms": false,
              }}
              customTaC={includeTerms?.["custom-terms"] ? customTerms : ""}
              county={county || ""}
              sr={stateRoute || ""}
              ecms={ecmsPoNumber || ""}
            />
          </PDFViewer>
        </DialogContent>
      </Dialog>
    </div>
  )
}
