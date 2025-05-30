"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multiselect";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { useCustomers } from "@/hooks/use-customers";
import { useEffect, useState } from "react";
import { Customer } from "@/types/Customer";
import { toast } from "sonner";
import { AdminData } from "@/types/TAdminData";
import { QuoteItem } from "@/types/IQuoteItem";
import { formatCurrency } from "@/lib/utils";
import { generateUniqueId } from "../active-bid/signs/generate-stable-id";
import { Flagging } from "@/types/TFlagging";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";
import { SaleItem } from "@/types/TSaleItem";

const PAYMENT_TERMS = [
  { value: "COD", label: "COD" },
  { value: "CC", label: "CC" },
  { value: "NET15", label: "NET15" },
  { value: "NET30", label: "NET30" },
  { value: "DUR", label: "DUR" },
];

const BRANCHES = [
  { value: 'All', label: 'All'},
  { value: "Turbotville", label: "Turbotville" },
  { value: "Hatfield", label: "Hatfield" },
  { value: "Bedford", label: "Bedford" },
];

interface Estimate {
  contract_number: string;
  branch: string;
}

interface Job {
  job_number: string;
  branch: string;
}

export type PaymentTerms = 'COD' | 'CC' | 'NET15' | 'NET30' | 'DUR'

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
    setAdminData
  } = useQuoteForm();

  const { customers, getCustomers, isLoading } = useCustomers();
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [allEstimates, setAllEstimates] = useState<Estimate[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoadingEstimatesJobs, setIsLoadingEstimatesJobs] = useState(false);

  useEffect(() => {
    getCustomers();
  }, [])

  // Clear associated contract number when branch or quote type changes
  useEffect(() => {
    setAssociatedContractNumber('');
    setCounty('');
    setEcmsPoNumber('');
    setQuoteItems([]);
    setStateRoute('');
    setAdminData(undefined)
  }, [selectedBranch, quoteType]);

  //initialize
  useEffect(() => {
    const fetchEstimatesAndJobs = async () => {
      try {
        setIsLoadingEstimatesJobs(true);
        const response = await fetch('/api/quotes/estimate-job-data');
        const data = await response.json();
        
        if (response.ok) {
          setAllEstimates(data.estimates.filter(e => !!e.contract_number) || []);
          setAllJobs(data.jobs.filter(j => !!j.job_number) || []);
        } else {
          console.error('Failed to fetch estimates and jobs:', data.error);
          toast.error(data.error)
        }
      } catch (error) {
        console.error('Error fetching estimates and jobs:', error);
        toast.error(error as string)
      } finally {
        setIsLoadingEstimatesJobs(false);
      }
    };

    fetchEstimatesAndJobs();
  }, []);

  //this gets all the details for a bid whenever you hit job number or estimate and select a contract
  useEffect(() => {
    if (!associatedContractNumber || associatedContractNumber === '' || !quoteType || quoteType === 'new') return;

    const fetchBidData = async () => {
      try {
        const response = await fetch('/api/quotes/bid-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            contractNumber: associatedContractNumber,
            type: quoteType 
          }),
        });
        
        const data = await response.json();
        if (response.ok) {
          const adminDataResponse : AdminData = data.data.admin_data
          setCounty(adminDataResponse.county.name);
          setStateRoute(adminDataResponse.srRoute);
          setAdminData(adminDataResponse)
          if(quoteType === 'estimate') {
            setEcmsPoNumber(adminDataResponse.contractNumber);
          }
          const bidContractor = customers.find(customer => customer.name === data.data.contractor_name);
          if(bidContractor){
            setSelectedCustomers([bidContractor])
          }

          if(quoteType === 'job') return;

          const quoteItemsFromEstimate : QuoteItem[] = []

          if(data.data.mpt_rental._summary.revenue > 0){
            const mptMob : QuoteItem = {
              id: generateUniqueId(),
              itemNumber: '0608-0001',
              description: 'MPT Mobilization',
              uom: 'EA',
              quantity: 1,
              notes: '',
              unitPrice: data.data.mpt_rental._summary.revenue * 0.35,
              discount: 0,
              discountType: 'percentage',
              associatedItems: []
            }
            const mpt : QuoteItem = {
              id: generateUniqueId(),
              itemNumber: '0901-0001',
              description: 'MPT',
              uom: 'EA',
              quantity: 1,
              notes: '',
              unitPrice: data.data.mpt_rental._summary.revenue * 0.65,
              discount: 0,
              discountType: 'percentage',
              associatedItems: []
            }
            quoteItemsFromEstimate.push(mptMob, mpt)
          }

          if((data.data.flagging as Flagging).revenue! > 0){
            const flagging : QuoteItem = {
              id: generateUniqueId(),
              itemNumber: 'Flagging',
              description: 'Flagging',
              uom: 'DAY',
              quantity: 1,
              notes: '',
              unitPrice: data.data.flagging.revenue,
              discount: 0,
              discountType: 'percentage',
              associatedItems: []
            }
            quoteItemsFromEstimate.push(flagging)
          }

          if((data.data.service_work as Flagging).revenue! > 0){
            const serviceWork : QuoteItem = {
              id: generateUniqueId(),
              itemNumber: 'Patterns',
              description: 'Patterns',
              uom: 'DAY',
              quantity: 1,
              notes: '',
              unitPrice: data.data.service_work.revenue,
              discount: 0,
              discountType: 'percentage',
              associatedItems: []
            }
            quoteItemsFromEstimate.push(serviceWork)
          }

          if((data.data.equipment_rental as EquipmentRentalItem[]).length > 0){
            (data.data.equipment_rental as EquipmentRentalItem[]).forEach(ri => {
              quoteItemsFromEstimate.push({
                id: generateUniqueId(),
                //TODO map equipment item numbers to names
                itemNumber: '0901-0120',
                description: ri.name,
                uom: 'EA',
                quantity: ri.quantity,
                notes: '',
                unitPrice: ri.revenue || 0,
                discount: 0,
                discountType: 'percentage',
                associatedItems: []
              })
            });
          }

          if((data.data.sale_items as SaleItem[]).length > 0){
            (data.data.sale_items as SaleItem[]).forEach(si => {
              quoteItemsFromEstimate.push({
                id: generateUniqueId(),
                //TODO map equipment item numbers to names
                itemNumber: si.itemNumber,
                description: si.name,
                uom: 'EA',
                quantity: si.quantity,
                notes: '',
                unitPrice: si.quotePrice * (1 + (si.markupPercentage / 100)),
                discount: 0,
                discountType: 'percentage',
                associatedItems: []
              })
            });
          }

          setQuoteItems(quoteItemsFromEstimate)
        } else {
          console.error('Failed to fetch bid details:', data.error);
          toast.error('Failed to fetch bid details: ' + data.error)
        }
      } catch (error) {
        console.error('Error fetching bid details:', error);
        toast.error(error as string)
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
      .map(name => customers.find(c => c.name === name))
      .filter((customer): customer is Customer => !!customer);

    setSelectedCustomers(selectedCustomerObjects);
  };

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Admin Information</h2>
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Quote Type</Label>
          <Select value={quoteType} onValueChange={(value) => setQuoteType(value as "new" | "estimate" | "job")}>
            <SelectTrigger>
              <SelectValue placeholder="Choose quote type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
              <SelectItem value="job">Job</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(quoteType === "estimate" || quoteType === "job") && (
          <>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(branch => (
                    <SelectItem key={branch.value} value={branch.value}>
                      {branch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{quoteType === "estimate" ? "Contract Number" : "Job Number"}</Label>
              <Select
                value={associatedContractNumber || ""}
                onValueChange={setAssociatedContractNumber}
                disabled={isLoadingEstimatesJobs}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${quoteType === "estimate" ? "contract" : "job"} number`} />
                </SelectTrigger>
                <SelectContent>
                  {quoteType === "estimate" 
                    ? allEstimates.filter(estimate => selectedBranch === 'All' ? true : estimate.branch === selectedBranch).map((estimate, index) => (
                        <SelectItem key={index} value={estimate.contract_number}>
                          {estimate.contract_number}
                        </SelectItem>
                      ))
                    : allJobs.filter(job => selectedBranch === 'All' ? true : job.branch === selectedBranch).map(job => (
                        <SelectItem key={job.job_number} value={job.job_number}>
                          {job.job_number}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>County</Label>
              <Input
                placeholder="County"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ECMS / PO #</Label>
              <Input
                placeholder="ECMS / PO #"
                value={ecmsPoNumber}
                onChange={(e) => setEcmsPoNumber(e.target.value)}
                disabled={quoteType === "job"}
              />
            </div>
            <div className="space-y-2">
              <Label>State Route</Label>
              <Input
                placeholder="State Route"
                value={stateRoute}
                onChange={(e) => setStateRoute(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Payment Terms</Label>
          <Select value={paymentTerms} onValueChange={setPaymentTerms}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Terms" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TERMS.map(term => (
                <SelectItem key={term.value} value={term.value}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quote Date</Label>
          <Input
            type="date"
            value={quoteDate}
            onChange={(e) => setQuoteDate(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>Customers</Label>
          <MultiSelect
            options={customers.map(customer => ({
              label: customer.name,
              value: customer.name
            }))}
            selected={selectedCustomers.map(customer => customer.name)}
            onChange={handleCustomerSelection}
            placeholder="Select customers"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center h-full pt-5">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="digital-signature"
              checked={digitalSignature}
              onCheckedChange={setDigitalSignature}
            />
            <Label htmlFor="digital-signature">Digital signature</Label>
          </div>
        </div>
      </div>
    </div>
  );
}