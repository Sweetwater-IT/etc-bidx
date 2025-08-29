"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { QuoteTypeSection } from "./sections/QuoteTypeSection";
import { BranchAndContractSection } from "./sections/BranchAndContractSection";
import { LocationDetailsSection } from "./sections/LocationDetailsSection";
import { PaymentAndDateSection } from "./sections/PaymentAndDateSection";
import { CustomersSection } from "./sections/CustomersSection";
import { DigitalSignatureSection } from "./sections/DigitalSignatureSection";
import { Customer } from "@/types/Customer";
import { AdminData } from "@/types/TAdminData";
import { QuoteItem } from "@/types/IQuoteItem";
import { useState, useEffect } from "react";

interface Estimate {
  contract_number: string;
  branch: string;
}

interface Job {
  job_number: string;
  branch: string;
}

export type QuoteType = "new" | "estimate" | "job";
export type PaymentTerms = "COD" | "CC" | "NET15" | "NET30" | "DUR";

interface AdminInformationSheetProps {
  quoteType: QuoteType;
  setQuoteType: (type: QuoteType) => void;
  paymentTerms: PaymentTerms;
  setPaymentTerms: (terms: PaymentTerms) => void;
  quoteDate: string;
  setQuoteDate: (date: string) => void;
  selectedCustomers: Customer[];
  setSelectedCustomers: (customers: Customer[]) => void;
  digitalSignature: boolean;
  setDigitalSignature: (value: boolean) => void;
  county: string;
  setCounty: (county: string) => void;
  ecmsPoNumber: string;
  setEcmsPoNumber: (number: string) => void;
  stateRoute: string;
  setStateRoute: (route: string) => void;
  associatedContractNumber: string;
  setAssociatedContractNumber: (contractNumber: string) => void;
  setQuoteItems: (items: QuoteItem[]) => void;
  adminData: AdminData | undefined;
  setAdminData: (data: AdminData | undefined) => void;
  customers: Customer[];
  isLoading: boolean;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  isLoadingEstimatesJobs: boolean;
  allEstimates: Estimate[];
  allJobs: Job[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminInformationSheet({
  quoteType,
  setQuoteType,
  paymentTerms,
  setPaymentTerms,
  quoteDate,
  setQuoteDate,
  selectedCustomers,
  setSelectedCustomers,
  digitalSignature,
  setDigitalSignature,
  county,
  setCounty,
  ecmsPoNumber,
  setEcmsPoNumber,
  stateRoute,
  setStateRoute,
  associatedContractNumber,
  setAssociatedContractNumber,
  setQuoteItems,
  adminData,
  setAdminData,
  customers,
  isLoading,
  selectedBranch,
  setSelectedBranch,
  isLoadingEstimatesJobs,
  allEstimates,
  allJobs,
  open,
  onOpenChange,
}: AdminInformationSheetProps) {
  const [localContractNumber, setLocalContractNumber] = useState(
    associatedContractNumber
  );
  const [localCounty, setLocalCounty] = useState(county);
  const [localEcmsPoNumber, setLocalEcmsPoNumber] = useState(ecmsPoNumber);
  const [localStateRoute, setLocalStateRoute] = useState(stateRoute);
  const [localPaymentTerms, setLocalPaymentTerms] = useState(paymentTerms);
  const [localQuoteDate, setLocalQuoteDate] = useState(quoteDate);
  const [localDigitalSignature, setLocalDigitalSignature] =
    useState(digitalSignature);
  const [localSelectedCustomers, setLocalSelectedCustomers] =
    useState(selectedCustomers);

  useEffect(() => {
    if (open) {
      setLocalContractNumber(associatedContractNumber);
      setLocalCounty(county);
      setLocalEcmsPoNumber(ecmsPoNumber);
      setLocalStateRoute(stateRoute);
      setLocalPaymentTerms(paymentTerms);
      setLocalQuoteDate(quoteDate);
      setLocalDigitalSignature(digitalSignature);
      setLocalSelectedCustomers(selectedCustomers);
    }
  }, [
    open,
    associatedContractNumber,
    county,
    ecmsPoNumber,
    stateRoute,
    paymentTerms,
    quoteDate,
    digitalSignature,
    selectedCustomers,
  ]);

const handleCustomerSelection = (customerIds: string[] | undefined) => {
  if (!customerIds) {
    setLocalSelectedCustomers([]);
    return;
  }
  const selectedCustomerObjects = customerIds
    .map((id) => customers.find((c) => c.id.toString() === id)) // 👈 Buscamos por id
    .filter((customer): customer is Customer => !!customer);

  setLocalSelectedCustomers(selectedCustomerObjects);
};

  const handleSave = () => {
    setAssociatedContractNumber(localContractNumber);
    setCounty(localCounty);
    setEcmsPoNumber(localEcmsPoNumber);
    setStateRoute(localStateRoute);
    setPaymentTerms(localPaymentTerms);
    setQuoteDate(localQuoteDate);
    setDigitalSignature(localDigitalSignature);
    setSelectedCustomers(localSelectedCustomers);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[600px] pt-2">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold">
            Admin Information
          </SheetTitle>
        </SheetHeader>
        <div className="border-b" />
        <div className="mt-2 grid grid-cols-1 items-center gap-4 md:grid-cols-2 px-4">
          <QuoteTypeSection quoteType={quoteType} setQuoteType={setQuoteType} />
          <BranchAndContractSection
            quoteType={quoteType}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            associatedContractNumber={localContractNumber}
            setAssociatedContractNumber={setLocalContractNumber}
            isLoadingEstimatesJobs={isLoadingEstimatesJobs}
            allEstimates={allEstimates}
            allJobs={allJobs}
          />
          <LocationDetailsSection
            county={localCounty}
            setCounty={setLocalCounty}
            ecmsPoNumber={localEcmsPoNumber}
            setEcmsPoNumber={setLocalEcmsPoNumber}
            stateRoute={localStateRoute}
            setStateRoute={setLocalStateRoute}
            quoteType={quoteType}
          />
          <PaymentAndDateSection
            paymentTerms={localPaymentTerms}
            setPaymentTerms={setLocalPaymentTerms}
            quoteDate={localQuoteDate}
            setQuoteDate={setLocalQuoteDate}
          />
          <CustomersSection
            customers={customers}
            selectedCustomers={localSelectedCustomers}
            handleCustomerSelection={handleCustomerSelection}
            isLoading={isLoading}
          />
          <DigitalSignatureSection
            digitalSignature={localDigitalSignature}
            setDigitalSignature={setLocalDigitalSignature}
          />
        </div>

        <div className="flex justify-end mt-6 mr-4">
          <Button onClick={handleSave} variant="default">
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
