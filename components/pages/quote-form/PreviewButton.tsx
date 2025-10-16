"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BidProposalReactPDF } from "./BidProposalReactPDF";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { PaymentTerms } from "./AdminInformationSheet";
import { PDFViewer } from "@react-pdf/renderer";

export const QuotePreviewButton = ({ quoteType, termsAndConditions, exclusion, terms }: { quoteType: any, termsAndConditions: boolean, exclusion: string; terms: string; }) => {
  const [isOpen, setIsOpen] = useState(false);

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
    pointOfContact,
    quoteMetadata,
  } = useQuoteForm();


  const pdfDocument = useMemo(() => {
    return (
      <BidProposalReactPDF
        terms={terms}
        notes={quoteMetadata?.notes}
        exclusions={exclusion}
        items={quoteItems}
        quoteDate={new Date()}
        quoteStatus={quoteMetadata?.status ?? ''}
        quoteType={quoteType}
        quoteData={quoteMetadata}
        termsAndConditions={termsAndConditions}
      />
    );
  }, [
    adminData,
    quoteItems,
    quoteId,
    customTerms,
    termsAndConditions,
    quoteMetadata?.aditionalExclusions,
    quoteMetadata,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Preview Quote</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-5/6 p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Quote Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto h-full">
          {isOpen && (
            <PDFViewer height={1250} width="100%">
              {pdfDocument}
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
