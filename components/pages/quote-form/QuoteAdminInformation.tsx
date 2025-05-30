"use client";

import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { useCustomers } from "@/hooks/use-customers";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminData } from "@/types/TAdminData";
import { QuoteItem } from "@/types/IQuoteItem";
import { generateUniqueId } from "../active-bid/signs/generate-stable-id";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";
import { SaleItem } from "@/types/TSaleItem";
import { AdminInformationSheet } from "./AdminInformationSheet";

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

  return (
    <AdminInformationSheet
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
      county={county}
      setCounty={setCounty}
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
  );
}
