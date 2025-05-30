"use client";

import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { useCustomers } from "@/hooks/use-customers";
import { useEffect, useState } from "react";
import { Customer } from "@/types/Customer";
import { toast } from "sonner";
import { AdminData } from "@/types/TAdminData";
import { QuoteItem } from "@/types/IQuoteItem";
import { generateUniqueId } from "../active-bid/signs/generate-stable-id";
import { Flagging } from "@/types/TFlagging";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";
import { SaleItem } from "@/types/TSaleItem";
import { QuoteTypeSection } from "./sections/QuoteTypeSection";
import { BranchAndContractSection } from "./sections/BranchAndContractSection";
import { LocationDetailsSection } from "./sections/LocationDetailsSection";
import { PaymentAndDateSection } from "./sections/PaymentAndDateSection";
import { CustomersSection } from "./sections/CustomersSection";
import { DigitalSignatureSection } from "./sections/DigitalSignatureSection";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings2 } from "lucide-react";

interface Estimate {
  contract_number: string;
  branch: string;
}

interface Job {
  job_number: string;
  branch: string;
}

export type PaymentTerms = "COD" | "CC" | "NET15" | "NET30" | "DUR";

export function QuoteAdminInformation() {
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
  } = useQuoteForm();

  const { customers, getCustomers, isLoading } = useCustomers();
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [allEstimates, setAllEstimates] = useState<Estimate[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoadingEstimatesJobs, setIsLoadingEstimatesJobs] = useState(false);

  useEffect(() => {
    getCustomers();
  }, []);

  // Clear associated contract number when branch or quote type changes
  useEffect(() => {
    setAssociatedContractNumber("");
    setCounty("");
    setEcmsPoNumber("");
    setQuoteItems([]);
    setStateRoute("");
    setAdminData(undefined);
  }, [selectedBranch, quoteType]);

  //initialize
  useEffect(() => {
    const fetchEstimatesAndJobs = async () => {
      try {
        setIsLoadingEstimatesJobs(true);
        const response = await fetch("/api/quotes/estimate-job-data");
        const data = await response.json();

        if (response.ok) {
          setAllEstimates(data.estimates || []);
          setAllJobs(data.jobs || []);
        } else {
          console.error("Failed to fetch estimates and jobs:", data.error);
          toast.error(data.error);
        }
      } catch (error) {
        console.error("Error fetching estimates and jobs:", error);
        toast.error(error as string);
      } finally {
        setIsLoadingEstimatesJobs(false);
      }
    };

    fetchEstimatesAndJobs();
  }, []);

  //this gets all the details for a bid whenever you hit job number or estimate and select a contract
  useEffect(() => {
    if (
      !associatedContractNumber ||
      associatedContractNumber === "" ||
      !quoteType ||
      quoteType === "new"
    )
      return;

    const fetchBidData = async () => {
      try {
        const response = await fetch("/api/quotes/bid-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractNumber: associatedContractNumber,
            type: quoteType,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          const adminDataResponse: AdminData = data.data.admin_data;
          setCounty(adminDataResponse.county.name);
          setStateRoute(adminDataResponse.srRoute);
          setAdminData(adminDataResponse);
          if (quoteType === "estimate") {
            setEcmsPoNumber(adminDataResponse.contractNumber);
          }
          const bidContractor = customers.find(
            (customer) => customer.name === data.data.contractor_name
          );
          if (bidContractor) {
            setSelectedCustomers([bidContractor]);
          }

          if (quoteType === "job") return;

          const quoteItemsFromEstimate: QuoteItem[] = [];

          if (data.data.mpt_rental?._summary?.revenue > 0) {
            const mptMob: QuoteItem = {
              id: generateUniqueId(),
              itemNumber: "0608-0001",
              description: "MPT Mobilization",
              uom: "EA",
              quantity: 1,
              notes: "",
              unitPrice: data.data.mpt_rental._summary.revenue * 0.35,
              discount: 0,
              discountType: "percentage",
              associatedItems: [],
            };
            const mpt: QuoteItem = {
              id: generateUniqueId(),
              itemNumber: "0901-0001",
              description: "MPT",
              uom: "EA",
              quantity: 1,
              notes: "",
              unitPrice: data.data.mpt_rental._summary.revenue * 0.65,
              discount: 0,
              discountType: "percentage",
              associatedItems: [],
            };
            quoteItemsFromEstimate.push(mptMob, mpt);
          }

          if (data.data.flagging?.revenue > 0) {
            const flagging: QuoteItem = {
              id: generateUniqueId(),
              itemNumber: "Flagging",
              description: "Flagging",
              uom: "DAY",
              quantity: 1,
              notes: "",
              unitPrice: data.data.flagging.revenue,
              discount: 0,
              discountType: "percentage",
              associatedItems: [],
            };
            quoteItemsFromEstimate.push(flagging);
          }

          if (data.data.service_work?.revenue > 0) {
            const serviceWork: QuoteItem = {
              id: generateUniqueId(),
              itemNumber: "Patterns",
              description: "Patterns",
              uom: "DAY",
              quantity: 1,
              notes: "",
              unitPrice: data.data.service_work.revenue,
              discount: 0,
              discountType: "percentage",
              associatedItems: [],
            };
            quoteItemsFromEstimate.push(serviceWork);
          }

          if (data.data.equipment_rental?.length > 0) {
            (data.data.equipment_rental as EquipmentRentalItem[]).forEach(
              (ri) => {
                quoteItemsFromEstimate.push({
                  id: generateUniqueId(),
                  //TODO map equipment item numbers to names
                  itemNumber: "0901-0120",
                  description: ri.name,
                  uom: "EA",
                  quantity: ri.quantity,
                  notes: "",
                  unitPrice: ri.revenue || 0,
                  discount: 0,
                  discountType: "percentage",
                  associatedItems: [],
                });
              }
            );
          }

          if (data.data.sale_items?.length > 0) {
            (data.data.sale_items as SaleItem[]).forEach((si) => {
              quoteItemsFromEstimate.push({
                id: generateUniqueId(),
                //TODO map equipment item numbers to names
                itemNumber: si.itemNumber,
                description: si.name,
                uom: "EA",
                quantity: si.quantity,
                notes: "",
                unitPrice: si.quotePrice * (1 + si.markupPercentage / 100),
                discount: 0,
                discountType: "percentage",
                associatedItems: [],
              });
            });
          }

          setQuoteItems(quoteItemsFromEstimate);
        } else {
          console.error("Failed to fetch bid details:", data.error);
          toast.error("Failed to fetch bid details: " + data.error);
        }
      } catch (error) {
        console.error("Error fetching bid details:", error);
        toast.error(error as string);
      }
    };

    fetchBidData();
  }, [associatedContractNumber, setCounty, setStateRoute, setEcmsPoNumber]);

  const handleCustomerSelection = (customerNames: string[] | undefined) => {
    if (!customerNames) {
      setSelectedCustomers([]);
      return;
    }

    const selectedCustomerObjects = customerNames
      .map((name) => customers.find((c) => c.name === name))
      .filter((customer): customer is Customer => !!customer);

    setSelectedCustomers(selectedCustomerObjects);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>

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
            associatedContractNumber={associatedContractNumber}
            setAssociatedContractNumber={setAssociatedContractNumber}
            isLoadingEstimatesJobs={isLoadingEstimatesJobs}
            allEstimates={allEstimates}
            allJobs={allJobs}
          />

          <LocationDetailsSection
            county={county}
            setCounty={setCounty}
            ecmsPoNumber={ecmsPoNumber}
            setEcmsPoNumber={setEcmsPoNumber}
            stateRoute={stateRoute}
            setStateRoute={setStateRoute}
            quoteType={quoteType}
          />

          <PaymentAndDateSection
            paymentTerms={paymentTerms}
            setPaymentTerms={setPaymentTerms}
            quoteDate={quoteDate}
            setQuoteDate={setQuoteDate}
          />

          <CustomersSection
            customers={customers}
            selectedCustomers={selectedCustomers}
            handleCustomerSelection={handleCustomerSelection}
            isLoading={isLoading}
          />

          <DigitalSignatureSection
            digitalSignature={digitalSignature}
            setDigitalSignature={setDigitalSignature}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
