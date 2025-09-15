"use client";

import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { useCustomers } from "@/hooks/use-customers";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { AdminInformationSheet } from "./AdminInformationSheet";
import { ContractJobSelector } from "./ContractJobSelector";
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
  notes: "",
  associatedItems: [],
  isCustom: false,
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

  const handleSelect = async (jobOrEstimate: any) => {
    setSelectedContractJob(jobOrEstimate);
    setSheetMode("edit");
    setSheetOpen(false);

    if (!jobOrEstimate) {
      // Si se deselecciona, limpiar todo
      setAdminData(undefined);
      setAssociatedContractNumber(undefined);
      setSelectedCustomers([]);
      setQuoteItems([createEmptyQuoteItem()]);
      setNotes([]);
      setEstimateId(null);
      setJobId(null);
      setQuoteType("new");
      setSelectedContractJob(null); // Asegurarse de limpiar el estado local también
      return;
    }

    try {
      if (jobOrEstimate.contract_number) {
        
        setAssociatedContractNumber(jobOrEstimate.contract_number || "");
        setQuoteType("estimate");
        setEstimateId(jobOrEstimate.id);
        setJobId(null);

        
        const resEstimate = await fetch(`/api/estimates/${jobOrEstimate.id}`);
        if (resEstimate.ok) {
          const estimateData = await resEstimate.json();
          if (estimateData?.admin_data) {
            setAdminData(estimateData.admin_data);
            console.log("📊 Fetched adminData for estimate:", estimateData.admin_data);
          }
        }

        
        const resContacts = await fetch(`/api/estimates/${jobOrEstimate.id}/contacts`);
        if (resContacts.ok) {
          const contactsData = await resContacts.json();
          setSelectedCustomers(contactsData);
        }

       
        const resItems = await fetch(`/api/estimates/${jobOrEstimate.id}/items`);
        if (resItems.ok) {
          const itemsData = await resItems.json();
          if (Array.isArray(itemsData) && itemsData.length > 0) {
            setQuoteItems(itemsData);
          } else {
            setQuoteItems([createEmptyQuoteItem()]);
          }
          console.log("🚀 Fetched items for estimate:", itemsData.length > 0 ? itemsData : "none, created new item.");
        }
      } else {
        
        setAssociatedContractNumber(jobOrEstimate.job_number || jobOrEstimate.id);
        setQuoteType("job");
        setJobId(jobOrEstimate.id);
        setEstimateId(null);

        console.log("🚀 Selected job:", jobOrEstimate);

        const resJob = await fetch(`/api/jobs/${jobOrEstimate.id}`);
        if (resJob.ok) {
          const jobData = await resJob.json();
          if (jobData?.admin_data) {
            setAdminData(jobData.admin_data);
            console.log("📊 Fetched adminData for job:", jobData.admin_data);
          }
        }

      
        const resContacts = await fetch(`/api/jobs/${jobOrEstimate.id}/contacts`);
        if (resContacts.ok) {
          const contactsData = await resContacts.json();
          setSelectedCustomers(contactsData);
        }

        
        const resItems = await fetch(`/api/jobs/${jobOrEstimate.id}/items`);
        if (resItems.ok) {
          const items = await resItems.json();
          if (Array.isArray(items) && items.length > 0) {
            setQuoteItems(items);
          } else {
            setQuoteItems([createEmptyQuoteItem()]);
          }
          console.log("🚀 Fetched items for job:", items.length > 0 ? items : "none, created new item.");
        }
      }
    } catch (err) {
      toast.error("Could not load admin/contacts/items for this contract/job");
    }
  };



  return (
    <>
      <ContractJobSelector
        allEstimates={allEstimates}
        allJobs={allJobs}
        selectedContractJob={selectedContractJob}
        onSelect={handleSelect}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        quoteType={quoteType}
        branch={selectedBranch}
        jobNumber={associatedContractNumber}
        county={countyString}
        ecmsPoNumber={ecmsPoNumber}
        stateRoute={stateRoute}
        paymentTerms={paymentTerms}
        quoteDate={quoteDate}
        customers={selectedCustomers}
        isLoading={isLoading}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        isLoadingEstimatesJobs={isLoadingEstimatesJobs}
        digitalSignature={digitalSignature}
        showInitialAdminState={showInitialAdminState}
        adminData={adminData}
      />

     
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
