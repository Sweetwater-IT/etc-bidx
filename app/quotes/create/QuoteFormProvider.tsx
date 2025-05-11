"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Customer } from "@/types/Customer";
import { QuoteItem } from "@/types/IQuoteItem";
import { format } from "date-fns";
import { useCustomers } from "@/hooks/use-customers";

interface QuoteFormState {
  // Customer-related state
  selectedCustomers: string[];
  setSelectedCustomers: (customers: string[]) => void;
  
  // Contact state
  selectedEmail: string;
  setSelectedEmail: (email: string) => void;
  ccEmails: string[];
  setCcEmails: (emails: string[]) => void;
  bccEmails: string[];
  setBccEmails: (emails: string[]) => void;
  
  // Quote form state
  quoteType: "new" | "estimate" | "job";
  setQuoteType: (type: "new" | "estimate" | "job") => void;
  paymentTerms: string;
  setPaymentTerms: (terms: string) => void;
  digitalSignature: boolean;
  setDigitalSignature: (value: boolean) => void;
  quoteDate: string;
  setQuoteDate: (date: string) => void;
  
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
  
  // UI state
  sending: boolean;
  setSending: (value: boolean) => void;
  emailSent: boolean;
  setEmailSent: (value: boolean) => void;
  emailError: string | null;
  setEmailError: (error: string | null) => void;
  
  // Generated data
  quoteId: string;
  
  // Customer data
  customers: Customer[];
  isLoadingCustomers: boolean;
  
  // Helper functions
  getContactsForSelectedCustomers: () => { value: string; label: string; customer: string }[];
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
  const { customers, getCustomers, isLoading } = useCustomers();
  
  // State initialization
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  
  const [quoteType, setQuoteType] = useState<"new" | "estimate" | "job">("new");
  const [paymentTerms, setPaymentTerms] = useState<string>("net30");
  const [digitalSignature, setDigitalSignature] = useState(false);
  const [quoteDate, setQuoteDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
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
  
  // Fetch customers on mount
  useEffect(() => {
    getCustomers();
  }, []);
  
  // Update payment terms when customers change
  useEffect(() => {
    if (selectedCustomers.length > 0) {
      const firstCustomer = customers.find(c => c.name === selectedCustomers[0]);
      if (firstCustomer && firstCustomer.paymentTerms) {
        setPaymentTerms(firstCustomer.paymentTerms);
      }
    }
  }, [selectedCustomers, customers]);
  
  // Reset contact selections when customers change
  useEffect(() => {
    setSelectedEmail("");
    setCcEmails([]);
    setBccEmails([]);
  }, [selectedCustomers]);
  
  // Helper function to get contacts for selected customers
  const getContactsForSelectedCustomers = () => {
    const selectedCustomerObjects = customers.filter(c => selectedCustomers.includes(c.name));
    const allContacts: { value: string; label: string; customer: string }[] = [];
    
    selectedCustomerObjects.forEach(customer => {
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
    selectedEmail,
    setSelectedEmail,
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
    sending,
    setSending,
    emailSent,
    setEmailSent,
    emailError,
    setEmailError,
    quoteId,
    customers,
    isLoadingCustomers: isLoading,
    getContactsForSelectedCustomers
  };
  
  return (
    <QuoteFormContext.Provider value={value}>
      {children}
    </QuoteFormContext.Provider>
  );
}