"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useQuoteForm } from '@/app/quotes/create/QuoteFormProvider';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PDFViewer } from '@react-pdf/renderer';
import { BidProposalReactPDF } from './BidProposalReactPDF';
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData';
import { PaymentTerms } from './QuoteAdminInformation';

export const QuotePreviewButton = () => {
  const {
    adminData,
    selectedCustomers,
    quoteItems,
    quoteDate,
    quoteId,
    paymentTerms,
    includeTerms,
    customTerms,
    county,
    stateRoute,
    ecmsPoNumber
  } = useQuoteForm();
  
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Preview Quote</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-5/6 p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Quote Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden h-full">
          {isOpen && (
            <PDFViewer width="100%" height="800px" style={{border: 'none'}}>
              <BidProposalReactPDF
                adminData={adminData ?? defaultAdminObject}
                items={quoteItems}
                customers={selectedCustomers.map(c => c.name)}
                quoteDate={new Date(quoteDate)}
                quoteNumber={quoteId}
                paymentTerms={paymentTerms as PaymentTerms}
                includedTerms={includeTerms}
                customTaC={includeTerms['custom-terms'] ? customTerms : ''}
                county={county}
                sr={stateRoute}
                ecms={ecmsPoNumber}
              />
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};