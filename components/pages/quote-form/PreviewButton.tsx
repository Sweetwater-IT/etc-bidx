'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { BidProposalReactPDF } from './BidProposalReactPDF'
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData'
import { useQuoteForm } from '@/app/quotes/create/QuoteFormProvider'
import { PaymentTerms } from './AdminInformationSheet'
import { PDFViewer } from '@react-pdf/renderer'

export const QuotePreviewButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  const {
    adminData,
    quoteItems,
    quoteDate,
    quoteId,
    includeTerms,
    selectedCustomers,
    sender,
    customTerms,
    paymentTerms,
    county,
    stateRoute,
    ecmsPoNumber,
    pointOfContact
  } = useQuoteForm()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Preview Quote</Button>
      </DialogTrigger>
      <DialogContent className='max-w-4xl h-5/6 p-0'>
        <DialogHeader className='px-6 pt-6'>
          <DialogTitle>Quote Preview</DialogTitle>
        </DialogHeader>
        <div className='flex-1 overflow-y-auto h-full'>
          {isOpen && (
            <>
              <PDFViewer height={1250} width='100%'>
                <BidProposalReactPDF
                  adminData={adminData ?? defaultAdminObject}
                  items={quoteItems}
                  customers={selectedCustomers}
                  quoteDate={new Date(quoteDate)}
                  quoteNumber={quoteId}
                  sender={{ ...sender, name: sender.name || '' }}
                  pointOfContact={pointOfContact ?? { name: '', email: '' }}
                  paymentTerms={paymentTerms as PaymentTerms}
                  includedTerms={includeTerms}
                  customTaC={includeTerms['custom-terms'] ? customTerms : ''}
                  county={county}
                  sr={stateRoute}
                  ecms={ecmsPoNumber}
                />
              </PDFViewer>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
