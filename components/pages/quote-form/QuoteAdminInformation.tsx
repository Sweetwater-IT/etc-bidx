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

const PAYMENT_TERMS = [
  { value: "COD", label: "COD" },
  { value: "CC", label: "CC" },
  { value: "NET15", label: "NET15" },
  { value: "NET30", label: "NET30" },
  { value: "DUR", label: "DUR" },
];

const BRANCHES = [
  { value: "turbotville", label: "Turbotville" },
  { value: "hatfield", label: "Hatfield" },
  { value: "bedford", label: "Bedford" },
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
  } = useQuoteForm();

  const { customers, getCustomers, isLoading } = useCustomers();
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [allEstimates, setAllEstimates] = useState<Estimate[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoadingEstimatesJobs, setIsLoadingEstimatesJobs] = useState(false);

  useEffect(() => {
    getCustomers();
  }, [])

  // Clear associated contract number when branch or quote type changes
  useEffect(() => {
    setAssociatedContractNumber('');
  }, [selectedBranch, quoteType, setAssociatedContractNumber]);

  // Fetch estimates and jobs
  useEffect(() => {
    const fetchEstimatesAndJobs = async () => {
      try {
        setIsLoadingEstimatesJobs(true);
        const response = await fetch('/api/quotes/estimate-job-data');
        const data = await response.json();
        
        if (response.ok) {
          setAllEstimates(data.estimates || []);
          setAllJobs(data.jobs || []);
        } else {
          console.error('Failed to fetch estimates and jobs:', data.error);
        }
      } catch (error) {
        console.error('Error fetching estimates and jobs:', error);
      } finally {
        setIsLoadingEstimatesJobs(false);
      }
    };

    fetchEstimatesAndJobs();
  }, []);

  // Fetch specific bid data when associatedContractNumber changes
  // Fetch specific bid data when associatedContractNumber changes
  useEffect(() => {
    if (!associatedContractNumber || !quoteType || quoteType === 'new') return;

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
          // Populate form fields with bid data
          setCounty(data.county || '');
          setStateRoute(data.state_route || '');
          setSelectedBranch(data.branch || '');
          setEcmsPoNumber(data.ecms_po_number || '');
          // Add more field updates as needed
        } else {
          console.error('Failed to fetch bid details:', data.error);
        }
      } catch (error) {
        console.error('Error fetching bid details:', error);
      }
    };

    fetchBidData();
  }, [associatedContractNumber, quoteType, setCounty, setStateRoute, setEcmsPoNumber]);

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
                    ? allEstimates.map((estimate, index) => (
                        <SelectItem key={index} value={estimate.contract_number}>
                          {estimate.contract_number}
                        </SelectItem>
                      ))
                    : allJobs.map(job => (
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