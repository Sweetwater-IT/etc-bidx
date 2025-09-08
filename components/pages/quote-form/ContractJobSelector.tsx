"use client";

import { useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AdminData } from "@/types/TAdminData";
import { AdminInformationSheet } from "./AdminInformationSheet";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { Customer } from "@/types/Customer";
import { toast } from "sonner";

interface Estimate {
  contract_number: string;
  branch: string;
}

interface Job {
  job_number: string;
  branch: string;
}

interface ContractJobSelectorProps {
  allEstimates: Estimate[];
  allJobs: Job[];
  selectedContractJob: Estimate | Job | null;
  onSelect: (job: Estimate | Job | null) => void;
  onAddNew: () => void;
  onEdit: () => void;
  searchValue: string;
  setSearchValue: (v: string) => void;

  customers: Customer[];
  isLoading: boolean;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  isLoadingEstimatesJobs: boolean;

  quoteType: string;
  branch: string;
  jobNumber?: string;
  county?: string;
  ecmsPoNumber?: string;
  stateRoute?: string;
  paymentTerms?: string;
  quoteDate?: string;
  digitalSignature?: boolean;

  showInitialAdminState?: boolean;
  adminData?: AdminData;
}

export function ContractJobSelector({
  allEstimates = [],
  allJobs = [],
  selectedContractJob,
  onSelect,
  onAddNew,
  onEdit,
  searchValue,
  setSearchValue,
  customers,
  isLoading,
  selectedBranch,
  setSelectedBranch,
  isLoadingEstimatesJobs,
  showInitialAdminState,
  adminData,
}: ContractJobSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    quoteId,
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
    setAdminData,
    setNotes,
  } = useQuoteForm();

  const handleBlur = () => {
    setTimeout(() => setDropdownOpen(false), 150);
  };

  const filteredEstimates = allEstimates.filter(
    (e) => !searchValue || e.contract_number.includes(searchValue)
  );

  const filteredJobs = allJobs.filter(
    (j) => !searchValue || j.job_number.includes(searchValue)
  );

  // 🟢 caso edición inicial → tabla + 3 puntitos
  if (showInitialAdminState && adminData) {
    return (
      <div className="relative p-6">
        <h2 className="text-lg font-semibold mb-4">Admin Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Contract Number</p>
            <p>{adminData.contract_number || "-"}</p>
          </div>
          <div>
            <p className="font-medium">Job Number</p>
            <p>{adminData.job_id || "-"}</p>

          </div>
          <div>
            <p className="font-medium">Branch</p>
            <p>{selectedBranch || "-"}</p>
          </div>
          <div>
            <p className="font-medium">County</p>
            <p>{adminData.county?.country || "-"}</p>
          </div>
          <div>
            <p className="font-medium">ECMS/PO #</p>
            <p>{ecmsPoNumber || "-"}</p>
          </div>
          <div>
            <p className="font-medium">State Route</p>
            <p>{stateRoute || "-"}</p>
          </div>
          <div>
            <p className="font-medium">Payment Terms</p>
            <p>{paymentTerms || "-"}</p>
          </div>
          <div>
            <p className="font-medium">Quote Date</p>
            <p>{quoteDate ? new Date(quoteDate).toLocaleDateString() : "-"}</p>
          </div>
          <div>
            <p className="font-medium">Customers</p>
            <p>
              {selectedCustomers.length > 0
                ? selectedCustomers.map((c) => c.name).join(", ")
                : "-"}
            </p>
          </div>
          <div>
            <p className="font-medium">Digital Signature</p>
            <p>{digitalSignature ? "Signed" : "Pending"}</p>
          </div>
        </div>

        {/* menú acciones */}
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSheetOpen(true)}>
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/quotes?id=${quoteId}`, {
                      method: "DELETE",
                    });
                    const data = await res.json();

                    if (res.ok && data.success) {
                      setAdminData(undefined);
                      onSelect(null);
                      toast.success("Admin data deleted");
                    } else {
                      toast.error(data.message || "Failed to delete admin data");
                    }
                  } catch (err) {
                    toast.error("Unexpected error deleting admin data");
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sheet para editar */}
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
          county={adminData.county?.country || ""}
          setCounty={(name) =>
            setAdminData({
              ...adminData,
              county: { ...(adminData.county || {}), country: name },
            } as AdminData)
          }
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
      </div>
    );
  }

  // 🟡 Caso: no hay adminData → dropdown de búsqueda como antes
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">Admin Information</div>
        {selectedContractJob && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded hover:bg-muted focus:outline-none">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onSelect(null);
                  // Limpiar todos los estados relacionados
                  setAdminData(undefined);
                  setAssociatedContractNumber(undefined);
                  setSelectedCustomers([]);
                  setQuoteItems([]);
                  setNotes([]);
                  setQuoteType("new");

                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 col-span-1">
            <div
              className={`${selectedContractJob ? "" : "mb-2"
                } font-medium text-sm`}
            >
              Contract / Job
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                className={`w-full rounded-md pr-3 py-2 mb-1 text-muted-foreground ${selectedContractJob ? "" : "border border-border px-2"
                  }`}
                placeholder="Search or add a contract/job..."
                value={
                  selectedContractJob
                    ? "contract_number" in selectedContractJob
                      ? selectedContractJob.contract_number
                      : selectedContractJob.job_number
                    : searchValue
                }
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setDropdownOpen(true);
                  if (selectedContractJob) onSelect(null);
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={handleBlur}
                readOnly={!!selectedContractJob}
              />
              {/* Dropdown */}
              {dropdownOpen && !selectedContractJob && (
                <div className="absolute left-0 right-0 z-20 bg-popover border border-border rounded shadow max-h-64 overflow-auto mt-1">
                  <div
                    className="cursor-pointer px-3 py-2 hover:bg-muted border-b font-medium"
                    onMouseDown={onAddNew}
                  >
                    + Add new
                  </div>
                  <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">
                    Estimates
                  </div>
                  {filteredEstimates.map((e) => (
                    <div
                      key={e.contract_number}
                      className="px-3 py-2 cursor-pointer hover:bg-muted"
                      onMouseDown={() => onSelect(e)}
                    >
                      {e.contract_number}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({e.branch})
                      </span>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">
                    Jobs
                  </div>
                  {filteredJobs.map((j) => (
                    <div
                      key={j.job_number}
                      className="px-3 py-2 cursor-pointer hover:bg-muted"
                      onMouseDown={() => onSelect(j)}
                    >
                      {j.job_number}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({j.branch})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* espacio vacío para alinear */}
          <div className="hidden md:block" />
        </div>
      </div>

      {/* Datos cuando hay un contrato/job seleccionado */}
      {selectedContractJob && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Quote Type</label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {quoteType || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Branch</label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {selectedBranch && selectedBranch !== "All" ? selectedBranch : "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Job Number</label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {associatedContractNumber || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold">County</label>
            <div className="pr-3 py-1 text-foreground select-text cursor-default">
              {adminData?.county?.country || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold">ECMS/PO#</label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {ecmsPoNumber || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold">State Route</label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {stateRoute || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Payment Terms</label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {paymentTerms || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Quote Date</label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {quoteDate || "-"}
            </div>
          </div>
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-semibold">Customers</label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {selectedCustomers.length > 0
                ? selectedCustomers.map((c) => c.name).join(", ")
                : "-"}
            </div>
          </div>
          <div className="flex flex-col md:col-span-1">
            <label className="text-sm font-semibold">Digital Signature</label>
            <div className="flex items-center h-full">
              <input
                type="checkbox"
                disabled
                checked={!!digitalSignature}
                className="mr-2"
              />
              <span className="select-text cursor-default text-muted-foreground">
                Digital signature
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
