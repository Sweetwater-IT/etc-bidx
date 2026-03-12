import { useState, useMemo, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { addDays, format } from "date-fns";
import { User, Mail, Phone, Building, Calendar as CalendarIcon, FileText, Check, ChevronsUpDown, Plus, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

import type { JobProjectInfo } from "@/types/job";
import { toast } from "sonner";
import { CertifiedPayrollType } from "@/data/masterItems";
// import { generateJobNumber } from "@/utils/generateJobNumber"; // Removed - will implement with business logic later

interface ProjectInfoFieldsProps {
  projectInfo: JobProjectInfo;
  onChange: (info: JobProjectInfo) => void;
  contractSigned?: boolean;
  showValidation?: boolean;
  readOnly?: boolean;
  contractRow?: any;
}

const REQUIRED_FIELDS: (keyof JobProjectInfo)[] = [
  "projectOwner", "projectName", "contractNumber", "county", "etcBranch",
  "etcProjectManager", "projectStartDate", "projectEndDate", "customerName",
  "customerJobNumber", "customerPM", "customerPMEmail", "certifiedPayrollContact",
  "certifiedPayrollEmail", "isCertifiedPayroll",
];

// Stable RateField — defined OUTSIDE parent components to prevent remounting on every keystroke
const RateField = ({
  id,
  label,
  field,
  value,
  onUpdate,
}: {
  id: string;
  label: string;
  field: keyof JobProjectInfo;
  value: string | null;
  onUpdate: (field: keyof JobProjectInfo, value: string) => void;
}) => {
  const [localValue, setLocalValue] = useState(value || "");
  const [focused, setFocused] = useState(false);

  // Sync from parent only when NOT focused (prevents cursor jump)
  useEffect(() => {
    if (!focused) {
      setLocalValue(value || "");
    }
  }, [value, focused]);

  const displayValue = !focused && localValue && !isNaN(parseFloat(localValue))
    ? parseFloat(localValue).toFixed(2)
    : localValue;

  return (
    <div>
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input
        id={id}
        className="h-8 text-sm"
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={displayValue}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const cleaned = localValue.replace(/[^0-9.]/g, "");
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) {
            const formatted = parsed.toFixed(2);
            setLocalValue(formatted);
            onUpdate(field, formatted);
          } else if (localValue === "") {
            onUpdate(field, "");
          }
        }}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "" || /^\d*\.?\d*$/.test(val)) {
            setLocalValue(val);
            onUpdate(field, val);
          }
        }}
      />
    </div>
  );
};

// --- Certified Payroll Section ---
const CertifiedPayrollSection = ({
  projectInfo,
  update,
  isInvalid,
  RequiredMark,
}: {
  projectInfo: JobProjectInfo;
  update: (field: keyof JobProjectInfo, value: string) => void;
  isInvalid: (field: keyof JobProjectInfo) => boolean;
  RequiredMark: React.FC;
}) => {

  const TotalCell = ({ base, fringe }: { base: string | null; fringe: string | null }) => {
    const total = (parseFloat(base || "0") || 0) + (parseFloat(fringe || "0") || 0);
    return (
      <div className="flex items-end">
        <div>
          <Label className="text-xs text-muted-foreground">Total</Label>
          <p className="h-8 flex items-center text-sm font-medium">${total.toFixed(2)}/hr</p>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        Certified Payroll Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3">
          <Label className="text-xs">Is this a Certified Payroll job?<RequiredMark /></Label>
          <Select value={projectInfo.isCertifiedPayroll}
            onValueChange={(val) => update("isCertifiedPayroll", val as CertifiedPayrollType)}>
            <SelectTrigger className={cn("h-8 text-sm w-full sm:w-[240px]", isInvalid("isCertifiedPayroll") && "border-destructive ring-1 ring-destructive/30")}>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No</SelectItem>
              <SelectItem value="state">Yes — State (PA Prevailing Wage)</SelectItem>
              <SelectItem value="federal">Yes — Federal (Davis-Bacon)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {projectInfo.isCertifiedPayroll === "none" && (
          <div>
            <Label htmlFor="shopRate" className="text-xs">Shop Rate ($/hr)</Label>
            <Input id="shopRate" className="h-8 text-sm bg-muted" type="text" readOnly value="Shop — no value required" tabIndex={-1} />
          </div>
        )}

        {projectInfo.isCertifiedPayroll === "state" && (
          <>
            <div className="sm:col-span-3">
              <p className="text-xs font-medium text-muted-foreground">PA Prevailing Wage Rates</p>
            </div>
            <div className="sm:col-span-3 mt-1">
              <p className="text-[11px] font-semibold text-foreground mb-1">MPT (Maintenance & Protection of Traffic)</p>
            </div>
            <RateField id="stateMptBase" label="Base Rate ($/hr)" field="stateMptBaseRate" value={projectInfo.stateMptBaseRate} onUpdate={update} />
            <RateField id="stateMptFringe" label="Fringe Rate ($/hr)" field="stateMptFringeRate" value={projectInfo.stateMptFringeRate} onUpdate={update} />
            <TotalCell base={projectInfo.stateMptBaseRate} fringe={projectInfo.stateMptFringeRate} />
            <div className="sm:col-span-3 mt-2">
              <p className="text-[11px] font-semibold text-foreground mb-1">Flagging</p>
            </div>
            <RateField id="stateFlagBase" label="Base Rate ($/hr)" field="stateFlaggingBaseRate" value={projectInfo.stateFlaggingBaseRate} onUpdate={update} />
            <RateField id="stateFlagFringe" label="Fringe Rate ($/hr)" field="stateFlaggingFringeRate" value={projectInfo.stateFlaggingFringeRate} onUpdate={update} />
            <TotalCell base={projectInfo.stateFlaggingBaseRate} fringe={projectInfo.stateFlaggingFringeRate} />
          </>
        )}

        {projectInfo.isCertifiedPayroll === "federal" && (
          <>
            <div className="sm:col-span-3">
              <p className="text-xs font-medium text-muted-foreground">Federal Davis-Bacon Rates</p>
            </div>
            <div className="sm:col-span-3 mt-1">
              <p className="text-[11px] font-semibold text-foreground mb-1">MPT (Maintenance & Protection of Traffic)</p>
            </div>
            <RateField id="fedMptBase" label="Base Rate ($/hr)" field="federalMptBaseRate" value={projectInfo.federalMptBaseRate} onUpdate={update} />
            <RateField id="fedMptFringe" label="Fringe Rate ($/hr)" field="federalMptFringeRate" value={projectInfo.federalMptFringeRate} onUpdate={update} />
            <TotalCell base={projectInfo.federalMptBaseRate} fringe={projectInfo.federalMptFringeRate} />
            <div className="sm:col-span-3 mt-2">
              <p className="text-[11px] font-semibold text-foreground mb-1">Flagging</p>
            </div>
            <RateField id="fedFlagBase" label="Base Rate ($/hr)" field="federalFlaggingBaseRate" value={projectInfo.federalFlaggingBaseRate} onUpdate={update} />
            <RateField id="fedFlagFringe" label="Fringe Rate ($/hr)" field="federalFlaggingFringeRate" value={projectInfo.federalFlaggingFringeRate} onUpdate={update} />
            <TotalCell base={projectInfo.federalFlaggingBaseRate} fringe={projectInfo.federalFlaggingFringeRate} />
          </>
        )}
      </div>
    </div>
  );
};

export const ProjectInfoFields = ({ projectInfo, onChange, contractSigned = false, showValidation = false, readOnly = false, contractRow }: ProjectInfoFieldsProps) => {
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [projectStartOpen, setProjectStartOpen] = useState(false);
  const [projectEndOpen, setProjectEndOpen] = useState(false);

  // Database-driven data
  const [branches, setBranches] = useState<Array<{id: number, name: string, address: string, shop_rate: number}>>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [projectManagers, setProjectManagers] = useState<Array<{ id: string; branch_id: number | null; full_name: string }>>([]);

  useEffect(() => {
    const fetchBranchesAndCounties = async () => {
      try {
        // Fetch branches
        const branchesResponse = await fetch("/api/branches");
        const branchesResult = await branchesResponse.json();
        if (branchesResult.data) {
          setBranches(branchesResult.data);
        }

        // Fetch counties (names only)
        const countiesResponse = await fetch("/api/counties?namesOnly=true");
        const countiesResult = await countiesResponse.json();
        if (countiesResult.success && countiesResult.data) {
          setCounties(countiesResult.data);
        }

        const pmResponse = await fetch('/api/l/project-managers');
        const pmResult = await pmResponse.json();
        if (pmResult.success && pmResult.data) {
          setProjectManagers(pmResult.data);
        }
      } catch (error) {
        console.error("Error fetching branches/counties:", error);
      }
    };

    fetchBranchesAndCounties();
  }, []);

  useEffect(() => {
    if (dateWarning) {
      const t = setTimeout(() => setDateWarning(null), 4000);
      return () => clearTimeout(t);
    }
  }, [dateWarning]);

  const update = (field: keyof JobProjectInfo, value: string) => {
    if (readOnly) return;
    const updated = { ...projectInfo, [field]: value };
    if (field === "projectStartDate" && updated.projectEndDate && value > updated.projectEndDate) {
      updated.projectEndDate = "";
      setDateWarning("End date was cleared — it was before the new start date");
    }
    if (field === "projectEndDate" && updated.projectStartDate && value < updated.projectStartDate) {
      setDateWarning("End date cannot be before start date");
      return;
    }
    onChange(updated);
  };

  const isInvalid = (field: keyof JobProjectInfo) =>
    showValidation && REQUIRED_FIELDS.includes(field) && !projectInfo[field];

  // Customer combobox state — loaded from Supabase
  interface DBCustomer { id: string; display_name: string; company_name: string; }
  const [customers, setCustomers] = useState<DBCustomer[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/contractors?limit=1000");
      const result = await response.json();
      if (result.success && result.data) {
        // Transform contractors data to match the expected format
        const transformedCustomers = result.data.map((contractor: any) => ({
          id: contractor.id.toString(),
          display_name: contractor.name,
          company_name: contractor.name
        }));
        setCustomers(transformedCustomers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) =>
        c.display_name.toLowerCase().includes(customerSearch.toLowerCase())
      ),
    [customers, customerSearch]
  );

  const handleAddCustomer = async () => {
    if (!customerSearch.trim()) return;
    const name = customerSearch.trim();

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          display_name: name,
          customer_number: Math.floor(Math.random() * 1000000), // Generate a random customer number
          main_phone: "",
          address: "",
          city: "",
          state: "",
          zip: "",
          payment_terms: "NET30", // Default payment terms
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to create customer");
        return;
      }

      // Add the new customer to the local state
      const newCustomer = {
        id: result.customer.id.toString(),
        display_name: result.customer.name,
        company_name: result.customer.name
      };

      setCustomers((prev) => [...prev, newCustomer]);
      update("customerName", newCustomer.display_name);
      setCustomerSearch("");
      setCustomerOpen(false);
      toast.success(`Customer "${name}" added`);
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
    }
  };

  // ETC PM combobox state
  const [pmOpen, setPmOpen] = useState(false);
  const [pmSearch, setPmSearch] = useState("");

  const selectedBranchId = useMemo(() => {
    const branch = projectInfo.etcBranch?.trim();
    if (!branch) return null;
    return branches.find((b) => b.name.toLowerCase() === branch.toLowerCase())?.id ?? null;
  }, [projectInfo.etcBranch, branches]);

  const availablePMs = useMemo(() => {
    if (!selectedBranchId) return projectManagers;
    return projectManagers.filter((pm) => pm.branch_id === selectedBranchId);
  }, [projectManagers, selectedBranchId]);

  const filteredPMs = useMemo(
    () =>
      availablePMs.filter((u) =>
        (u.full_name || "").toLowerCase().includes(pmSearch.toLowerCase())
      ),
    [availablePMs, pmSearch]
  );

  // County combobox state
  const [countyOpen, setCountyOpen] = useState(false);
  const [countySearch, setCountySearch] = useState("");
  const filteredCounties = useMemo(
    () => counties.filter((c) => c.toLowerCase().includes(countySearch.toLowerCase())),
    [counties, countySearch]
  );

  // TODO: Implement job number auto-generation with business logic later
  // const { jobs } = useJobs();
  // const existingJobNumbers = useMemo(() => jobs.map((j) => j.projectInfo.etcJobNumber), [jobs]);

  const RequiredMark = () => <span className="text-destructive ml-0.5">*</span>;

  const parseDateValue = (value?: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(`${value}T00:00:00`);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const endCalendarDefaultMonth = useMemo(() => {
    const startDate = parseDateValue(projectInfo.projectStartDate);
    if (startDate) return addDays(startDate, 30);
    return parseDateValue(projectInfo.projectEndDate) ?? new Date();
  }, [projectInfo.projectStartDate, projectInfo.projectEndDate]);

  return (
    <div className={cn("space-y-5", readOnly && "pointer-events-none opacity-70")}>
      {/* Project Details */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          Project Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          {/* Row 1: Owner, Job Name, Contract # */}
          <div className="sm:col-span-2">
            <Label htmlFor="projectOwner" className="text-xs">Project Owner<RequiredMark /></Label>
            <Select
              value={projectInfo.projectOwner || undefined}
              onValueChange={(val) => update("projectOwner", val)}
            >
              <SelectTrigger id="projectOwner" className={cn("h-8 text-sm", isInvalid("projectOwner") && "border-destructive ring-1 ring-destructive/30")}>
                <SelectValue placeholder="Select owner…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENNDOT">PENNDOT</SelectItem>
                <SelectItem value="Turnpike">Turnpike</SelectItem>
                <SelectItem value="SEPTA">SEPTA</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="projectName" className="text-xs">Job Name<RequiredMark /></Label>
            <Input
              id="projectName"
              className={cn("h-8 text-sm", isInvalid("projectName") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="e.g. Highway 101 Overpass"
              value={projectInfo.projectName || ""}
              onChange={(e) => update("projectName", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="contractNumber" className="text-xs">Project Owner Contract #<RequiredMark /></Label>
            <Input
              id="contractNumber"
              className={cn("h-8 text-sm", isInvalid("contractNumber") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="e.g. C-2024-0123"
              value={projectInfo.contractNumber || ""}
              onChange={(e) => update("contractNumber", e.target.value)}
            />
            {contractRow?.internal_id && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Internal ID: {contractRow.internal_id}
              </p>
            )}
          </div>

          {/* Row 2: County, State Route, Branch, Job Number */}
          <div className="sm:col-span-1">
            <Label className="text-xs">County<RequiredMark /></Label>
            <Popover open={countyOpen} onOpenChange={setCountyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countyOpen}
                  className={cn("w-full justify-between h-8 text-sm font-normal", isInvalid("county") && "border-destructive ring-1 ring-destructive/30")}
                >
                  {projectInfo.county || "Select…"}
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0 z-50 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Search county…" value={countySearch} onValueChange={setCountySearch} />
                  <CommandList>
                    <CommandEmpty>No county found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCounties.map((c) => (
                        <CommandItem
                          key={c}
                          value={c}
                          onSelect={() => {
                            update("county", c);
                            setCountyOpen(false);
                            setCountySearch("");
                          }}
                        >
                          <Check className={cn("mr-2 h-3 w-3", projectInfo.county === c ? "opacity-100" : "opacity-0")} />
                          {c}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="etcBranch" className="text-xs">ETC Branch<RequiredMark /></Label>
            <Select
              value={projectInfo.etcBranch || ""}
              onValueChange={(val) => update("etcBranch", val)}
            >
              <SelectTrigger id="etcBranch" className={cn("h-8 text-sm", isInvalid("etcBranch") && "border-destructive ring-1 ring-destructive/30")}>
                <SelectValue placeholder="Select branch…" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="etcJobNumber" className="text-xs">ETC Job Number</Label>
            <Input
              id="etcJobNumber"
              className="h-8 text-sm bg-muted/50"
              placeholder={contractSigned ? "Auto-generated" : "Assigned when contract is signed"}
              value={projectInfo.etcJobNumber || ""}
              readOnly
            />
            {!contractSigned && !projectInfo.etcJobNumber && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Job number will be assigned once the contract is signed
              </p>
            )}
          </div>

          {/* Row 3: ETC PM, Project Start Date, Project End Date */}
          {/* ETC Project Manager — searchable dropdown */}
          <div>
            <Label className="text-xs">ETC Project Manager<RequiredMark /></Label>
            <Popover open={pmOpen} onOpenChange={setPmOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={pmOpen}
                  className={cn("w-full justify-between h-8 text-sm font-normal", isInvalid("etcProjectManager") && "border-destructive ring-1 ring-destructive/30")}
                >
                  {projectInfo.etcProjectManager || "Select PM…"}
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0 z-50 bg-popover" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search PM…"
                    value={pmSearch}
                    onValueChange={setPmSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No project managers found.</CommandEmpty>
                    <CommandGroup>
                      {filteredPMs.map((u) => (
                        <CommandItem
                          key={u.id}
                          value={u.full_name}
                          onSelect={() => {
                            update("etcProjectManager", u.full_name);
                            setPmOpen(false);
                            setPmSearch("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              projectInfo.etcProjectManager === u.full_name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="text-sm">{u.full_name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {projectInfo.etcBranch && availablePMs.length === 0 && (
              <p className="text-[10px] text-destructive mt-0.5">
                No PMs assigned to {projectInfo.etcBranch}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="projectStartDate" className="flex items-center gap-1 text-xs">
              <CalendarIcon className="h-3 w-3" /> Project Start Date<RequiredMark />
            </Label>
            <Popover open={projectStartOpen} onOpenChange={setProjectStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 w-full justify-start text-left text-sm font-normal",
                    !projectInfo.projectStartDate && "text-muted-foreground",
                    isInvalid("projectStartDate") && "border-destructive ring-1 ring-destructive/30"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {projectInfo.projectStartDate
                    ? format(parseDateValue(projectInfo.projectStartDate)!, "PPP")
                    : "Pick a start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDateValue(projectInfo.projectStartDate)}
                  onSelect={(date) => {
                    if (!date) {
                      update("projectStartDate", "");
                      setProjectStartOpen(false);
                      return;
                    }
                    update("projectStartDate", format(date, "yyyy-MM-dd"));
                    setProjectStartOpen(false);
                  }}
                  disabled={(date) =>
                    !!projectInfo.projectEndDate &&
                    date > parseDateValue(projectInfo.projectEndDate)!
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="projectEndDate" className="flex items-center gap-1 text-xs">
              <CalendarIcon className="h-3 w-3" /> Project End Date<RequiredMark />
            </Label>
            <Popover open={projectEndOpen} onOpenChange={setProjectEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 w-full justify-start text-left text-sm font-normal",
                    !projectInfo.projectEndDate && "text-muted-foreground",
                    isInvalid("projectEndDate") && "border-destructive ring-1 ring-destructive/30"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {projectInfo.projectEndDate
                    ? format(parseDateValue(projectInfo.projectEndDate)!, "PPP")
                    : "Pick an end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDateValue(projectInfo.projectEndDate)}
                  defaultMonth={endCalendarDefaultMonth}
                  onSelect={(date) => {
                    if (!date) {
                      update("projectEndDate", "");
                      setProjectEndOpen(false);
                      return;
                    }
                    update("projectEndDate", format(date, "yyyy-MM-dd"));
                    setProjectEndOpen(false);
                  }}
                  disabled={(date) =>
                    !!projectInfo.projectStartDate &&
                    date < parseDateValue(projectInfo.projectStartDate)!
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {dateWarning && (
            <div className="sm:col-span-2 flex items-center gap-1.5 text-destructive">
              <CalendarIcon className="h-3 w-3 shrink-0" />
              <p className="text-[11px] font-medium">{dateWarning}</p>
            </div>
          )}
        </div>
      </div>


      <div className="rounded-xl border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          Customer Admin Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Customer Name — searchable dropdown */}
          <div>
            <Label className="text-xs">Customer Name<RequiredMark /></Label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerOpen}
                  className={cn("w-full justify-between h-8 text-sm font-normal", isInvalid("customerName") && "border-destructive ring-1 ring-destructive/30")}
                >
                  {projectInfo.customerName || "Select customer…"}
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-0 z-50 bg-popover" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search or add customer…"
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty className="p-0">
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                        onMouseDown={(e) => { e.preventDefault(); handleAddCustomer(); }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add {customerSearch}
                      </button>
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredCustomers.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.display_name}
                          onSelect={() => {
                            update("customerName", c.display_name);
                            setCustomerOpen(false);
                            setCustomerSearch("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              projectInfo.customerName === c.display_name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.display_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {customerSearch && filteredCustomers.length > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={handleAddCustomer}
                            className="text-sm"
                          >
                            <Plus className="mr-2 h-3 w-3" /> Add {customerSearch}
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="customerJobNumber" className="text-xs">Customer Job Number<RequiredMark /></Label>
            <Input
              id="customerJobNumber"
              className={cn("h-8 text-sm", isInvalid("customerJobNumber") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="Customer's reference #"
              value={projectInfo.customerJobNumber || ""}
              onChange={(e) => update("customerJobNumber", e.target.value)}
            />
          </div>
          <div className="hidden sm:block" /> {/* spacer to push PM to row 2 */}

          {/* Row 2: Customer PM */}
          <div>
            <Label htmlFor="customerPM" className="text-xs">Customer Project Manager<RequiredMark /></Label>
            <Input
              id="customerPM"
              className={cn("h-8 text-sm", isInvalid("customerPM") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="Full name"
              value={projectInfo.customerPM || ""}
              onChange={(e) => update("customerPM", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="customerPMEmail" className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3" /> PM Email<RequiredMark />
            </Label>
            <Input
              id="customerPMEmail"
              type="email"
              className={cn("h-8 text-sm", isInvalid("customerPMEmail") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="pm@customer.com"
              value={projectInfo.customerPMEmail || ""}
              onChange={(e) => update("customerPMEmail", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="customerPMPhone" className="flex items-center gap-1 text-xs">
              <Phone className="h-3 w-3" /> PM Phone
            </Label>
            <Input
              id="customerPMPhone"
              type="tel"
              className="h-8 text-sm"
              placeholder="(555) 555-5555"
              value={projectInfo.customerPMPhone || ""}
              onChange={(e) => update("customerPMPhone", e.target.value)}
            />
          </div>

          {/* Certified Payroll */}
          <div>
            <Label htmlFor="certPayroll" className="text-xs">Certified Payroll Contact<RequiredMark /></Label>
            <Input
              id="certPayroll"
              className={cn("h-8 text-sm", isInvalid("certifiedPayrollContact") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="Full name"
              value={projectInfo.certifiedPayrollContact || ""}
              onChange={(e) => update("certifiedPayrollContact", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="certPayrollEmail" className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3" /> Payroll Email<RequiredMark />
            </Label>
            <Input
              id="certPayrollEmail"
              type="email"
              className={cn("h-8 text-sm", isInvalid("certifiedPayrollEmail") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="payroll@customer.com"
              value={projectInfo.certifiedPayrollEmail || ""}
              onChange={(e) => update("certifiedPayrollEmail", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="certPayrollPhone" className="flex items-center gap-1 text-xs">
              <Phone className="h-3 w-3" /> Payroll Phone
            </Label>
            <Input
              id="certPayrollPhone"
              type="tel"
              className="h-8 text-sm"
              placeholder="(555) 555-5555"
              value={projectInfo.certifiedPayrollPhone || ""}
              onChange={(e) => update("certifiedPayrollPhone", e.target.value)}
            />
          </div>

          {/* Customer Billing */}
          <div>
            <Label htmlFor="custBillingContact" className="text-xs">Billing Contact Name</Label>
            <Input
              id="custBillingContact"
              className="h-8 text-sm"
              placeholder="Full name"
              value={projectInfo.customerBillingContact || ""}
              onChange={(e) => update("customerBillingContact", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="custBillingEmail" className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3" /> Billing Email
            </Label>
            <Input
              id="custBillingEmail"
              type="email"
              className="h-8 text-sm"
              placeholder="billing@customer.com"
              value={projectInfo.customerBillingEmail || ""}
              onChange={(e) => update("customerBillingEmail", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="custBillingPhone" className="flex items-center gap-1 text-xs">
              <Phone className="h-3 w-3" /> Billing Phone
            </Label>
            <Input
              id="custBillingPhone"
              type="tel"
              className="h-8 text-sm"
              placeholder="(555) 555-5555"
              value={projectInfo.customerBillingPhone || ""}
              onChange={(e) => update("customerBillingPhone", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Certified Payroll Information */}
      <CertifiedPayrollSection projectInfo={projectInfo} update={update} isInvalid={isInvalid} RequiredMark={RequiredMark} />

      {/* Other Notes */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Additional Notes
        </h2>
        <Textarea
          placeholder="Enter any additional notes, comments, or special instructions…"
          className="min-h-[100px] text-sm"
          value={projectInfo.otherNotes || ""}
          onChange={(e) => update("otherNotes", e.target.value)}
        />
      </div>
    </div>
  );
};