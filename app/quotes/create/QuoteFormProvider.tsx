"use client";

import React, {
  Component,
  createContext,
  useContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { Customer } from "@/types/Customer";
import { QuoteItem } from "@/types/IQuoteItem";
import { format } from "date-fns";
import { AdminData } from "@/types/TAdminData";
import { Note } from "@/components/pages/quote-form/QuoteNotes";
import { PaymentTerms } from "@/components/pages/quote-form/QuoteAdminInformation";
import { User } from "@/types/User";
import {
  DefaultQuote,
  defaultQuote,
} from "@/types/default-objects/defaultQuoteObject";
import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";

export type QuoteStatus = "Not Sent" | "Sent" | "Accepted";

export type AttachmentNames =
  | "flagging-price-list"
  | "flagging-service-area"
  | "bedford-branch";

export type TermsNames =
  | "standard-terms"
  | "rental-agreements"
  | "equipment-sale"
  | "flagging-terms"
  | "custom-terms";

interface PointOfContact {
  name: string;
  email: string;
}

interface QuoteFormState {

  loadingMetadata: boolean;
  setLoadingMetadata: Dispatch<SetStateAction<any>>;

  quoteMetadata: any;
  setQuoteMetadata: Dispatch<SetStateAction<any>>;

  selectedCustomers: Customer[];
  setSelectedCustomers: Dispatch<SetStateAction<Customer[]>>;

  pointOfContact?: PointOfContact;
  setPointOfContact: Dispatch<SetStateAction<PointOfContact | undefined>>;

  estimateId: number | null
  setEstimateId: Dispatch<SetStateAction<number | null>>

  jobId: number | null;
  setJobId: Dispatch<SetStateAction<number | null>>;

  ccEmails: string[];
  setCcEmails: Dispatch<SetStateAction<string[]>>;

  bccEmails: string[];
  setBccEmails: Dispatch<SetStateAction<string[]>>;

  status: QuoteStatus;
  setStatus: Dispatch<SetStateAction<QuoteStatus>>;

  quoteType: "straight_sale" | "to_project" | "estimate_bid";
  setQuoteType: Dispatch<SetStateAction<"straight_sale" | "to_project" | "estimate_bid">>;

  paymentTerms: PaymentTerms;
  setPaymentTerms: Dispatch<SetStateAction<PaymentTerms>>;

  digitalSignature: boolean;
  setDigitalSignature: Dispatch<SetStateAction<boolean>>;

  quoteDate: string;
  setQuoteDate: Dispatch<SetStateAction<string>>;

  canAutosave: boolean;
  setCanAutosave: Dispatch<SetStateAction<boolean>>;

  ecmsPoNumber: string;
  setEcmsPoNumber: Dispatch<SetStateAction<string>>;

  stateRoute: string;
  setStateRoute: Dispatch<SetStateAction<string>>;

  subject: string;
  setSubject: Dispatch<SetStateAction<string>>;

  emailBody: string;
  setEmailBody: Dispatch<SetStateAction<string>>;

  quoteItems: QuoteItem[];
  setQuoteItems: Dispatch<SetStateAction<QuoteItem[]>>;

  includeFiles: Record<AttachmentNames, boolean>;
  setIncludeFiles: Dispatch<SetStateAction<Record<AttachmentNames, boolean>>>;

  includeTerms: Record<TermsNames, boolean>;
  setIncludeTerms: Dispatch<SetStateAction<Record<TermsNames, boolean>>>;

  customTerms: string;
  setCustomTerms: Dispatch<SetStateAction<string>>;

  sending: boolean;
  setSending: Dispatch<SetStateAction<boolean>>;

  emailSent: boolean;
  setEmailSent: Dispatch<SetStateAction<boolean>>;

  emailError: string | null;
  setEmailError: Dispatch<SetStateAction<string | null>>;

  associatedContractNumber?: string;
  setAssociatedContractNumber: Dispatch<SetStateAction<string | undefined>>;

  adminData?: AdminData;
  setAdminData: Dispatch<SetStateAction<AdminData | undefined>>;

  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;

  additionalFiles: File[];
  setAdditionalFiles: Dispatch<SetStateAction<File[]>>;

  uniqueToken: string;
  setUniqueToken: Dispatch<SetStateAction<string>>;

  quoteId: number | null;
  setQuoteId: Dispatch<SetStateAction<number | null>>;

  quoteNumber: string;
  setQuoteNumber: Dispatch<SetStateAction<string>>;

  sender: User;
  setSender: Dispatch<SetStateAction<User>>;
}

const QuoteFormContext = createContext<QuoteFormState | undefined>(undefined);

export function useQuoteForm() {
  const context = useContext(QuoteFormContext);
  if (!context) {
    throw new Error("useQuoteForm must be used within a QuoteFormProvider");
  }
  return context;
}

interface QuoteFormProviderProps {
  children: React.ReactNode;
  initialData?: Partial<DefaultQuote>;
}

const createEmptyQuoteItem = (): QuoteItem => ({
  id: generateUniqueId(),
  itemNumber: "",
  description: "",
  uom: "",
  quantity: 0,
  unitPrice: 0,
  discount: 0,
  discountType: "dollar",
  notes: "",
  associatedItems: [],
  isCustom: false,
  is_tax_percentage: false,
  quote_id: null,
  tax: null
});

export default function QuoteFormProvider({
  children,
  initialData,
}: QuoteFormProviderProps) {
  const mergedData: DefaultQuote = {
    ...defaultQuote,
    ...initialData,
    customers: initialData?.customers || defaultQuote.customers,
    items: initialData?.items || defaultQuote.items,
    includedTerms: initialData?.includedTerms || defaultQuote.includedTerms,
  };

  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>(
    mergedData.customers
  );
  const [canAutosave, setCanAutosave] = useState(false);


  const [pointOfContact, setPointOfContact] = useState<
    PointOfContact | undefined
  >(undefined);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [customTerms, setCustomTerms] = useState<string>(
    mergedData.includedTerms["custom-terms"] && Array.isArray(mergedData.notes)
      ? mergedData?.notes?.map((n: any) => typeof n === 'string' ? n : n.text).join("\n")
      : "",
  );

  const [quoteMetadata, setQuoteMetadata] = useState<any>(null)
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(false)

  const [status, setStatus] = useState<QuoteStatus>(mergedData.status);
  const [quoteType, setQuoteType] = useState<"straight_sale" | "to_project" | "estimate_bid">("straight_sale");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("NET30");
  const [digitalSignature, setDigitalSignature] = useState(false);
  const [quoteDate, setQuoteDate] = useState(
    format(mergedData.quoteDate, "yyyy-MM-dd")
  );
  const [associatedContractNumber, setAssociatedContractNumber] = useState<
    string | undefined
  >(undefined);

  const [estimateId, setEstimateId] = useState<number | null>(
    typeof mergedData.estimate_id === "number" ? mergedData.estimate_id : null
  );

  const [jobId, setJobId] = useState<number | null>(

    typeof mergedData.job_id === "number" ? mergedData.job_id : null
  );

  const [ecmsPoNumber, setEcmsPoNumber] = useState(mergedData.ecmsPoNumber);
  const [stateRoute, setStateRoute] = useState(mergedData.stateRoute);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(
    mergedData.items || []
  );

  const [adminData, setAdminData] = useState<AdminData | undefined>(
    mergedData.adminData
  );

  const [includeFiles, setIncludeFiles] = useState<
    Record<AttachmentNames, boolean>
  >({
    "flagging-price-list": false,
    "flagging-service-area": false,
    "bedford-branch": false,
  });
  const [includeTerms, setIncludeTerms] = useState<
    Record<TermsNames, boolean>
  >(mergedData.includedTerms);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [quoteId, setQuoteId] = useState<number | null>(
    typeof mergedData.id === "number" ? mergedData.id : null
  );
  const [quoteNumber, setQuoteNumber] = useState<string>(
    typeof mergedData.quote_number === "string"
      ? mergedData.quote_number
      : ""
  );
  const [notes, setNotes] = useState<Note[]>(mergedData.notes as any);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [uniqueToken, setUniqueToken] = useState<string>(
    mergedData.id &&
      typeof mergedData.id === "string" &&
      mergedData.id === "NEW"
      ? ""
      : String(mergedData.id || "")
  );
  const [sender, setSender] = useState<User>({
    name: "Napoleon Dunn",
    email: "it@establishedtraffic.com",
    role: "President",
  });

  useEffect(() => {
    if (selectedCustomers.length > 0) {
      setPaymentTerms(
        (selectedCustomers[0].paymentTerms as PaymentTerms) || "NET30"
      );
    }
  }, [selectedCustomers]);

  useEffect(() => {
    setPointOfContact(undefined);
    setCcEmails([]);
    setBccEmails([]);
  }, [selectedCustomers]);

  const value: QuoteFormState = {
    loadingMetadata,
    setLoadingMetadata,
    quoteMetadata,
    setQuoteMetadata,
    selectedCustomers,
    setSelectedCustomers,
    pointOfContact,
    setPointOfContact,
    ccEmails,
    estimateId,
    setEstimateId,
    jobId,
    setJobId,
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
    quoteNumber,
    setQuoteNumber,
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
    setSender,
    canAutosave,
    setCanAutosave
  };

  return (
    <QuoteFormContext.Provider value={value}>
      {children}
    </QuoteFormContext.Provider>
  );
}
