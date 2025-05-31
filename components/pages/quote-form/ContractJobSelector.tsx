import { useRef, useState } from "react";
import { Pencil, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
  quoteType?: string;
  branch?: string;
  jobNumber?: string;
  county?: string;
  ecmsPoNumber?: string;
  stateRoute?: string;
  paymentTerms?: string;
  quoteDate?: string;
  customers?: string[];
  digitalSignature?: boolean;
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
  quoteType,
  branch,
  jobNumber,
  county,
  ecmsPoNumber,
  stateRoute,
  paymentTerms,
  quoteDate,
  customers,
  digitalSignature,
}: ContractJobSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);

  const handleBlur = (e) => {
    setTimeout(() => setDropdownOpen(false), 150);
  };

  const filteredEstimates = allEstimates.filter(
    (e) => !searchValue || e.contract_number.includes(searchValue)
  );

  const filteredJobs = allJobs.filter(
    (j) => !searchValue || j.job_number.includes(searchValue)
  );

  return (
    <div className="w-full ">
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
              <DropdownMenuItem onClick={onEdit}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelect(null)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Contract / Job ocupa 2 colunas */}
          <div className="md:col-span-2 col-span-1">
            <div className="mb-2 font-medium">Contract / Job</div>
            <div className="relative">
              <input
                ref={inputRef}
                className="w-full rounded-md pr-3 py-2 mb-1"
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
                <div className="absolute left-0 right-0 z-10 bg-popover border border-border rounded shadow max-h-64 overflow-auto mt-1">
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
          {/* Espaço vazio para alinhar com 3 colunas */}
          <div className="hidden md:block" />
        </div>
      </div>

      {selectedContractJob && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              Quote Type
            </label>
            <div className="pr-3 py-1 text-[14px] select-text cursor-default text-muted-foreground">
              {quoteType || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              Branch
            </label>
            <div className="pr-3 py-1 text-[14px] text-foreground select-text cursor-default ">
              {branch && branch !== "All" ? branch : "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              Job Number
            </label>
            <div className="pr-3 py-1 text-[14px] text-foreground select-text cursor-default">
              {jobNumber || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              County
            </label>
            <div className="pr-3 py-1 text-[14px] text-foreground select-text cursor-default">
              {county || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              ECMS/PO#
            </label>
            <div className="pr-3 py-1 text-[14px] text-foreground select-text cursor-default">
              {ecmsPoNumber || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              State Route
            </label>
            <div className="pr-3 py-1 text-[14px] text-foreground select-text cursor-default">
              {stateRoute || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              Payment Terms
            </label>
            <div className="pr-3 py-1 text-[14px] text-foreground select-text cursor-default">
              {paymentTerms || "-"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              Quote Date
            </label>
            <div className="pr-3 py-1 text-[14px] text-foreground select-text cursor-default">
              {quoteDate || "-"}
            </div>
          </div>
          {/* Customers ocupa 2 colunas, Digital Signature na terceira */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-semibold mb-1 text-muted-foreground">
              Customers
            </label>
            <div className="pr-3 py-1 text-[14px] text-foreground select-text cursor-default">
              {customers && customers.length > 0 ? customers.join(", ") : "-"}
            </div>
          </div>

          <div className="flex flex-col md:col-span-1">
            <label className="text-sm font-semibold text-muted-foreground mb-1">
              Digital Signature
            </label>
            <div className="flex items-center h-full">
              <input
                type="checkbox"
                disabled
                checked={!!digitalSignature}
                className="mr-2"
              />
              <span className="text-[14px] text-foreground select-text cursor-default">
                Digital signature
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
