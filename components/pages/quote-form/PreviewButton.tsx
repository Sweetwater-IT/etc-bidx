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
import BidProposalReactPDF, { StandardTermsAndConditions } from './BidProposalReactPDF';
import { defaultAdminObject } from '@/types/default-objects/defaultAdminData';

export const QuotePreviewButton = () => {
  const {
    selectedCustomers,
    quoteItems,
    quoteDate,
    quoteId,
    paymentTerms,
    includeTerms,
    customTerms,
  } = useQuoteForm();
  
  const [isOpen, setIsOpen] = useState(false);

  // Convert includeTerms object to array format expected by PDF component
  const getIncludedTerms = () => {
    const termsMap = {
      'standard-terms': 'Standard',
      'rental-agreements': 'Rental',
      'equipment-sale': 'Sale',
      'flagging-terms': 'Flagging',
    };
    
    return Object.entries(includeTerms)
      .filter(([key, value]) => value && key !== 'custom-terms')
      .map(([key]) => termsMap[key as keyof typeof termsMap] || '') as StandardTermsAndConditions[];
  };

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
                adminData={defaultAdminObject}
                items={quoteItems}
                customers={selectedCustomers.map(c => c.name)}
                name={selectedCustomers[0].name || 'Client'}
                email=""
                quoteDate={new Date(quoteDate)}
                quoteNumber={quoteId}
                paymentTerms={paymentTerms as any}
                includedTaC={getIncludedTerms()}
                customTerms={includeTerms['custom-terms'] ? customTerms : ''}
                county=""
                sr=""
                ecms=""
              />
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};