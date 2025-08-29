"use client";

import React, { createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from "react";
import { Customer } from "@/types/Customer";
import { QuoteItem } from "@/types/IQuoteItem";
import { format } from "date-fns";
import { AdminData } from "@/types/TAdminData";
import { PaymentTerms } from "@/components/pages/quote-form/QuoteAdminInformation";
import { User } from "@/types/User";

interface PointOfContact {
  name: string;
  email: string;
}

export type QuoteStatus = 'Not Sent' | 'Sent' | 'Accepted';

interface QuoteFormState {
  selectedCustomers: Customer[];
  setSelectedCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  pointOfContact?: PointOfContact;
  setPointOfContact: (poc: PointOfContact) => void;
  ccEmails: string[];
  setCcEmails: (emails: string[]) => void;
  bccEmails: string[];
  setBccEmails: (emails: string[]) => void;
  status: QuoteStatus;
  setStatus: (type: QuoteStatus) => void;
  quoteType: "new" | "estimate" | "job";
  setQuoteType: (type: "new" | "estimate" | "job") => void;
  paymentTerms: PaymentTerms;
  setPaymentTerms: (terms: PaymentTerms) => void;
  digitalSignature: boolean;
  setDigitalSignature: (value: boolean) => void;
  quoteDate: string;
  setQuoteDate: (date: string) => void;
  county: string;
  setCounty: (county: string) => void;
  ecmsPoNumber: string;
  setEcmsPoNumber: (number: string) => void;
  stateRoute: string;
  setStateRoute: (route: string) => void;
  subject: string;
  setSubject: (subject: string) => void;
  emailBody: string;
  setEmailBody: (body: string) => void;
  quoteItems: QuoteItem[];
  setQuoteItems: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  includeFiles: Record<AttachmentNames, boolean>;
  setIncludeFiles: (files: Record<AttachmentNames, boolean> | ((prev: Record<AttachmentNames, boolean>) => Record<AttachmentNames, boolean>)) => void;
  includeTerms: Record<TermsNames, boolean>;
  setIncludeTerms: (terms: Record<TermsNames, boolean> | ((prev: Record<TermsNames, boolean>) => Record<TermsNames, boolean>)) => void;
  customTerms: string;
  setCustomTerms: (customTerms: string | ((prev: string) => string)) => void;
  sending: boolean;
  setSending: (value: boolean) => void;
  emailSent: boolean;
  setEmailSent: (value: boolean) => void;
  emailError: string | null;
  setEmailError: (error: string | null) => void;
  associatedContractNumber?: string;
  setAssociatedContractNumber: (contractNumber: string) => void;
  adminData?: AdminData;
  setAdminData: Dispatch<SetStateAction<AdminData | undefined>>;
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
  additionalFiles: File[];
  setAdditionalFiles: Dispatch<SetStateAction<File[]>>;
  uniqueToken: string;
  setUniqueToken: Dispatch<SetStateAction<string>>;
  quoteId: string;
  setQuoteId: Dispatch<SetStateAction<string>>;
  sender: User;
  setSender: Dispatch<SetStateAction<User>>;
}

const QuoteFormContext = createContext<QuoteFormState | undefined>(undefined);

export function useQuoteForm() {
  const context = useContext(QuoteFormContext);
  if (context === undefined) {
    throw new Error("useQuoteForm must be used within a QuoteFormProvider");
  }
  return context;
}

export type AttachmentNames = "flagging-price-list" | "flagging-service-area" | 'bedford-branch';
export type TermsNames = "standard-terms" | 'rental-agreements' | 'equipment-sale' | 'flagging-terms' | 'custom-terms';

interface QuoteFormProviderProps {
  children: React.ReactNode;
  initialData?: Partial<QuoteFormState>;
}

export default function QuoteFormProvider({ children, initialData }: QuoteFormProviderProps) {

  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>(initialData?.selectedCustomers || []);
  const [pointOfContact, setPointOfContact] = useState<PointOfContact | undefined>(initialData?.pointOfContact);
  const [ccEmails, setCcEmails] = useState<string[]>(initialData?.ccEmails || []);
  const [bccEmails, setBccEmails] = useState<string[]>(initialData?.bccEmails || []);
  const [customTerms, setCustomTerms] = useState<string>(initialData?.customTerms || '');
  const [status, setStatus] = useState<QuoteStatus>(initialData?.status || 'Not Sent');
  const [quoteType, setQuoteType] = useState<"new" | "estimate" | "job">(initialData?.quoteType || 'new');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(initialData?.paymentTerms || 'NET30');
  const [digitalSignature, setDigitalSignature] = useState(initialData?.digitalSignature || false);
  const [quoteDate, setQuoteDate] = useState(initialData?.quoteDate || format(new Date(), "yyyy-MM-dd"));
  const [associatedContractNumber, setAssociatedContractNumber] = useState<string | undefined>(initialData?.associatedContractNumber);
  const [county, setCounty] = useState(initialData?.county || '');
  const [ecmsPoNumber, setEcmsPoNumber] = useState(initialData?.ecmsPoNumber || '');
  const [stateRoute, setStateRoute] = useState(initialData?.stateRoute || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [emailBody, setEmailBody] = useState(initialData?.emailBody || '');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(initialData?.quoteItems || []);
  const [adminData, setAdminData] = useState<AdminData | undefined>(initialData?.adminData);
  const [includeFiles, setIncludeFiles] = useState<Record<AttachmentNames, boolean>>(initialData?.includeFiles || {
    "flagging-price-list": false,
    "flagging-service-area": false,
    "bedford-branch": false
  });
  const [includeTerms, setIncludeTerms] = useState<Record<TermsNames, boolean>>(initialData?.includeTerms || {
    "standard-terms": false,
    "rental-agreements": false,
    "equipment-sale": false,
    "flagging-terms": false,
    "custom-terms": false
  });
  const [sending, setSending] = useState(initialData?.sending || false);
  const [emailSent, setEmailSent] = useState(initialData?.emailSent || false);
  const [emailError, setEmailError] = useState<string | null>(initialData?.emailError || null);
  const [quoteId, setQuoteId] = useState<string>(initialData?.quoteId || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [additionalFiles, setAdditionalFiles] = useState<File[]>(initialData?.additionalFiles || []);
  const [uniqueToken, setUniqueToken] = useState<string>(initialData?.uniqueToken || '');
  const [sender, setSender] = useState<User>(initialData?.sender || {
    name: 'Napoleon Dunn',
    email: 'it@establishedtraffic.com',
    role: 'President'
  });

  // Ajustes automáticos al cambiar clientes
  useEffect(() => {
    if (selectedCustomers.length > 0) {
      setPaymentTerms(selectedCustomers[0].paymentTerms as PaymentTerms);
    }
  }, [selectedCustomers]);

  useEffect(() => {
    setPointOfContact(undefined);
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
    sender,
    setSender
  };

  return (
    <QuoteFormContext.Provider value={value}>
      {children}
    </QuoteFormContext.Provider>
  );
}
