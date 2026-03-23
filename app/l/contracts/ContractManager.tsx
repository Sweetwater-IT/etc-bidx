"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/formatUTCDate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/command";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus, LayoutGrid, List, ArrowUpDown, MoreHorizontal, FileText, Clock,
  RotateCcw, CheckCircle2, ChevronRight, ChevronLeft, ArrowLeft,
  Upload, File, X, AlertTriangle, Trash2, Lock, Eye, ExternalLink, Loader2, Check, ChevronsUpDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import isEqual from "lodash/isEqual";
import type { ContractPipelineStatus } from "@/types/contract";
import type { ContractListItem } from "@/types/contract";

import ContractManagerEmptyState from "./ContractManagerEmptyState";

// ── Upload constants ──
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB.`;
  }
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);
  if (!mimeOk && !extOk) {
    return `"${file.name}" is not an accepted file type. Allowed: PDF, DOC, DOCX, PNG, JPG.`;
  }
  return null;
}



// Simplified pipeline — no approval stages
const PIPELINE_STAGES: {
  id: ContractPipelineStatus;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  { id: "CONTRACT_RECEIPT", label: "Contract Received", shortLabel: "Received", icon: FileText, color: "text-blue-900", bgColor: "bg-blue-950/5", borderColor: "border-blue-900/20" },
  { id: "RETURNED_TO_CUSTOMER", label: "Contract Sent", shortLabel: "Sent", icon: RotateCcw, color: "text-amber-700", bgColor: "bg-amber-500/5", borderColor: "border-amber-500/20" },
  { id: "CONTRACT_SIGNED", label: "Contract Signed — Job Created", shortLabel: "Signed", icon: Lock, color: "text-emerald-700", bgColor: "bg-emerald-500/5", borderColor: "border-emerald-500/20" },
];

type VisiblePipelineStage =
  | "CONTRACT_RECEIPT"
  | "RETURNED_TO_CUSTOMER"
  | "CONTRACT_SIGNED";

type ViewMode = "kanban" | "list";

interface ContractorOption {
  id: string;
  display_name: string;
}

interface CountyOption {
  name: string;
  branch: string | null;
}

interface ProjectManagerOption {
  id: string;
  full_name: string;
}

const ALLOWED_TRANSITIONS: Record<string, ContractPipelineStatus[]> = {
  CONTRACT_RECEIPT: ["RETURNED_TO_CUSTOMER"],
  RETURNED_TO_CUSTOMER: ["CONTRACT_RECEIPT", "CONTRACT_SIGNED"],
  CONTRACT_SIGNED: [],
  // Legacy statuses — allow them to move forward
  SUBMITTED_FOR_APPROVAL: ["CONTRACT_RECEIPT"],
  APPROVED: ["CONTRACT_RECEIPT"],
  REJECTED: ["CONTRACT_RECEIPT"],
};

const canMoveTo = (from: ContractPipelineStatus, to: ContractPipelineStatus) =>
  (ALLOWED_TRANSITIONS[from] || []).includes(to);

const SIGNED_STATUSES: ContractPipelineStatus[] = ["CONTRACT_SIGNED"];



// Map legacy approval statuses into the "Received" bucket
function mapToDisplayStage(status: string): ContractPipelineStatus {
  if (status === "SUBMITTED_FOR_APPROVAL" || status === "APPROVED" || status === "REJECTED") {
    return "CONTRACT_RECEIPT";
  }
  return status as ContractPipelineStatus;
}

const ContractManager = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [signedDialogOpen, setSignedDialogOpen] = useState(false);
  const [pendingSignedJobId, setPendingSignedJobId] = useState<string | null>(null);
  const [signedFiles, setSignedFiles] = useState<File[]>([]);
  const [signedJobNumber, setSignedJobNumber] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pendingSignedFileDeleteIndex, setPendingSignedFileDeleteIndex] = useState<number | null>(null);
  const signedFileInputRef = useRef<HTMLInputElement>(null);

  // Missing requirements modal
  const [missingReqsOpen, setMissingReqsOpen] = useState(false);
  const [missingReqsList, setMissingReqsList] = useState<string[]>([]);
  const [missingReqsTitle, setMissingReqsTitle] = useState("");

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch contracts
  const [jobs, setJobs] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [countyFilter, setCountyFilter] = useState<string>("all");
  const [pmFilter, setPmFilter] = useState<string>("all");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [countyOpen, setCountyOpen] = useState(false);
  const [pmOpen, setPmOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [countySearch, setCountySearch] = useState("");
  const [pmSearch, setPmSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<ContractorOption[]>([]);
  const [countyOptions, setCountyOptions] = useState<CountyOption[]>([]);
  const [pmOptions, setPmOptions] = useState<ProjectManagerOption[]>([]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/l/contracts');
        if (!response.ok) {
          throw new Error('Failed to fetch contracts');
        }
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        toast.error('Failed to load contracts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const pipelineJobs = useMemo(() => jobs.filter((j) => !j.archived), [jobs]);
  useEffect(() => {
    const fetchFilterSources = async () => {
      try {
        const [contractorsResponse, countiesResponse, pmsResponse] = await Promise.all([
          fetch("/api/contractors?limit=1000"),
          fetch("/api/counties?limit=1000"),
          fetch("/api/l/project-managers"),
        ]);

        const contractorsResult = await contractorsResponse.json();
        if (contractorsResult.success && contractorsResult.data) {
          setCustomerOptions(
            contractorsResult.data
              .map((contractor: { id: number | string; name: string }) => ({
                id: String(contractor.id),
                display_name: contractor.name,
              }))
              .sort((a: ContractorOption, b: ContractorOption) =>
                a.display_name.localeCompare(b.display_name)
              )
          );
        }

        const countiesResult = await countiesResponse.json();
        if (countiesResult.success && countiesResult.data) {
          setCountyOptions(
            countiesResult.data
              .map((county: { name: string; branch: string | null }) => ({
                name: county.name,
                branch: county.branch,
              }))
              .sort((a: CountyOption, b: CountyOption) => a.name.localeCompare(b.name))
          );
        }

        const pmResult = await pmsResponse.json();
        if (pmResult.success && pmResult.data) {
          setPmOptions(
            pmResult.data
              .map((pm: { id: string; full_name: string }) => ({
                id: pm.id,
                full_name: pm.full_name,
              }))
              .sort((a: ProjectManagerOption, b: ProjectManagerOption) =>
                a.full_name.localeCompare(b.full_name)
              )
          );
        }
      } catch (error) {
        console.error("Error fetching contract filter sources:", error);
      }
    };

    fetchFilterSources();
  }, []);

  const filteredCustomerOptions = useMemo(
    () =>
      customerOptions.filter((customer) =>
        customer.display_name.toLowerCase().includes(customerSearch.toLowerCase())
      ),
    [customerOptions, customerSearch]
  );

  const filteredCountyOptions = useMemo(
    () =>
      countyOptions.filter((county) =>
        county.name.toLowerCase().includes(countySearch.toLowerCase())
      ),
    [countyOptions, countySearch]
  );

  const filteredPmOptions = useMemo(
    () =>
      pmOptions.filter((pm) =>
        pm.full_name.toLowerCase().includes(pmSearch.toLowerCase())
      ),
    [pmOptions, pmSearch]
  );
  const hasActiveFilters =
    customerFilter !== "all" || countyFilter !== "all" || pmFilter !== "all";

  const displayedPipelineJobs = useMemo(() => {
    return pipelineJobs.filter((job) => {
      if (customerFilter !== "all" && (job.customerName || "") !== customerFilter) return false;
      if (countyFilter !== "all" && (job.county || "") !== countyFilter) return false;
      if (pmFilter !== "all" && (job.etcProjectManager || "") !== pmFilter) return false;
      return true;
    });
  }, [pipelineJobs, customerFilter, countyFilter, pmFilter]);
  const jobsByStage = useMemo(() => {
    const map: Record<string, ContractListItem[]> = {};
    PIPELINE_STAGES.forEach((s) => { map[s.id] = []; });
    displayedPipelineJobs.forEach((j) => {
      const displayStage = mapToDisplayStage(j.contractStatus || "CONTRACT_RECEIPT");
      if (map[displayStage]) {
        map[displayStage].push(j);
      } else {
        map["CONTRACT_RECEIPT"].push(j);
      }
    });
    return map as Record<ContractPipelineStatus, ContractListItem[]>;
  }, [displayedPipelineJobs]);

  const showMissingReqs = (title: string, items: string[]) => {
    setMissingReqsTitle(title);
    setMissingReqsList(items);
    setMissingReqsOpen(true);
  };

  const moveContract = async (jobId: string, newStatus: ContractPipelineStatus) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    // Signed contract requires file upload dialog
    if (newStatus === "CONTRACT_SIGNED") {
      setPendingSignedJobId(jobId);
      setSignedFiles([]);
      setSignedJobNumber(job.etcJobNumber || "");
      setSignedDialogOpen(true);
      return;
    }

    try {
      // Update local state immediately for UI feedback
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === jobId
            ? { ...j, contractStatus: newStatus }
            : j
        )
      );

      // Persist to database - use direct PATCH like other creation pages
      const response = await fetch(`/api/l/contracts/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractStatus: newStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "MISSING_REQUIREMENTS" && Array.isArray(errorData.missing)) {
          showMissingReqs("Cannot advance contract", errorData.missing);
        }
        throw new Error(errorData.error || 'Failed to update contract status');
      }

      toast.success(`Contract moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating contract status:', error);
      toast.error('Failed to update contract status');

      // Revert local state on error
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === jobId
            ? { ...j, contractStatus: job.contractStatus }
            : j
        )
      );
    }
  };

  const openDeleteDialog = (job: ContractListItem) => {
    if (job.contractStatus && SIGNED_STATUSES.includes(job.contractStatus)) {
      toast.error("Cannot delete a signed contract");
      return;
    }
    setContractToDelete({ id: job.id, name: job.projectName || "Untitled" });
    setDeleteDialogOpen(true);
  };

  const deleteJob = async () => {
    if (!contractToDelete) return;
    const jobId = contractToDelete.id;
    setDeleteDialogOpen(false);
    setContractToDelete(null);

    // This will need to be implemented with your API
    toast.success("Contract deleted");
  };
  const archiveContract = async (job: ContractListItem) => {
    try {
      const response = await fetch(`/api/l/contracts/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive contract');
      }

      setJobs((prev) => prev.map((item) => (item.id === job.id ? { ...item, archived: true } : item)));
      toast.success('Contract archived');
    } catch (error) {
      console.error('Error archiving contract:', error);
      toast.error('Failed to archive contract');
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);

  const handleConfirmSigned = async () => {
    if (!pendingSignedJobId || signedFiles.length === 0 || !signedJobNumber.trim()) return;
    const job = jobs.find((j) => j.id === pendingSignedJobId);
    if (!job) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload files first
      const formData = new FormData();
      signedFiles.forEach(file => formData.append('files', file));
      formData.append('contractId', pendingSignedJobId);

      const uploadResponse = await fetch(`/api/l/contracts/${pendingSignedJobId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload files');
      }

      setUploadProgress(100);

      // Update local state immediately for UI feedback
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === pendingSignedJobId
            ? { ...j, contractStatus: "CONTRACT_SIGNED", etcJobNumber: signedJobNumber.trim() }
            : j
        )
      );

      // Persist contract status to database - use direct PATCH like other creation pages
      const response = await fetch(`/api/l/contracts/${pendingSignedJobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractStatus: "CONTRACT_SIGNED",
          etcJobNumber: signedJobNumber.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "MISSING_REQUIREMENTS" && Array.isArray(errorData.missing)) {
          showMissingReqs("Cannot sign contract", errorData.missing);
        }
        throw new Error(errorData.error || 'Failed to update contract status');
      }

      toast.success("Contract signed and saved.");
      setSignedDialogOpen(false);
      setPendingSignedJobId(null);
      setSignedFiles([]);
      setSignedJobNumber("");
    } catch (err: any) {
      console.error('Error updating contract status:', err);
      toast.error("Sign Contract failed");

      // Revert local state on error
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === pendingSignedJobId
            ? { ...j, contractStatus: job.contractStatus }
            : j
        )
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSignedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
      } else {
        validFiles.push(file);
      }
    }
    if (validFiles.length) setSignedFiles((prev) => [...prev, ...validFiles]);
    if (signedFileInputRef.current) signedFileInputRef.current.value = "";
  };

  const removeSignedFile = (index: number) => {
    if (isUploading) return;
    setSignedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getStageIndex = (status: ContractPipelineStatus) =>
    PIPELINE_STAGES.findIndex((s) => s.id === status);

  const getStatusBadge = (status: ContractPipelineStatus) => {
    const displayStatus = mapToDisplayStage(status);
    const stage = PIPELINE_STAGES.find((s) => s.id === displayStatus);
    if (!stage) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${stage.bgColor} ${stage.color} border ${stage.borderColor}`}>
        <stage.icon className="h-3 w-3" />
        {stage.shortLabel}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9FAFB]">
        <header className="border-b bg-card">
          <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="h-8 w-56 rounded bg-muted animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 w-28 rounded-md bg-muted animate-pulse" />
              <div className="h-10 w-36 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
        </header>
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-6 rounded-full bg-muted animate-pulse ml-auto" />
                </div>
                {Array.from({ length: col % 2 === 0 ? 3 : 2 }).map((_, card) => (
                  <div key={card} className="rounded-lg border bg-card p-4 flex flex-col gap-3">
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                    <div className="flex gap-2 mt-1">
                      <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                      <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9FAFB]">
      {/* Header */}
      <header className="shrink-0 border-b bg-card">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/l/jobs")} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">Contract Manager</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pipelineJobs.length} active contract{pipelineJobs.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={customerOpen} className="h-9 w-[220px] justify-between text-xs font-normal">
                    <span className={customerFilter === "all" ? "text-muted-foreground" : "truncate"}>
                      {customerFilter === "all" ? "All Customers" : customerFilter}
                    </span>
                    <span className="ml-2 flex items-center gap-1 shrink-0">
                      {customerFilter !== "all" && (
                        <span
                          role="button"
                          aria-label="Clear customer filter"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCustomerFilter("all");
                            setCustomerSearch("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                      {customerFilter === "all" && (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer…" value={customerSearch} onValueChange={setCustomerSearch} />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all-customers"
                          onSelect={() => {
                            setCustomerFilter("all");
                            setCustomerOpen(false);
                            setCustomerSearch("");
                          }}
                        >
                          <Check className={customerFilter === "all" ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                          All Customers
                        </CommandItem>
                        {filteredCustomerOptions.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.display_name}
                            onSelect={() => {
                              setCustomerFilter(customer.display_name);
                              setCustomerOpen(false);
                              setCustomerSearch("");
                            }}
                          >
                            <Check className={customerFilter === customer.display_name ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                            {customer.display_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Popover open={countyOpen} onOpenChange={setCountyOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={countyOpen} className="h-9 w-[180px] justify-between text-xs font-normal">
                    <span className={countyFilter === "all" ? "text-muted-foreground" : "truncate"}>
                      {countyFilter === "all" ? "All Counties" : countyFilter}
                    </span>
                    <span className="ml-2 flex items-center gap-1 shrink-0">
                      {countyFilter !== "all" && (
                        <span
                          role="button"
                          aria-label="Clear county filter"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCountyFilter("all");
                            setCountySearch("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                      {countyFilter === "all" && (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search county…" value={countySearch} onValueChange={setCountySearch} />
                    <CommandList>
                      <CommandEmpty>No county found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all-counties"
                          onSelect={() => {
                            setCountyFilter("all");
                            setCountyOpen(false);
                            setCountySearch("");
                          }}
                        >
                          <Check className={countyFilter === "all" ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                          All Counties
                        </CommandItem>
                        {filteredCountyOptions.map((county) => (
                          <CommandItem
                            key={county.name}
                            value={county.name}
                            onSelect={() => {
                              setCountyFilter(county.name);
                              setCountyOpen(false);
                              setCountySearch("");
                            }}
                          >
                            <Check className={countyFilter === county.name ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                            {county.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Popover open={pmOpen} onOpenChange={setPmOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={pmOpen} className="h-9 w-[220px] justify-between text-xs font-normal">
                    <span className={pmFilter === "all" ? "text-muted-foreground" : "truncate"}>
                      {pmFilter === "all" ? "All PMs" : pmFilter}
                    </span>
                    <span className="ml-2 flex items-center gap-1 shrink-0">
                      {pmFilter !== "all" && (
                        <span
                          role="button"
                          aria-label="Clear PM filter"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPmFilter("all");
                            setPmSearch("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                      {pmFilter === "all" && (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search PM…" value={pmSearch} onValueChange={setPmSearch} />
                    <CommandList>
                      <CommandEmpty>No PM found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all-pms"
                          onSelect={() => {
                            setPmFilter("all");
                            setPmOpen(false);
                            setPmSearch("");
                          }}
                        >
                          <Check className={pmFilter === "all" ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                          All PMs
                        </CommandItem>
                        {filteredPmOptions.map((pm) => (
                          <CommandItem
                            key={pm.id}
                            value={pm.full_name}
                            onSelect={() => {
                              setPmFilter(pm.full_name);
                              setPmOpen(false);
                              setPmSearch("");
                            }}
                          >
                            <Check className={pmFilter === pm.full_name ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                            {pm.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setCustomerFilter("all");
                    setCountyFilter("all");
                    setPmFilter("all");
                    setCustomerSearch("");
                    setCountySearch("");
                    setPmSearch("");
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex items-center border rounded-md bg-muted/30 p-0.5">
              <button onClick={() => setViewMode("kanban")} className={`p-1.5 rounded transition-colors ${viewMode === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={() => router.push("/l/contracts/new")}
              className="gap-2 bg-[#16335A] text-white shadow-sm hover:bg-[#122947]"
            >
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          </div>
        </div>
      </header>

      {/* Pipeline progress bar */}
      <div className="shrink-0 border-b bg-card/50">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center gap-1">
            {PIPELINE_STAGES.map((stage, i) => {
              const count = jobsByStage[stage.id]?.length || 0;
              return (
                <div key={stage.id} className="flex items-center flex-1">
                  <div className={`flex-1 rounded-md px-3 py-2 border ${stage.borderColor} ${stage.bgColor} transition-all`}>
                    <div className="flex items-center gap-2">
                      <stage.icon className={`h-4 w-4 ${stage.color}`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${stage.color} truncate`}>{stage.label}</p>
                        <p className="text-lg font-bold text-foreground leading-tight">{count}</p>
                      </div>
                    </div>
                  </div>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 mx-0.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main
        className={`mx-auto flex w-full max-w-[1600px] flex-1 min-h-0 flex-col px-6 py-6 ${
          viewMode === "kanban" ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {viewMode === "kanban" ? (
          <KanbanView
            stages={PIPELINE_STAGES}
            jobsByStage={jobsByStage}
            moveContract={moveContract}
            openDeleteDialog={openDeleteDialog}
            archiveContract={archiveContract}
            getStageIndex={getStageIndex}
            formatDate={formatDate}
            router={router}
          />
        ) : (
          <ListView
            filteredJobs={displayedPipelineJobs}
            getStatusBadge={getStatusBadge}
            moveContract={moveContract}
            openDeleteDialog={openDeleteDialog}
            archiveContract={archiveContract}
            formatDate={formatDate}
            router={router}
            stages={PIPELINE_STAGES}
          />
        )}
      </main>

      {/* Signed Contract Upload Dialog */}
      <Dialog open={signedDialogOpen} onOpenChange={(open) => {
        if (isUploading) return;
        if (!open) { setSignedDialogOpen(false); setPendingSignedJobId(null); setSignedFiles([]); setSignedJobNumber(""); }
      }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => { if (isUploading) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (isUploading) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Attach Signed Contract</DialogTitle>
            <DialogDescription>
              Enter the ETC job number, then upload the signed contract document before moving this contract into signed status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="signed-etc-job-number" className="text-xs">ETC Job Number</Label>
              <Input
                id="signed-etc-job-number"
                className="h-9 text-sm"
                placeholder="e.g. 11-22-2025001"
                value={signedJobNumber}
                onChange={(e) => setSignedJobNumber(e.target.value)}
                disabled={isUploading}
              />
            </div>
            <input ref={signedFileInputRef} type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleSignedFileChange} />
            {!isUploading && (
              <button onClick={() => signedFileInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Click to upload signed contract</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, PNG, JPG · Max 25 MB</p>
              </button>
            )}
            {isUploading && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">Uploading… Do not close this dialog.</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
              </div>
            )}
            {signedFiles.length > 0 && (
              <div className="space-y-2">
                {signedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                    <File className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                    {!isUploading && (
                      <button onClick={() => setPendingSignedFileDeleteIndex(i)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={isUploading} onClick={() => { setSignedDialogOpen(false); setPendingSignedJobId(null); setSignedFiles([]); setSignedJobNumber(""); }}>Cancel</Button>
            <Button onClick={handleConfirmSigned} disabled={signedFiles.length === 0 || !signedJobNumber.trim() || isUploading} className="gap-2">
              {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><CheckCircle2 className="h-4 w-4" /> Upload</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingSignedFileDeleteIndex !== null} onOpenChange={(open) => {
        if (!open) setPendingSignedFileDeleteIndex(null);
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Uploaded File?</DialogTitle>
            <DialogDescription>
              This will remove the selected signed-contract file from the upload list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingSignedFileDeleteIndex(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingSignedFileDeleteIndex !== null) removeSignedFile(pendingSignedFileDeleteIndex);
                setPendingSignedFileDeleteIndex(null);
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missing Requirements Modal */}
      <Dialog open={missingReqsOpen} onOpenChange={setMissingReqsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {missingReqsTitle}
            </DialogTitle>
            <DialogDescription>
              The following requirements must be met before this transition:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {missingReqsList.map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setMissingReqsOpen(false)}>Understood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Contract
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{contractToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setContractToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteJob} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Kanban View ─── */
const KanbanView = ({
  stages, jobsByStage, moveContract, openDeleteDialog, archiveContract, getStageIndex, formatDate, router,
}: {
  stages: typeof PIPELINE_STAGES;
  jobsByStage: Record<ContractPipelineStatus, ContractListItem[]>;
  moveContract: (id: string, s: ContractPipelineStatus) => void;
  openDeleteDialog: (job: ContractListItem) => void;
  archiveContract: (job: ContractListItem) => void;
  getStageIndex: (s: ContractPipelineStatus) => number;
  formatDate: (iso: string) => string;
  router: ReturnType<typeof useRouter>;
}) => {
  const [dragOverStage, setDragOverStage] = useState<ContractPipelineStatus | null>(null);
  const [dragSourceStage, setDragSourceStage] = useState<ContractPipelineStatus | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const laneBodyRefs = useRef<Record<VisiblePipelineStage, HTMLDivElement | null>>({
    CONTRACT_RECEIPT: null,
    RETURNED_TO_CUSTOMER: null,
    CONTRACT_SIGNED: null,
  });

  const handleDragOver = (e: React.DragEvent, stageId: ContractPipelineStatus) => {
    if (dragSourceStage && !canMoveTo(dragSourceStage, stageId)) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: ContractPipelineStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    setDragSourceStage(null);
    const jobId = e.dataTransfer.getData("text/plain");
    if (jobId && dragSourceStage && canMoveTo(dragSourceStage, stageId)) {
      moveContract(jobId, stageId);
    }
  };

  const isValidTarget = (stageId: ContractPipelineStatus) =>
    dragSourceStage !== null && canMoveTo(dragSourceStage, stageId);

  const isInvalidTarget = (stageId: ContractPipelineStatus) =>
    dragSourceStage !== null && !canMoveTo(dragSourceStage, stageId) && dragSourceStage !== stageId;

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const logKanbanMetrics = () => {
      const board = boardRef.current;
      if (!board) return;

      console.groupCollapsed("[ContractKanban] layout metrics");
      console.log("board", {
        clientHeight: board.clientHeight,
        scrollHeight: board.scrollHeight,
        overflowY: window.getComputedStyle(board).overflowY,
      });

      stages.forEach((stage) => {
        const laneBody = laneBodyRefs.current[stage.id];
        if (!laneBody) return;

        console.log(stage.id, {
          clientHeight: laneBody.clientHeight,
          scrollHeight: laneBody.scrollHeight,
          canScroll: laneBody.scrollHeight > laneBody.clientHeight,
          overflowY: window.getComputedStyle(laneBody).overflowY,
          cards: (jobsByStage[stage.id] || []).length,
        });
      });
      console.groupEnd();
    };

    logKanbanMetrics();
    window.addEventListener("resize", logKanbanMetrics);
    return () => window.removeEventListener("resize", logKanbanMetrics);
  }, [jobsByStage, stages]);

  return (
    <div
      ref={boardRef}
      data-contract-kanban-board
      className="flex h-full min-h-0 overflow-hidden gap-2.5"
    >
      {stages.map((stage) => {
        const valid = isValidTarget(stage.id);
        const invalid = isInvalidTarget(stage.id);
        const isOver = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            data-contract-kanban-lane={stage.id}
            className={`flex min-h-0 flex-1 flex-col rounded-lg border transition-all duration-200 ${
              valid && isOver ? "border-primary ring-2 ring-primary/20 bg-primary/5"
              : valid ? "border-primary/40 bg-primary/[0.02]"
              : invalid ? "border-border/30 opacity-40"
              : `${stage.borderColor} ${stage.bgColor}`
            }`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className={`px-3 py-2.5 border-b rounded-t-lg shrink-0 ${stage.bgColor} border-border/40`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1 rounded ${stage.bgColor}`}>
                    <stage.icon className={`h-3.5 w-3.5 ${stage.color}`} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${stage.color} truncate`}>
                    {stage.shortLabel}
                  </span>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-card/80 rounded-full px-2 py-0.5 tabular-nums border border-border/40 shrink-0">
                  {(jobsByStage[stage.id] || []).length}
                </span>
              </div>
              {valid && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary font-medium">
                  <ChevronRight className="h-3 w-3" />
                  Drop here to move
                </div>
              )}
              {invalid && dragSourceStage && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium">
                  <Lock className="h-3 w-3" />
                  Not a valid next step
                </div>
              )}
            </div>

            <div
              ref={(node) => {
                laneBodyRefs.current[stage.id] = node;
              }}
              data-contract-kanban-scroll={stage.id}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div className="p-2 space-y-2">
                {(jobsByStage[stage.id] || []).length === 0 ? (
                  <div className={`py-10 text-center rounded-md border border-dashed transition-colors ${valid && isOver ? "border-primary/40 bg-primary/5" : "border-border/30"}`}>
                    <FileText className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1.5" />
                    <p className="text-[11px] text-muted-foreground/50 font-medium">
                      {valid && isOver ? "Drop here" : "No contracts"}
                    </p>
                  </div>
                ) : (
                  (jobsByStage[stage.id] || []).map((job) => (
                    <KanbanCard
                      key={job.id} job={job} stage={stage} stages={stages}
                      moveContract={moveContract} openDeleteDialog={openDeleteDialog}
                      archiveContract={archiveContract}
                      getStageIndex={getStageIndex} formatDate={formatDate}
                      router={router}
                      setDragSourceStage={setDragSourceStage}
                      onDragEnd={() => { setDragSourceStage(null); setDragOverStage(null); }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const KanbanCard = ({
  job, stage, stages, moveContract, openDeleteDialog, getStageIndex, formatDate, router,
  archiveContract,
  setDragSourceStage, onDragEnd,
}: {
  job: ContractListItem;
  stage: (typeof PIPELINE_STAGES)[0];
  stages: typeof PIPELINE_STAGES;
  moveContract: (id: string, s: ContractPipelineStatus) => void;
  openDeleteDialog: (job: ContractListItem) => void;
  archiveContract: (job: ContractListItem) => void;
  getStageIndex: (s: ContractPipelineStatus) => number;
  formatDate: (iso: string) => string;
  router: ReturnType<typeof useRouter>;
  setDragSourceStage: (s: ContractPipelineStatus) => void;
  onDragEnd: () => void;
}) => {
  const currentIdx = getStageIndex(stage.id);
  const daysSinceCreated = differenceInDays(new Date(), new Date(job.createdAt));
  const isStale = daysSinceCreated > 5;
  const isSigned = SIGNED_STATUSES.includes(stage.id);
  const isTerminal = false;
  const effectiveStatus = mapToDisplayStage(job.contractStatus || "CONTRACT_RECEIPT");
  const allowedTargets = ALLOWED_TRANSITIONS[effectiveStatus] || [];
  const canAdvance = currentIdx < stages.length - 1 && allowedTargets.includes(stages[currentIdx + 1].id);
  const canRetreat = currentIdx > 0 && allowedTargets.includes(stages[currentIdx - 1].id);

  return (
    <div
      className={`bg-card rounded-lg border-2 shadow-sm hover:shadow-md transition-all ${
        isTerminal ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } group ${isStale && !isSigned ? "border-warning/60 ring-1 ring-warning/20" : "border-border/60"}`}
      draggable={!isTerminal}
      onDragStart={(e) => {
        if (isTerminal) { e.preventDefault(); return; }
        e.dataTransfer.setData("text/plain", job.id);
        e.dataTransfer.effectAllowed = "move";
        setDragSourceStage(stage.id);
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
        onDragEnd();
      }}
      onClick={() => {
        router.push(`/l/contracts/view/${job.id}`);
      }}
    >
      {/* Lock banner for signed contracts */}
      {isSigned && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-warning/10 border-b border-warning/20 rounded-t-lg">
          <Lock className="h-3 w-3 text-warning shrink-0" />
          <span className="text-[10px] font-semibold text-warning">Locked — Job Created</span>
        </div>
      )}

      {/* Stale alert banner */}
      {isStale && !isSigned && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-warning/10 border-b border-warning/20 rounded-t-lg">
          <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
          <span className="text-[10px] font-semibold text-warning">{daysSinceCreated}d stale</span>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between mb-0.5">
          <p className="text-sm font-bold text-foreground uppercase leading-tight pr-2">
            {job.projectName || "Untitled Project"}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5 -mr-1 shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/l/contracts/view/${job.id}`)}>
                <><Eye className="h-3.5 w-3.5 mr-2" />Open Contract</>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {allowedTargets.map((targetId) => {
                const s = stages.find((st) => st.id === targetId);
                if (!s) return null;
                return (
                  <DropdownMenuItem key={s.id} onClick={() => moveContract(job.id, s.id)}>
                    <s.icon className="h-3.5 w-3.5 mr-2" />
                    Move to {s.shortLabel}
                  </DropdownMenuItem>
                );
              })}
              {!isSigned && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(job)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete Contract
                  </DropdownMenuItem>
                </>
              )}
              {isSigned && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => archiveContract(job)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Archive Contract
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-xs text-foreground font-semibold">
          {job.county || "—"}
          {job.etcBranch ? <span className="text-muted-foreground font-normal"> · {job.etcBranch}</span> : null}
        </p>

        {job.etcJobNumber && (
          <p className="text-[11px] font-mono font-bold text-primary mt-1">{job.etcJobNumber}</p>
        )}

        <div className="border-t border-border/40 my-2" />

        <div className="space-y-1">
          <DottedRow label="CONTRACT #" value={job.contractNumber || "NOT SET"} highlight={!!job.contractNumber} />
          <DottedRow label="PM" value={job.etcProjectManager || "NOT SET"} />
          <DottedRow label="OWNER" value={job.projectOwner || "NOT SET"} highlight={!!job.projectOwner} />
          <DottedRow label="CUSTOMER" value={job.customerName || "NOT SET"} />
          <DottedRow label="START DATE" value={job.projectStartDate ? formatDate(job.projectStartDate) : "NOT SET"} />
          <DottedRow label="END DATE" value={job.projectEndDate ? formatDate(job.projectEndDate) : "NOT SET"} />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end mt-2 pt-1.5 border-t border-border/30 gap-0.5">
          {isSigned ? (
            <Button
              variant="ghost" size="sm"
              className="h-5 text-[10px] px-1.5 gap-0.5 text-primary hover:text-primary font-semibold"
              onClick={(e) => { e.stopPropagation(); router.push(`/l/${job.id}`); }}
            >
              <Eye className="h-2.5 w-2.5" />
              Open Contract
            </Button>
          ) : (
            <>
              {canRetreat && (
                <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 gap-0.5 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); moveContract(job.id, stages[currentIdx - 1].id); }}>
                  <ChevronLeft className="h-2.5 w-2.5" /> Back
                </Button>
              )}
              {canAdvance && (
                <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 gap-0.5 text-primary hover:text-primary font-semibold"
                  onClick={(e) => { e.stopPropagation(); moveContract(job.id, stages[currentIdx + 1].id); }}>
                  Advance <ChevronRight className="h-2.5 w-2.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DottedRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-baseline gap-1 text-[10px] leading-tight">
    <span className="uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{label}</span>
    <span className="flex-1 border-b border-dotted border-muted-foreground/30 min-w-[8px] translate-y-[-2px]" />
    <span className={`shrink-0 font-semibold text-right ${highlight ? "text-primary" : value === "NOT SET" ? "text-muted-foreground/50" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

/* ─── List View ─── */
const ListView = ({
  getStatusBadge, moveContract, openDeleteDialog, formatDate, router, stages, filteredJobs, archiveContract,
}: {
  filteredJobs: ContractListItem[];
  getStatusBadge: (s: ContractPipelineStatus) => React.ReactNode;
  moveContract: (id: string, s: ContractPipelineStatus) => void;
  openDeleteDialog: (job: ContractListItem) => void;
  archiveContract: (job: ContractListItem) => void;
  formatDate: (iso: string) => string;
  router: ReturnType<typeof useRouter>;
  stages: typeof PIPELINE_STAGES;
}) => {
  const jobsByStage = useMemo(() => {
    const map: Record<string, ContractListItem[]> = {};
    stages.forEach((s) => { map[s.id] = []; });
    filteredJobs.forEach((j) => {
      const displayStage = mapToDisplayStage(j.contractStatus || "CONTRACT_RECEIPT");
      if (map[displayStage]) {
        map[displayStage].push(j);
      } else {
        map["CONTRACT_RECEIPT"].push(j);
      }
    });
    return map as Record<ContractPipelineStatus, ContractListItem[]>;
  }, [filteredJobs, stages]);

  const ContractTable = ({ stage, jobs }: { stage: typeof PIPELINE_STAGES[0]; jobs: ContractListItem[] }) => (
    <div className="rounded-lg border bg-card overflow-hidden mb-6">
      <div className={`px-4 py-3 border-b ${stage.bgColor}`}>
        <div className="flex items-center gap-2">
          <stage.icon className={`h-4 w-4 ${stage.color}`} />
          <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
          <Badge variant="outline" className="text-xs ml-auto">
            {jobs.length} contract{jobs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>
      {jobs.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <stage.icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No contracts in this stage</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Job Number</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Project</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customer</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">County</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">PM</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const isSigned = job.contractStatus ? SIGNED_STATUSES.includes(job.contractStatus) : false;
              const effectiveStatus = mapToDisplayStage(job.contractStatus || "") as string;
              const allowedTargets = ALLOWED_TRANSITIONS[effectiveStatus] || [];

              return (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/20 transition-colors text-sm"
                  onClick={() => {
                    const isSigned = job.contractStatus ? SIGNED_STATUSES.includes(job.contractStatus) : false;
                    router.push(isSigned ? `/l/contracts/view/${job.id}` : `/l/contracts/edit/${job.id}`);
                  }}
                >
                  <TableCell className="font-mono font-semibold text-primary py-3">
                    {isSigned && <Lock className="h-3 w-3 inline mr-1 text-warning" />}
                    {job.etcJobNumber || "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate py-3">{job.projectName || "—"}</TableCell>
                  <TableCell className="py-3 uppercase text-xs tracking-wide">{job.customerName || "—"}</TableCell>
                  <TableCell className="py-3">{job.county || "—"}</TableCell>
                  <TableCell className="py-3 text-xs">{job.etcProjectManager || "—"}</TableCell>
                  <TableCell className="py-3 tabular-nums text-xs text-muted-foreground whitespace-nowrap">{formatDate(job.createdAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/l/contracts/view/${job.id}`)}>
                  Open Contract
                </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {allowedTargets.map((targetId) => {
                          const s = stages.find((st) => st.id === targetId);
                          if (!s) return null;
                          return (
                            <DropdownMenuItem key={s.id} onClick={() => moveContract(job.id, s.id)}>
                              <s.icon className="h-3.5 w-3.5 mr-2" />
                              Move to {s.shortLabel}
                            </DropdownMenuItem>
                          );
                        })}
                        {!isSigned && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(job)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete Contract
                            </DropdownMenuItem>
                          </>
                        )}
                        {isSigned && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => archiveContract(job)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Archive Contract
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );

  if (filteredJobs.length === 0) {
    return (
      <div className="rounded-lg border bg-card/90 p-16 text-center shadow-sm">
        <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">No contracts match the current filters</p>
        <p className="text-sm text-muted-foreground mt-1">Adjust the filters or create a new contract to get started.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={stages[0]?.id} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        {stages.map((stage) => (
          <TabsTrigger key={stage.id} value={stage.id} className="flex items-center gap-2">
            <stage.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{stage.shortLabel}</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {(jobsByStage[stage.id] || []).length}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      {stages.map((stage) => (
        <TabsContent key={stage.id} value={stage.id} className="mt-6">
          <ContractTable
            stage={stage}
            jobs={jobsByStage[stage.id] || []}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ContractManager;
