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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { parseMaybeLocalDate } from "@/lib/local-date";
import { User, Mail, Phone, Building, Calendar as CalendarIcon, FileText, Check, ChevronsUpDown, Plus, DollarSign, StickyNote, Save, X } from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { DollarPercentCurrencyInputField } from "@/components/ui/dollar-percent-currency-input-field";
import { CaptionProps, useNavigation } from "react-day-picker";

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
  onProjectNameBlur?: () => void | Promise<void>;
  onSaveNotes?: (notes: string) => Promise<void>;
  notesSaving?: boolean;
  hideNotesSection?: boolean;
}

const REQUIRED_FIELDS: (keyof JobProjectInfo)[] = [
  "projectOwner", "projectName", "contractNumber", "county", "etcBranch",
  "etcProjectManager", "projectStartDate", "projectEndDate", "customerName",
  "customerJobNumber",
  "customerPMFirstName",
  "customerPMLastName",
  "customerPMPhone",
  "customerPMEmail",
  "customerBillingContactFirstName",
  "customerBillingContactLastName",
  "customerBillingPhone",
  "customerBillingEmail",
  "isCertifiedPayroll",
];

const PROJECT_OWNER_OPTIONS = ["PENNDOT", "Turnpike", "SEPTA", "Private"] as const;
const PHONE_FIELDS: Array<keyof JobProjectInfo> = [
  "customerPMPhone",
  "certifiedPayrollPhone",
  "customerBillingPhone",
];

function getNormalizedCertifiedPayrollType(value?: string | null): CertifiedPayrollType {
  return value === "state" || value === "federal" ? value : "none";
}

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
  const [localValue, setLocalValue] = useState(parseFloat(value || "0") || 0);

  useEffect(() => {
    setLocalValue(parseFloat(value || "0") || 0);
  }, [value]);

  return (
    <div>
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <DollarPercentCurrencyInputField
        type="dollar"
        fixedType="dollar"
        value={localValue}
        onTypeChange={() => {}}
        onValueChange={(nextValue) => {
          setLocalValue(nextValue);
          onUpdate(field, nextValue ? nextValue.toFixed(2) : "");
        }}
        aria-label={label}
        className="h-8"
      />
    </div>
  );
};

const ContractCalendarCaption = ({
  displayMonth,
  fromYear,
  toYear,
}: CaptionProps & {
  fromYear: number;
  toYear: number;
}) => {
  const { previousMonth, nextMonth, goToMonth } = useNavigation();
  const years = useMemo(() => {
    const values: number[] = [];
    for (let year = fromYear; year <= toYear; year += 1) {
      values.push(year);
    }
    return values;
  }, [fromYear, toYear]);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-2 pt-1">
      <div className="flex items-center justify-center gap-1 min-w-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-5 w-5 bg-transparent p-0 opacity-70 hover:opacity-100"
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
        >
          <span className="sr-only">Previous month</span>
          <CalendarIcon className="hidden" />
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Button>
        <div className="min-w-[72px] truncate text-center text-sm font-medium">
          {format(displayMonth, "MMMM")}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-5 w-5 bg-transparent p-0 opacity-70 hover:opacity-100"
          onClick={() => nextMonth && goToMonth(nextMonth)}
          disabled={!nextMonth}
        >
          <span className="sr-only">Next month</span>
          <CalendarIcon className="hidden" />
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Button>
      </div>

      <Select
        value={String(displayMonth.getFullYear())}
        onValueChange={(year) => goToMonth(new Date(Number(year), displayMonth.getMonth(), 1))}
      >
        <SelectTrigger className="h-7 !w-auto min-w-0 justify-end gap-1 px-2 pr-1 text-xs font-medium justify-self-end">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
  const certifiedPayrollType = getNormalizedCertifiedPayrollType(projectInfo.isCertifiedPayroll);

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
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        Certified Payroll Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3">
          <Label className="text-xs">Is this a Certified Payroll job?<RequiredMark /></Label>
          <Select value={certifiedPayrollType}
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

        {certifiedPayrollType === "none" && (
          <div>
            <Label htmlFor="shopRate" className="text-xs">Shop Rate ($/hr)</Label>
            <Input id="shopRate" className="h-8 text-sm bg-muted" type="text" readOnly value="Shop — no value required" tabIndex={-1} />
          </div>
        )}

        {certifiedPayrollType === "state" && (
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

        {certifiedPayrollType === "federal" && (
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

export const ProjectInfoFields = ({ projectInfo, onChange, contractSigned = false, showValidation = false, readOnly = false, contractRow, onProjectNameBlur, onSaveNotes, notesSaving = false, hideNotesSection = false }: ProjectInfoFieldsProps) => {
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [projectStartOpen, setProjectStartOpen] = useState(false);
  const [projectEndOpen, setProjectEndOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(projectInfo.otherNotes || "");
  const [projectOwnerModalOpen, setProjectOwnerModalOpen] = useState(false);
  const [projectOwnerDraft, setProjectOwnerDraft] = useState("");

  // Database-driven data
  const [branches, setBranches] = useState<Array<{id: number, name: string, address: string, shop_rate: number}>>([]);
  const [counties, setCounties] = useState<Array<{ name: string; branch: string | null }>>([]);
  const [projectManagers, setProjectManagers] = useState<Array<{ id: string; branch_id: number | null; full_name: string }>>([]);
  const calendarFromYear = useMemo(() => 2000, []);
  const calendarToYear = useMemo(() => new Date().getFullYear() + 10, []);

  useEffect(() => {
    const fetchBranchesAndCounties = async () => {
      try {
        // Fetch branches
        const branchesResponse = await fetch("/api/branches");
        const branchesResult = await branchesResponse.json();
        const branchRows = branchesResult.data || [];
        if (branchesResult.data) {
          setBranches(branchRows);
        }

        // Fetch counties with branch metadata so county selection can set the branch
        const countiesResponse = await fetch("/api/counties?limit=1000");
        const countiesResult = await countiesResponse.json();
        if (countiesResult.success && countiesResult.data) {
          const normalizedCounties = countiesResult.data
            .map((county: { name: string; branch: string | number | null }) => {
              const matchedBranch =
                county.branch == null
                  ? null
                  : branchRows.find(
                      (branch: { id: number; name: string }) =>
                        String(branch.id) === String(county.branch) ||
                        branch.name.toLowerCase() === String(county.branch).toLowerCase()
                    )?.name || String(county.branch);

              return {
                name: county.name,
                branch: matchedBranch,
              };
            })
            .sort((a: { name: string }, b: { name: string }) =>
              a.name.localeCompare(b.name)
            );

          setCounties(normalizedCounties);
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

  useEffect(() => {
    if (!editingNotes) {
      setNotesDraft(projectInfo.otherNotes || "");
    }
  }, [editingNotes, projectInfo.otherNotes]);

  const update = (field: keyof JobProjectInfo, value: string) => {
    if (readOnly) return;
    const nextValue = PHONE_FIELDS.includes(field) ? formatPhoneNumber(value) : value;
    const updated = { ...projectInfo, [field]: nextValue };
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

  const updateSplitName = (
    firstField: keyof JobProjectInfo,
    lastField: keyof JobProjectInfo,
    legacyField: keyof JobProjectInfo,
    part: "first" | "last",
    value: string
  ) => {
    if (readOnly) return;

    const nextFirstName = (part === "first" ? value : projectInfo[firstField]) || "";
    const nextLastName = (part === "last" ? value : projectInfo[lastField]) || "";
    const combinedName = [nextFirstName, nextLastName].filter(Boolean).join(" ").trim();

    onChange({
      ...projectInfo,
      [firstField]: nextFirstName,
      [lastField]: nextLastName,
      [legacyField]: combinedName,
    });
  };

  const certifiedPayrollType = getNormalizedCertifiedPayrollType(projectInfo.isCertifiedPayroll);
  const showPayrollContactRow = certifiedPayrollType === "state" || certifiedPayrollType === "federal";
  const payrollRequiredFields: Array<keyof JobProjectInfo> = [
    "certifiedPayrollContactFirstName",
    "certifiedPayrollContactLastName",
    "certifiedPayrollPhone",
    "certifiedPayrollEmail",
  ];

  const isInvalid = (field: keyof JobProjectInfo) => {
    const isBaseRequired = REQUIRED_FIELDS.includes(field);
    const isPayrollRequired = showPayrollContactRow && payrollRequiredFields.includes(field);
    return showValidation && (isBaseRequired || isPayrollRequired) && !projectInfo[field];
  };

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
        setCustomers(
          transformedCustomers.sort((a: DBCustomer, b: DBCustomer) =>
            a.display_name.localeCompare(b.display_name)
          )
        );
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
      [...customers]
        .filter((c) =>
          c.display_name.toLowerCase().includes(customerSearch.toLowerCase())
        )
        .sort((a, b) => a.display_name.localeCompare(b.display_name)),
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

      setCustomers((prev) =>
        [...prev, newCustomer].sort((a, b) => a.display_name.localeCompare(b.display_name))
      );
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
    () =>
      counties.filter((c) =>
        c.name.toLowerCase().includes(countySearch.toLowerCase())
      ),
    [counties, countySearch]
  );

  // TODO: Implement job number auto-generation with business logic later
  // const { jobs } = useJobs();
  // const existingJobNumbers = useMemo(() => jobs.map((j) => j.projectInfo.etcJobNumber), [jobs]);

  const customerLocked = readOnly || contractSigned;
  const jobNumberLocked = true;
  const projectOwnerSelection = useMemo(() => {
    const owner = (projectInfo.projectOwner || "").trim();
    if (!owner) return "";
    return PROJECT_OWNER_OPTIONS.includes(owner as typeof PROJECT_OWNER_OPTIONS[number]) ? owner : "Other";
  }, [projectInfo.projectOwner]);

  const RequiredMark = () => <span className="text-destructive ml-0.5">*</span>;

  const parseDateValue = (value?: string | null) => {
    if (!value) return undefined;
    const parsed = parseMaybeLocalDate(value);
    return parsed && !isNaN(parsed.getTime()) ? parsed : undefined;
  };

  const endCalendarDefaultMonth = useMemo(() => {
    const startDate = parseDateValue(projectInfo.projectStartDate);
    if (startDate) return addDays(startDate, 30);
    return parseDateValue(projectInfo.projectEndDate) ?? new Date();
  }, [projectInfo.projectStartDate, projectInfo.projectEndDate]);

  useEffect(() => {
    if (projectOwnerModalOpen) return;
    const currentOwner = (projectInfo.projectOwner || "").trim();
    const nextDraft = PROJECT_OWNER_OPTIONS.includes(currentOwner as typeof PROJECT_OWNER_OPTIONS[number])
      ? ""
      : currentOwner;
    setProjectOwnerDraft(nextDraft);
  }, [projectInfo.projectOwner, projectOwnerModalOpen]);

  return (
    <div className={cn("space-y-5", readOnly && "pointer-events-none opacity-70")}>
      {/* Project Details */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          Project Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          {/* Row 1: Owner, Job Name, Contract # */}
          <div className="sm:col-span-2">
            <Label htmlFor="projectOwner" className="text-xs">Project Owner<RequiredMark /></Label>
            <Select
              value={projectOwnerSelection || undefined}
              onValueChange={(val) => {
                if (val === "Other") {
                  const currentOwner = (projectInfo.projectOwner || "").trim();
                  const nextOwner = PROJECT_OWNER_OPTIONS.includes(currentOwner as typeof PROJECT_OWNER_OPTIONS[number])
                    ? ""
                    : currentOwner;
                  setProjectOwnerDraft(nextOwner);
                  setProjectOwnerModalOpen(true);
                  return;
                }
                update("projectOwner", val);
              }}
            >
              <SelectTrigger id="projectOwner" className={cn("h-8 text-sm", isInvalid("projectOwner") && "border-destructive ring-1 ring-destructive/30")}>
                <SelectValue placeholder="Select owner…">
                  {projectOwnerSelection === "Other"
                    ? (projectInfo.projectOwner || "Other")
                    : (projectOwnerSelection || "Select owner…")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROJECT_OWNER_OPTIONS.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
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
              onBlur={() => void onProjectNameBlur?.()}
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
                      {filteredCounties.map((county) => (
                        <CommandItem
                          key={county.name}
                          value={county.name}
                          onSelect={() => {
                            const nextBranch = county.branch || "";
                            const currentPm = projectInfo.etcProjectManager;
                            const nextBranchId = nextBranch
                              ? branches.find((b) => b.name.toLowerCase() === nextBranch.toLowerCase())?.id ?? null
                              : null;
                            const nextAvailablePMs = nextBranchId
                              ? projectManagers.filter((pm) => pm.branch_id === nextBranchId)
                              : projectManagers;

                            onChange({
                              ...projectInfo,
                              county: county.name,
                              etcBranch: nextBranch || projectInfo.etcBranch,
                              etcProjectManager:
                                currentPm && !nextAvailablePMs.some((pm) => pm.full_name === currentPm)
                                  ? ""
                                  : currentPm,
                            });
                            setCountyOpen(false);
                            setCountySearch("");
                          }}
                        >
                          <Check className={cn("mr-2 h-3 w-3", projectInfo.county === county.name ? "opacity-100" : "opacity-0")} />
                          {county.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="stateRoute" className="text-xs">State Route</Label>
            <Input
              id="stateRoute"
              className="h-8 text-sm"
              placeholder="e.g. SR 0196"
              value={projectInfo.stateRoute || ""}
              onChange={(e) => update("stateRoute", e.target.value)}
            />
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
              className="h-8 text-sm"
              placeholder="Assigned in signed contract modal"
              value={projectInfo.etcJobNumber || ""}
              readOnly={jobNumberLocked}
              disabled={jobNumberLocked}
            />
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
                  fromYear={calendarFromYear}
                  toYear={calendarToYear}
                  classNames={{ caption: "pt-1", month: "flex flex-col gap-3" }}
                  components={{
                    Caption: (props) => (
                      <ContractCalendarCaption
                        {...props}
                        fromYear={calendarFromYear}
                        toYear={calendarToYear}
                      />
                    ),
                  }}
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
                  fromYear={calendarFromYear}
                  toYear={calendarToYear}
                  classNames={{ caption: "pt-1", month: "flex flex-col gap-3" }}
                  components={{
                    Caption: (props) => (
                      <ContractCalendarCaption
                        {...props}
                        fromYear={calendarFromYear}
                        toYear={calendarToYear}
                      />
                    ),
                  }}
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


    <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          Customer Admin Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Customer Name — searchable dropdown */}
          <div className="sm:col-span-2">
            <Label className="text-xs">Customer Name<RequiredMark /></Label>
            <Popover open={customerLocked ? false : customerOpen} onOpenChange={(open) => {
              if (!customerLocked) setCustomerOpen(open);
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerLocked ? false : customerOpen}
                  disabled={customerLocked}
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
                    onValueChange={(value) => {
                      if (!customerLocked) setCustomerSearch(value);
                    }}
                  />
                  <CommandList>
                    <CommandEmpty className="p-0">
                      <button
                        disabled={customerLocked}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                            if (customerLocked) return;
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
                            onSelect={() => {
                              if (!customerLocked) handleAddCustomer();
                            }}
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

          <div className="sm:col-span-2">
            <Label htmlFor="customerJobNumber" className="text-xs">Customer Job Number<RequiredMark /></Label>
            <Input
              id="customerJobNumber"
              className={cn("h-8 text-sm", isInvalid("customerJobNumber") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="Customer's reference #"
              value={projectInfo.customerJobNumber || ""}
              onChange={(e) => update("customerJobNumber", e.target.value)}
            />
          </div>

          {/* Row 2: Customer PM */}
          <div>
            <Label htmlFor="customerPMFirstName" className="text-xs">Customer PM First Name<RequiredMark /></Label>
            <Input
              id="customerPMFirstName"
              className={cn("h-8 text-sm", isInvalid("customerPMFirstName") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="First name"
              value={projectInfo.customerPMFirstName || ""}
              onChange={(e) => updateSplitName("customerPMFirstName", "customerPMLastName", "customerPM", "first", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="customerPMLastName" className="text-xs">Customer PM Last Name<RequiredMark /></Label>
            <Input
              id="customerPMLastName"
              className={cn("h-8 text-sm", isInvalid("customerPMLastName") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="Last name"
              value={projectInfo.customerPMLastName || ""}
              onChange={(e) => updateSplitName("customerPMFirstName", "customerPMLastName", "customerPM", "last", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="customerPMPhone" className="flex items-center gap-1 text-xs">
              <Phone className="h-3 w-3" /> PM Phone<RequiredMark />
            </Label>
            <Input
              id="customerPMPhone"
              type="tel"
              className={cn("h-8 text-sm", isInvalid("customerPMPhone") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="(555) 555-5555"
              value={projectInfo.customerPMPhone || ""}
              onChange={(e) => update("customerPMPhone", e.target.value)}
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

          {/* Certified Payroll */}
          {showPayrollContactRow && (
            <>
              <div>
                <Label htmlFor="certPayrollFirstName" className="text-xs">Payroll Contact First Name<RequiredMark /></Label>
                <Input
                  id="certPayrollFirstName"
                  className={cn("h-8 text-sm", isInvalid("certifiedPayrollContactFirstName") && "border-destructive ring-1 ring-destructive/30")}
                  placeholder="First name"
                  value={projectInfo.certifiedPayrollContactFirstName || ""}
                  onChange={(e) =>
                    updateSplitName(
                      "certifiedPayrollContactFirstName",
                      "certifiedPayrollContactLastName",
                      "certifiedPayrollContact",
                      "first",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="certPayrollLastName" className="text-xs">Payroll Contact Last Name<RequiredMark /></Label>
                <Input
                  id="certPayrollLastName"
                  className={cn("h-8 text-sm", isInvalid("certifiedPayrollContactLastName") && "border-destructive ring-1 ring-destructive/30")}
                  placeholder="Last name"
                  value={projectInfo.certifiedPayrollContactLastName || ""}
                  onChange={(e) =>
                    updateSplitName(
                      "certifiedPayrollContactFirstName",
                      "certifiedPayrollContactLastName",
                      "certifiedPayrollContact",
                      "last",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="certPayrollPhone" className="flex items-center gap-1 text-xs">
                  <Phone className="h-3 w-3" /> Payroll Phone<RequiredMark />
                </Label>
                <Input
                  id="certPayrollPhone"
                  type="tel"
                  className={cn("h-8 text-sm", isInvalid("certifiedPayrollPhone") && "border-destructive ring-1 ring-destructive/30")}
                  placeholder="(555) 555-5555"
                  value={projectInfo.certifiedPayrollPhone || ""}
                  onChange={(e) => update("certifiedPayrollPhone", e.target.value)}
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
            </>
          )}

          {/* Customer Billing */}
          <div>
            <Label htmlFor="custBillingFirstName" className="text-xs">Billing Contact First Name<RequiredMark /></Label>
            <Input
              id="custBillingFirstName"
              className={cn("h-8 text-sm", isInvalid("customerBillingContactFirstName") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="First name"
              value={projectInfo.customerBillingContactFirstName || ""}
              onChange={(e) =>
                updateSplitName(
                  "customerBillingContactFirstName",
                  "customerBillingContactLastName",
                  "customerBillingContact",
                  "first",
                  e.target.value
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="custBillingLastName" className="text-xs">Billing Contact Last Name<RequiredMark /></Label>
            <Input
              id="custBillingLastName"
              className={cn("h-8 text-sm", isInvalid("customerBillingContactLastName") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="Last name"
              value={projectInfo.customerBillingContactLastName || ""}
              onChange={(e) =>
                updateSplitName(
                  "customerBillingContactFirstName",
                  "customerBillingContactLastName",
                  "customerBillingContact",
                  "last",
                  e.target.value
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="custBillingPhone" className="flex items-center gap-1 text-xs">
              <Phone className="h-3 w-3" /> Billing Phone<RequiredMark />
            </Label>
            <Input
              id="custBillingPhone"
              type="tel"
              className={cn("h-8 text-sm", isInvalid("customerBillingPhone") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="(555) 555-5555"
              value={projectInfo.customerBillingPhone || ""}
              onChange={(e) => update("customerBillingPhone", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="custBillingEmail" className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3" /> Billing Email<RequiredMark />
            </Label>
            <Input
              id="custBillingEmail"
              type="email"
              className={cn("h-8 text-sm", isInvalid("customerBillingEmail") && "border-destructive ring-1 ring-destructive/30")}
              placeholder="billing@customer.com"
              value={projectInfo.customerBillingEmail || ""}
              onChange={(e) => update("customerBillingEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Certified Payroll Information */}
      <CertifiedPayrollSection projectInfo={{ ...projectInfo, isCertifiedPayroll: certifiedPayrollType }} update={update} isInvalid={isInvalid} RequiredMark={RequiredMark} />

      {/* Additional Notes */}
      {!hideNotesSection && <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-violet-500/10">
              <StickyNote className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Additional Notes
            </span>
          </div>
          {!readOnly && (
            editingNotes ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setNotesDraft(projectInfo.otherNotes || "");
                    setEditingNotes(false);
                  }}
                  disabled={notesSaving}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  className="h-7 w-7"
                  onClick={async () => {
                    onChange({ ...projectInfo, otherNotes: notesDraft });
                    if (onSaveNotes) {
                      await onSaveNotes(notesDraft);
                    }
                    setEditingNotes(false);
                  }}
                  disabled={notesSaving}
                >
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="h-7 gap-1.5 text-xs bg-[#16335A] text-white hover:bg-[#122947]"
                onClick={() => setEditingNotes(true)}
              >
                <StickyNote className="h-3 w-3" />
                {projectInfo.otherNotes?.trim() ? "Edit Note" : "Add Note"}
              </Button>
            )
          )}
        </div>
        {editingNotes && !readOnly ? (
          <Textarea
            placeholder="Enter any additional notes, comments, or special instructions…"
            className="min-h-[120px] text-sm resize-none"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            autoFocus
          />
        ) : (
          <div className="min-h-[72px] text-sm text-foreground whitespace-pre-wrap">
            {projectInfo.otherNotes?.trim() ? (
              projectInfo.otherNotes
            ) : (
              <span className="text-muted-foreground italic text-xs">
                No notes yet. Use &quot;Add Note&quot; to get started.
              </span>
            )}
          </div>
        )}
      </div>}

      <Dialog
        open={projectOwnerModalOpen && !readOnly}
        onOpenChange={(open) => {
          setProjectOwnerModalOpen(open);
          if (!open && !(projectInfo.projectOwner || "").trim()) {
            setProjectOwnerDraft("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Project Owner</DialogTitle>
            <DialogDescription>
              Add the specific project owner name as plain text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="projectOwnerOther" className="text-xs">
              Project Owner<RequiredMark />
            </Label>
            <Input
              id="projectOwnerOther"
              className={cn(
                "h-9 text-sm",
                showValidation && !projectOwnerDraft.trim() && "border-destructive ring-1 ring-destructive/30"
              )}
              placeholder="Enter project owner"
              value={projectOwnerDraft}
              onChange={(e) => setProjectOwnerDraft(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setProjectOwnerModalOpen(false);
                if (!(projectInfo.projectOwner || "").trim()) {
                  setProjectOwnerDraft("");
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const trimmedOwner = projectOwnerDraft.trim();
                if (!trimmedOwner) return;
                update("projectOwner", trimmedOwner);
                setProjectOwnerModalOpen(false);
              }}
              disabled={!projectOwnerDraft.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
