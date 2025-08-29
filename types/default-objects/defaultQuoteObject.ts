import { AdminData } from "../TAdminData";
import { Customer } from "../Customer";
import { TermsNames } from "../../app/quotes/create/QuoteFormProvider";
import { QuoteItem } from "../IQuoteItem";

export const defaultAdminObject: AdminData = {
  contractNumber: "",
  estimator: "",
  division: null,
  lettingDate: null,
  owner: null,
  county: {
    id: 0,
    name: "",
    district: 0,
    branch: "",
    laborRate: 0,
    fringeRate: 0,
    shopRate: 0,
    flaggingRate: 0,
    flaggingBaseRate: 0,
    flaggingFringeRate: 0,
    ratedTargetGM: 0,
    nonRatedTargetGM: 0,
    insurance: 0,
    fuel: 0,
    market: "LOCAL",
  },
  srRoute: "",
  location: "",
  dbe: "",
  startDate: null,
  endDate: null,
  winterStart: undefined,
  winterEnd: undefined,
  owTravelTimeHours: 0,
  owTravelTimeMinutes: 0,
  owMileage: 0,
  fuelCostPerGallon: 0,
  rated: "RATED",
  emergencyJob: false,
  emergencyFields: {
    emergencyHIVerticalPanels: 0,
    emergencyTypeXIVerticalPanels: 0,
    emergencyBLites: 0,
    emergencyACLites: 0,
    emergencySharps: 0,
  },
};

// ✅ Customer por defecto
export const defaultCustomer: Customer = {
  id: 0,
  name: "Unknown",
  displayName: "Unknown",
  emails: [],
  address: "",
  phones: [],
  roles: [],
  names: [],
  contactIds: [],
  url: "",
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  city: "",
  state: "",
  zip: "",
  customerNumber: 0,
  mainPhone: "",
  paymentTerms: "",
};


export const defaultIncludedTerms: Record<TermsNames, boolean> = {
  "standard-terms": false,
  "rental-agreements": false,
  "equipment-sale": false,
  "flagging-terms": false,
  "custom-terms": false,
};


export interface DefaultQuote {
  id: string;
  quote_number: string;
  status: "Not Sent" | "Sent" | "Accepted";
  date_sent: Date | null;
  customers: Customer[];
  items: QuoteItem[];
  adminData: AdminData;
  county: string;
  stateRoute: string;
  ecmsPoNumber: string;
  notes: string[];
  additionalFiles: any[];
  includedTerms: Record<TermsNames, boolean>;
  quoteDate: Date;
  createdBy: string;
}

export const defaultQuote: DefaultQuote = {
  id: "NEW",
  quote_number: "Q-0",
  status: "Not Sent",
  date_sent: null,
  customers: [defaultCustomer],
  items: [],
  adminData: defaultAdminObject,
  county: "",
  stateRoute: "",
  ecmsPoNumber: "",
  notes: [],
  additionalFiles: [],
  includedTerms: defaultIncludedTerms,
  quoteDate: new Date(),
  createdBy: "System",
};
