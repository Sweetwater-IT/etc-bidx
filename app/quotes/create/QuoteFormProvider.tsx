"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Customer } from "@/types/Customer";
import { QuoteItem } from "@/types/IQuoteItem";
import { format } from "date-fns";
import { useCustomers } from "@/hooks/use-customers";
import { AdminData } from "@/types/TAdminData";

interface PointOfContact {
  name : string;
  email: string;
}

export type QuoteStatus = 'Draft' | 'Not Sent' | 'Sent'

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
  paymentTerms: string;
  setPaymentTerms: (terms: string) => void;
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
  setAdminData : (adminDAta : AdminData) => void;
  
  // Generated data
  quoteId: string;
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
  const [status, setStatus] = useState<QuoteStatus>('Draft')
  
  const [quoteType, setQuoteType] = useState<"new" | "estimate" | "job">("new");
  const [paymentTerms, setPaymentTerms] = useState<string>("net30");
  const [digitalSignature, setDigitalSignature] = useState(false);
  const [quoteDate, setQuoteDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [adminData, setAdminData] = useState<AdminData>();
  const [associatedContractNumber, setAssociatedContractNumber] = useState<string>();
  
  // Admin fields for estimates/jobs
  const [county, setCounty] = useState<string>("");
  const [ecmsPoNumber, setEcmsPoNumber] = useState<string>("");
  const [stateRoute, setStateRoute] = useState<string>("");
  
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  
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
  
  // Generate quote ID
  const quoteId = `Q-${Math.floor(100 + Math.random() * 900)}`;

  // Update payment terms when customers change
  useEffect(() => {
    if (selectedCustomers.length > 0) {
        setPaymentTerms(selectedCustomers[0].paymentTerms);
    }
  }, [selectedCustomers]);
  
  // Reset contact selections when customers change
  useEffect(() => {
    setPointOfContact(undefined)
    setCcEmails([]);
    setBccEmails([]);
  }, [selectedCustomers]);
  
  // Helper function to get contacts for selected customers
  const getContactsForSelectedCustomers = () => {
    const allContacts: { value: string; label: string; customer: string }[] = [];
    
    selectedCustomers.forEach(customer => {
      customer.emails.forEach((email, index) => {
        allContacts.push({
          value: email,
          label: `${customer.names[index] || ""} (${email}) - ${customer.name}`,
          customer: customer.name
        });
      });
    });
    
    return allContacts;
  };
  
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
    associatedContractNumber,
    setAssociatedContractNumber,
    adminData,
    setAdminData,
    status,
    setStatus
  };
  
  return (
    <QuoteFormContext.Provider value={value}>
      {children}
    </QuoteFormContext.Provider>
  );
}