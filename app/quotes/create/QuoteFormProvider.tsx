"use client";

import React, { createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from "react";
import { Customer } from "@/types/Customer";
import { QuoteItem } from "@/types/IQuoteItem";
import { format } from "date-fns";
import { AdminData } from "@/types/TAdminData";
import { PaymentTerms } from "@/components/pages/quote-form/QuoteAdminInformation";

interface PointOfContact {
  name : string;
  email: string;
}

export type QuoteStatus = 'Not Sent' | 'Sent' | 'Accepted'

interface QuoteFormState {
  // Customer-related state
  selectedCustomers: Customer[];
  setSelectedCustomers: (customers: Customer[] | ((prev : Customer[]) => Customer[])) => void;
  pointOfContact: PointOfContact | undefined;
  setPointOfContact: (poc : PointOfContact) => void;
  
  // Contact state
  ccEmails: string[];
  setCcEmails: (emails: string[]) => void;
  bccEmails: string[];
  setBccEmails: (emails: string[]) => void;
  
  // Quote form state
  status: QuoteStatus
  setStatus: (type: QuoteStatus) => void;
  quoteType: "new" | "estimate" | "job";
  setQuoteType: (type: "new" | "estimate" | "job") => void;
  paymentTerms: PaymentTerms;
  setPaymentTerms: (terms: PaymentTerms) => void;
  digitalSignature: boolean;
  setDigitalSignature: (value: boolean) => void;
  quoteDate: string;
  setQuoteDate: (date: string) => void;
  
  // Admin fields for estimates/jobs
  county: string;
  setCounty: (county: string) => void;
  ecmsPoNumber: string;
  setEcmsPoNumber: (number: string) => void;
  stateRoute: string;
  setStateRoute: (route: string) => void;
  
  // Email state
  subject: string;
  setSubject: (subject: string) => void;
  emailBody: string;
  setEmailBody: (body: string) => void;
  
  // Quote items state
  quoteItems: QuoteItem[];
  setQuoteItems: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  
  // Document and terms state
  includeFiles: Record<AttachmentNames, boolean>;
  setIncludeFiles: (files: Record<AttachmentNames, boolean> | ((prev: Record<AttachmentNames, boolean>) => Record<AttachmentNames, boolean>)) => void;
  includeTerms: Record<TermsNames, boolean>;
  setIncludeTerms: (terms: Record<TermsNames, boolean> | ((prev: Record<TermsNames, boolean>) => Record<TermsNames, boolean>)) => void;
  customTerms: string;
  setCustomTerms: (customTerms: string | ((prev: string) => string)) => void;
  
  // UI state
  sending: boolean;
  setSending: (value: boolean) => void;
  emailSent: boolean;
  setEmailSent: (value: boolean) => void;
  emailError: string | null;
  setEmailError: (error: string | null) => void;

  // Quote Data
  associatedContractNumber : string | undefined;
  setAssociatedContractNumber : (contractNumber : string) => void;
  adminData : AdminData | undefined;
  setAdminData : Dispatch<SetStateAction<AdminData | undefined>>;
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
  additionalFiles : File[]
  setAdditionalFiles : Dispatch<SetStateAction<File[]>>

  uniqueToken : string;
  setUniqueToken : Dispatch<SetStateAction<string>>;
  
  // Generated data
  quoteId: string;
  setQuoteId: Dispatch<SetStateAction<string>>

  fromEmail: string;
  setFromEmail: Dispatch<SetStateAction<string>>
}

const QuoteFormContext = createContext<QuoteFormState | undefined>(undefined);

export function useQuoteForm() {
  const context = useContext(QuoteFormContext);
  if (context === undefined) {
    throw new Error("useQuoteForm must be used within a QuoteFormProvider");
  }
  return context;
}
export type AttachmentNames = "flagging-price-list" | "flagging-service-area" | 'bedford-branch'
export type TermsNames = "standard-terms" | 'rental-agreements' | 'equipment-sale' | 'flagging-terms' | 'custom-terms'

export default function QuoteFormProvider({ children }: { children: React.ReactNode }) {
  
  // State initialization
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [pointOfContact, setPointOfContact] = useState<PointOfContact>();
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [customTerms, setCustomTerms] = useState<string>('');
  const [fromEmail, setFromEmail] = useState<string>('')
  const [status, setStatus] = useState<QuoteStatus>('Not Sent')
  
  const [quoteType, setQuoteType] = useState<"new" | "estimate" | "job">("new");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('NET30');
  const [digitalSignature, setDigitalSignature] = useState(false);
  const [quoteDate, setQuoteDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [associatedContractNumber, setAssociatedContractNumber] = useState<string>();


  // Admin fields for estimates/jobs
  const [county, setCounty] = useState<string>("");
  const [ecmsPoNumber, setEcmsPoNumber] = useState<string>("");
  const [stateRoute, setStateRoute] = useState<string>("");
  
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [adminData, setAdminData] = useState<AdminData | undefined>();
  
  const [includeFiles, setIncludeFiles] = useState<Record<AttachmentNames, boolean>>({
    "flagging-price-list" : false,
    "flagging-service-area": false,
    "bedford-branch": false
  });
  
  const [includeTerms, setIncludeTerms] = useState<Record<TermsNames, boolean>>({
    "standard-terms": false,
    "rental-agreements": false,
    "equipment-sale": false,
    "flagging-terms": false,
    "custom-terms": false
  });
  
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string>('')

  const [notes, setNotes] = useState<string>('')
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [uniqueToken, setUniqueToken] = useState<string>('')

  // Update payment terms when customers change
  useEffect(() => {
    if (selectedCustomers.length > 0) {
        setPaymentTerms(selectedCustomers[0].paymentTerms as PaymentTerms);
    }
  }, [selectedCustomers]);
  
  // Reset contact selections when customers change
  useEffect(() => {
    setPointOfContact(undefined)
    setCcEmails([]);
    setBccEmails([]);
  }, [selectedCustomers]);
  
  const value: QuoteFormState = {
    selectedCustomers,
    setSelectedCustomers,
    pointOfContact,
    setPointOfContact,
    ccEmails,
    setCcEmails,
    bccEmails,
    setBccEmails,
    quoteType,
    setQuoteType,
    paymentTerms,
    setPaymentTerms,
    digitalSignature,
    setDigitalSignature,
    quoteDate,
    setQuoteDate,
    county,
    setCounty,
    ecmsPoNumber,
    setEcmsPoNumber,
    stateRoute,
    setStateRoute,
    subject,
    setSubject,
    emailBody,
    setEmailBody,
    quoteItems,
    setQuoteItems,
    includeFiles,
    setIncludeFiles,
    includeTerms,
    setIncludeTerms,
    customTerms,
    setCustomTerms,
    sending,
    setSending,
    emailSent,
    setEmailSent,
    emailError,
    setEmailError,
    quoteId,
    setQuoteId,
    associatedContractNumber,
    setAssociatedContractNumber,
    status,
    setStatus,
    adminData,
    setAdminData,
    notes,
    setNotes,
    additionalFiles,
    setAdditionalFiles,
    uniqueToken,
    setUniqueToken,
    fromEmail,
    setFromEmail
  };
  
  return (
    <QuoteFormContext.Provider value={value}>
      {children}
    </QuoteFormContext.Provider>
  );
}