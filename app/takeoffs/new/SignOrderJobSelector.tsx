import { useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Estimate {
  contract_number: string;
  branch: string;
  contractorName?: string;
}

interface Job {
  job_number: string;
  branch: string;
  contractNumber?: string;
  contractorName?: string;
}

interface SignOrderJobSelectorProps {
  allJobs: Job[];
  selectedContractJob: Estimate | Job | null;
  onSelect: (job: Estimate | Job | null) => void;
  onAddNew: () => void;
  onEdit: () => void;
  searchValue: string;
  setSearchValue: (v: string) => void;
  // Sign order specific fields
  customer?: string;
  requestor?: string;
  branch?: string;
  orderDate?: string;
  needDate?: string;
  startDate?: string;
  endDate?: string;
  orderType?: string[];
  contractNumber?: string
  showInitialAdminState: boolean
}

export function SignOrderJobSelector({
  contractNumber,
  allJobs = [],
  selectedContractJob,
  onSelect,
  onAddNew,
  onEdit,
  searchValue,
  setSearchValue,
  customer,
  requestor,
  branch,
  orderDate,
  needDate,
  startDate,
  endDate,
  orderType,
  showInitialAdminState
}: SignOrderJobSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);

  const handleBlur = (e) => {
    setTimeout(() => setDropdownOpen(false), 150);
  };

  const filteredJobs = allJobs.filter(
    (j) => !searchValue || j.job_number.toLowerCase().includes(searchValue.toLowerCase()) || 
    (j.contractNumber && j.contractNumber.toLowerCase().includes(searchValue.toLowerCase()))
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">Job Information</div>
        {selectedContractJob && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded hover:bg-muted focus:outline-none">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelect(null)}>
                Clear Selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {(!contractNumber || contractNumber === '')  && <div className="md:col-span-2 col-span-1">
            <div className={`${selectedContractJob ? "" : "mb-2"} font-medium text-sm`}>
              Contract / Job Number
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                disabled={!!selectedContractJob}
                className={`w-full rounded-md pr-3 py-2 mb-1 text-muted-foreground ${
                  selectedContractJob ? "" : "border border-border px-2"
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
                    Jobs
                  </div>
                  {filteredJobs.map((j) => (
                    <div
                      key={j.job_number}
                      className="px-3 py-2 cursor-pointer hover:bg-muted"
                      onMouseDown={() => onSelect(j)}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          {j.job_number}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({j.branch})
                          </span>
                        </span>
                        {j.contractNumber && (
                          <span className="text-xs text-muted-foreground">
                            Contract: {j.contractNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>}
          {/* Empty space for alignment */}
          <div className="hidden md:block" />
        </div>
      </div>

      {(selectedContractJob || showInitialAdminState) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold">
              Customer
            </label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {customer || "-"}
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm font-semibold">
              Branch
            </label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {branch && branch !== "All" ? branch : selectedContractJob ? selectedContractJob.branch : "-"}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold">
              Contract Number
            </label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {!selectedContractJob ? contractNumber : "contract_number" in selectedContractJob 
                ? selectedContractJob.contract_number : 'contractNumber' in selectedContractJob ?
                selectedContractJob.contractNumber : "-"}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold">
              Requestor
            </label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {requestor || "-"}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold">
              Order Date
            </label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {orderDate || "-"}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold">
              Need Date
            </label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {needDate || "-"}
            </div>
          </div>

          {/* Order Type spans 2 columns */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-semibold">
              Order Type
            </label>
            <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
              {orderType && orderType.length > 0 ? orderType.join(", ").toUpperCase() : "-"}
            </div>
          </div>

          {/* Start Date (only show if rental is selected) */}
          {orderType && orderType.includes('rental') && (
            <>
              <div className="flex flex-col">
                <label className="text-sm font-semibold">
                  Start Date
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                  {startDate || "-"}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold">
                  End Date
                </label>
                <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                  {endDate || "-"}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}