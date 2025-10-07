"use client";

import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { useCustomers } from "@/hooks/use-customers";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { AdminInformationSheet } from "./AdminInformationSheet";
import { QuoteItem } from "@/types/IQuoteItem";

interface Estimate {
  contract_number: string;
  branch: string;
}
interface Job {
  job_number: string;
  branch: string;
}

export type PaymentTerms = "COD" | "CC" | "NET15" | "NET30" | "DUR";

const createEmptyQuoteItem = (): QuoteItem => ({
  id: generateUniqueId(),
  itemNumber: "",
  description: "",
  uom: "",
  quantity: 0,
  unitPrice: 0,
  discount: 0,
  discountType: "dollar",
  notes: '',
  associatedItems: [],
  isCustom: false,
  is_tax_percentage: false,
  quote_id: null,
  tax: null
});

export function QuoteAdminInformation({
  showInitialAdminState = false,
}: {
  showInitialAdminState?: boolean;
}) {
  const {
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
    ecmsPoNumber,
    setEcmsPoNumber,
    stateRoute,
    setStateRoute,
    associatedContractNumber,
    setAssociatedContractNumber,
    setQuoteItems,
    adminData,
    setAdminData,
    setNotes,
    setEstimateId,
    setJobId,
    quoteId,
  } = useQuoteForm();

  const { customers, getCustomers, isLoading } = useCustomers();
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [allEstimates, setAllEstimates] = useState<Estimate[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoadingEstimatesJobs, setIsLoadingEstimatesJobs] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedContractJob, setSelectedContractJob] = useState<any>(null);
  const [searchValue, setSearchValue] = useState("");

  const countyString = adminData?.county?.country ?? "";

  const setCountyString = (name: string) => {
    setAdminData((prev) => {
      const base = prev ?? defaultAdminObject
      return {
        ...base,
        contractNumber: base.contractNumber || associatedContractNumber || "",
        county: {
          ...(base.county ?? defaultAdminObject.county),
          country: name,
        },
      }
    })
  };

  useEffect(() => {
    getCustomers();
  }, []);

  useEffect(() => {
    const fetchEstimatesAndJobs = async () => {
      try {
        setIsLoadingEstimatesJobs(true);
        const response = await fetch("/api/quotes/estimate-job-data");
        const data = await response.json();
        if (response.ok) {
          setAllEstimates(
            data.estimates.filter((e: any) => !!e.contract_number) || []
          );
          setAllJobs(data.jobs.filter((j: any) => !!j.job_number) || []);
        } else {
          toast.error(data.error);
        }
      } catch (error) {
        toast.error(error as string);
      } finally {
        setIsLoadingEstimatesJobs(false);
      }
    };
    fetchEstimatesAndJobs();
  }, []);

  const handleAddNew = () => {
    setSheetMode("create");
    setSelectedContractJob(null);
    setSheetOpen(true);
  };
  const handleEdit = () => {
    setSheetMode("edit");
    setSheetOpen(true);
  };

  return (
    <>
      {sheetOpen && (
        <AdminInformationSheet
          quoteId={quoteId ?? 0}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          quoteType={quoteType}
          setQuoteType={setQuoteType}
          paymentTerms={paymentTerms}
          setPaymentTerms={setPaymentTerms}
          quoteDate={quoteDate}
          setQuoteDate={setQuoteDate}
          selectedCustomers={selectedCustomers}
          setSelectedCustomers={setSelectedCustomers}
          digitalSignature={digitalSignature}
          setDigitalSignature={setDigitalSignature}
          county={countyString}
          setCounty={setCountyString}
          ecmsPoNumber={ecmsPoNumber}
          setEcmsPoNumber={setEcmsPoNumber}
          stateRoute={stateRoute}
          setStateRoute={setStateRoute}
          associatedContractNumber={associatedContractNumber || ""}
          setAssociatedContractNumber={setAssociatedContractNumber}
          setQuoteItems={setQuoteItems}
          adminData={adminData}
          setAdminData={setAdminData}
          customers={customers}
          isLoading={isLoading}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          isLoadingEstimatesJobs={isLoadingEstimatesJobs}
          allEstimates={allEstimates}
          allJobs={allJobs}
        />
      )}
    </>
  );
}
