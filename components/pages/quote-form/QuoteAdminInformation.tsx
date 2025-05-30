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
import { useEffect, useState, useRef } from "react";
import { Customer } from "@/types/Customer";
import { toast } from "sonner";
import { AdminData } from "@/types/TAdminData";
import { QuoteItem } from "@/types/IQuoteItem";
import { formatCurrency } from "@/lib/utils";
import { generateUniqueId } from "../active-bid/signs/generate-stable-id";
import { Flagging } from "@/types/TFlagging";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";
import { SaleItem } from "@/types/TSaleItem";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

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
  const [openContractSheet, setOpenContractSheet] = useState(false);
  const [contractInput, setContractInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [newContract, setNewContract] = useState({
    contractNumber: "",
    branch: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);

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
          setAllEstimates(data.estimates || []);
          setAllJobs(data.jobs || []);
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

  // Filtro para busca
  const filteredEstimates = allEstimates
    .filter(e => !!e.contract_number)
    .filter(e =>
      e.contract_number.toLowerCase().includes(contractInput.toLowerCase()) && (selectedBranch === 'All' ? true : e.branch === selectedBranch)
    );
  const filteredJobs = allJobs
    .filter(j => !!j.job_number)
    .filter(j =>
      j.job_number.toLowerCase().includes(contractInput.toLowerCase()) && (selectedBranch === 'All' ? true : j.branch === selectedBranch)
    );

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Admin Information</h2>
      <div className="grid grid-cols-1 items-center gap-4">
        <div className="space-y-2">
          <Label>Contract / Job</Label>
          <div className="relative">
            <input
              ref={inputRef}
              className="w-full h-9 px-3 text-base border rounded focus:outline-none focus:ring-2 focus:ring-black bg-background text-foreground"
              placeholder="Search or add a contract/job..."
              value={contractInput}
              onChange={(e) => {
                setContractInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-background border rounded shadow z-20 max-h-64 overflow-auto">
                <div
                  className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted font-semibold"
                  onMouseDown={() => {
                    setShowDropdown(false);
                    setOpenContractSheet(true);
                  }}
                >
                  + Add new
                </div>
                <div className="px-3 pt-2 pb-1 text-xs text-muted-foreground font-bold">Estimates</div>
                {filteredEstimates.length === 0 && <div className="px-3 py-2 text-muted-foreground">No estimates found</div>}
                {filteredEstimates.map((estimate) => (
                  <div
                    key={estimate.contract_number}
                    className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted"
                    onMouseDown={() => {
                      setAssociatedContractNumber(estimate.contract_number);
                      setContractInput(estimate.contract_number);
                      setShowDropdown(false);
                    }}
                  >
                    {estimate.contract_number} <span className="text-xs text-muted-foreground">({estimate.branch})</span>
                  </div>
                ))}
                <div className="px-3 pt-2 pb-1 text-xs text-muted-foreground font-bold">Jobs</div>
                {filteredJobs.length === 0 && <div className="px-3 py-2 text-muted-foreground">No jobs found</div>}
                {filteredJobs.map((job) => (
                  <div
                    key={job.job_number}
                    className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted"
                    onMouseDown={() => {
                      setAssociatedContractNumber(job.job_number);
                      setContractInput(job.job_number);
                      setShowDropdown(false);
                    }}
                  >
                    {job.job_number} <span className="text-xs text-muted-foreground">({job.branch})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Sheet para adicionar novo contrato */}
      <Sheet open={openContractSheet} onOpenChange={setOpenContractSheet}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="text-2xl mb-2">Add New Contract</SheetTitle>
            <Separator className="mb-4" />
          </SheetHeader>
          <form className="flex flex-col gap-5 mt-4 px-4">
            <div className="flex flex-col gap-1">
              <Label>Contract Number</Label>
              <Input
                className="bg-background"
                placeholder="Enter contract number"
                value={newContract.contractNumber}
                onChange={(e) => setNewContract(prev => ({ ...prev, contractNumber: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Branch</Label>
              <Select
                value={newContract.branch}
                onValueChange={(value) => setNewContract(prev => ({ ...prev, branch: value }))}
              >
                <SelectTrigger className="bg-background">
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
            <Separator className="my-2" />
            <SheetClose asChild>
              <button
                type="button"
                className="bg-primary text-primary-foreground rounded py-2 mt-4 text-lg font-semibold hover:bg-primary/90 transition"
                onClick={() => {
                  // Aqui você pode adicionar lógica para salvar o novo contrato
                  setOpenContractSheet(false);
                  setNewContract({ contractNumber: "", branch: "" });
                }}
              >
                Save Contract
              </button>
            </SheetClose>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}