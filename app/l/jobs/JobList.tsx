"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJobsList } from "@/hooks/useJobsList";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderOpen,
  ArrowUpDown,
  User,
  Loader2,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react";
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
} from "@/components/ui/command";
import { format } from "date-fns";

type SortField =
  | "etcJobNumber"
  | "projectName"
  | "projectOwner"
  | "contractNumber"
  | "customerName"
  | "customerPM"
  | "projectStartDate"
  | "projectEndDate"
  | "projectStatus"
  | "actionItems";

type SortDir = "asc" | "desc";

const SIGNED_STATUSES = ["CONTRACT_SIGNED"];

const JobList = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my-jobs");
  const [sortField, setSortField] = useState<SortField>("etcJobNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPM, setCurrentPM] = useState<string>("");
  const [pmOptions, setPmOptions] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [customerPmFilter, setCustomerPmFilter] = useState<string>("all");
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("all");
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerPmOpen, setCustomerPmOpen] = useState(false);
  const [jobStatusOpen, setJobStatusOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPmSearch, setCustomerPmSearch] = useState("");
  const [jobStatusSearch, setJobStatusSearch] = useState("");

  // Fetch jobs from database using Zustand
  const { jobs, isLoading } = useJobsList();

  useEffect(() => {
    const fetchProjectManagers = async () => {
      try {
        const response = await fetch('/api/l/project-managers');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const names = result.data
            .map((pm: any) => pm.full_name)
            .filter((name: string) => !!name)
            .sort((a: string, b: string) => a.localeCompare(b));
          setPmOptions(names);
        }
      } catch (error) {
        console.error('Error loading project managers:', error);
      }
    };

    fetchProjectManagers();
  }, []);

  // Derive unique branches for tabs
  const branches = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.etcBranch) set.add(j.etcBranch);
    });
    return Array.from(set).sort();
  }, [jobs]);

  // Only show jobs that have been signed (past the contract pipeline)
  const signedJobs = useMemo(
    () => jobs.filter((j) => SIGNED_STATUSES.includes(j.contractStatus)),
    [jobs]
  );

  // Filter
  const filteredJobs = useMemo(() => {
    let list = signedJobs;
    if (activeTab === "archived") {
      // For archived we'd need a separate query; skip for now
      return [];
    } else if (activeTab === "my-jobs") {
      list = list.filter(
        (j) =>
          currentPM &&
          j.etcProjectManager?.toLowerCase() === currentPM.toLowerCase()
      );
    } else if (activeTab === "all") {
      // show all non-archived
    } else {
      // branch filter
      list = list.filter(
        (j) => j.etcBranch?.toLowerCase() === activeTab.toLowerCase()
      );
    }

    if (ownerFilter !== "all") {
      list = list.filter((j) => j.projectOwner === ownerFilter);
    }

    if (customerFilter !== "all") {
      list = list.filter((j) => j.customerName === customerFilter);
    }

    if (customerPmFilter !== "all") {
      list = list.filter((j) => j.customerPM === customerPmFilter);
    }

    if (jobStatusFilter !== "all") {
      list = list.filter((j) => j.projectStatus === jobStatusFilter);
    }

    return list;
  }, [signedJobs, activeTab, currentPM, ownerFilter, customerFilter, customerPmFilter, jobStatusFilter]);

  // Sort
  const sortedJobs = useMemo(() => {
    const sorted = [...filteredJobs].sort((a, b) => {
      const aVal = sortField === "actionItems" ? "" : ((a as any)[sortField] || "");
      const bVal = sortField === "actionItems" ? "" : ((b as any)[sortField] || "");
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredJobs, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const myJobsCount = currentPM
    ? signedJobs.filter(
        (j) =>
          j.etcProjectManager?.toLowerCase() === currentPM.toLowerCase()
      ).length
    : 0;

  const tabs = [
    { id: "my-jobs", label: "My Jobs", count: myJobsCount },
    { id: "all", label: "All", count: signedJobs.length },
    ...branches.map((b) => ({
      id: b.toLowerCase(),
      label: b,
      count: signedJobs.filter(
        (j) => j.etcBranch?.toLowerCase() === b.toLowerCase()
      ).length,
    })),
  ];

  const ownerOptions = useMemo(
    () =>
      Array.from(new Set(signedJobs.map((job) => job.projectOwner).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [signedJobs]
  );

  const customerOptions = useMemo(
    () =>
      Array.from(new Set(signedJobs.map((job) => job.customerName).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [signedJobs]
  );

  const customerPmOptions = useMemo(
    () =>
      Array.from(new Set(signedJobs.map((job) => job.customerPM).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [signedJobs]
  );

  const jobStatusOptions = useMemo(
    () =>
      Array.from(new Set(signedJobs.map((job) => job.projectStatus).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [signedJobs]
  );

  const filteredOwnerOptions = useMemo(
    () => ownerOptions.filter((owner) => owner.toLowerCase().includes(ownerSearch.toLowerCase())),
    [ownerOptions, ownerSearch]
  );

  const filteredCustomerOptions = useMemo(
    () => customerOptions.filter((customer) => customer.toLowerCase().includes(customerSearch.toLowerCase())),
    [customerOptions, customerSearch]
  );

  const filteredCustomerPmOptions = useMemo(
    () => customerPmOptions.filter((pm) => pm.toLowerCase().includes(customerPmSearch.toLowerCase())),
    [customerPmOptions, customerPmSearch]
  );

  const filteredJobStatusOptions = useMemo(
    () => jobStatusOptions.filter((status) => status.toLowerCase().includes(jobStatusSearch.toLowerCase())),
    [jobStatusOptions, jobStatusSearch]
  );

  const hasActiveFilters =
    ownerFilter !== "all" ||
    customerFilter !== "all" ||
    customerPmFilter !== "all" ||
    jobStatusFilter !== "all";

  const SortableHead = ({
    label,
    field,
  }: {
    label: string;
    field: SortField;
  }) => (
    <TableHead
      className="font-semibold text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      </span>
    </TableHead>
  );

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd-MM-yyyy");
    } catch {
      return dateStr;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded ${
        status === "COMPLETE"
          ? "bg-success/10 text-success"
          : status === "IN PROGRESS"
          ? "bg-accent/10 text-accent-foreground"
          : "text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <main className="w-full px-6 py-6">
            {/* PM Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {pmOptions.length > 0 ? (
                  <Select value={currentPM} onValueChange={setCurrentPM}>
                    <SelectTrigger className="w-[200px] h-9 text-sm">
                      <SelectValue placeholder="Select your name" />
                    </SelectTrigger>
                    <SelectContent>
                      {pmOptions.map((pm) => (
                        <SelectItem key={pm} value={pm}>
                          {pm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs text-muted-foreground">No PMs assigned yet</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 border rounded-md bg-card p-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={ownerOpen} className="h-9 w-[220px] justify-between text-xs font-normal">
                    <span className={ownerFilter === "all" ? "text-muted-foreground" : "truncate"}>
                      {ownerFilter === "all" ? "All Project Owners" : ownerFilter}
                    </span>
                    <span className="ml-2 flex items-center gap-1 shrink-0">
                      {ownerFilter !== "all" ? (
                        <span
                          role="button"
                          aria-label="Clear project owner filter"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOwnerFilter("all");
                            setOwnerSearch("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search project owner…" value={ownerSearch} onValueChange={setOwnerSearch} />
                    <CommandList>
                      <CommandEmpty>No project owner found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all-project-owners"
                          onSelect={() => {
                            setOwnerFilter("all");
                            setOwnerOpen(false);
                            setOwnerSearch("");
                          }}
                        >
                          <Check className={ownerFilter === "all" ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                          All Project Owners
                        </CommandItem>
                        {filteredOwnerOptions.map((owner) => (
                          <CommandItem
                            key={owner}
                            value={owner}
                            onSelect={() => {
                              setOwnerFilter(owner);
                              setOwnerOpen(false);
                              setOwnerSearch("");
                            }}
                          >
                            <Check className={ownerFilter === owner ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                            {owner}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={customerOpen} className="h-9 w-[220px] justify-between text-xs font-normal">
                    <span className={customerFilter === "all" ? "text-muted-foreground" : "truncate"}>
                      {customerFilter === "all" ? "All Customers" : customerFilter}
                    </span>
                    <span className="ml-2 flex items-center gap-1 shrink-0">
                      {customerFilter !== "all" ? (
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
                      ) : (
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
                            key={customer}
                            value={customer}
                            onSelect={() => {
                              setCustomerFilter(customer);
                              setCustomerOpen(false);
                              setCustomerSearch("");
                            }}
                          >
                            <Check className={customerFilter === customer ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                            {customer}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Popover open={customerPmOpen} onOpenChange={setCustomerPmOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={customerPmOpen} className="h-9 w-[220px] justify-between text-xs font-normal">
                    <span className={customerPmFilter === "all" ? "text-muted-foreground" : "truncate"}>
                      {customerPmFilter === "all" ? "All Customer PMs" : customerPmFilter}
                    </span>
                    <span className="ml-2 flex items-center gap-1 shrink-0">
                      {customerPmFilter !== "all" ? (
                        <span
                          role="button"
                          aria-label="Clear customer PM filter"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCustomerPmFilter("all");
                            setCustomerPmSearch("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer PM…" value={customerPmSearch} onValueChange={setCustomerPmSearch} />
                    <CommandList>
                      <CommandEmpty>No customer PM found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all-customer-pms"
                          onSelect={() => {
                            setCustomerPmFilter("all");
                            setCustomerPmOpen(false);
                            setCustomerPmSearch("");
                          }}
                        >
                          <Check className={customerPmFilter === "all" ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                          All Customer PMs
                        </CommandItem>
                        {filteredCustomerPmOptions.map((pm) => (
                          <CommandItem
                            key={pm}
                            value={pm}
                            onSelect={() => {
                              setCustomerPmFilter(pm);
                              setCustomerPmOpen(false);
                              setCustomerPmSearch("");
                            }}
                          >
                            <Check className={customerPmFilter === pm ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                            {pm}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Popover open={jobStatusOpen} onOpenChange={setJobStatusOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={jobStatusOpen} className="h-9 w-[200px] justify-between text-xs font-normal">
                    <span className={jobStatusFilter === "all" ? "text-muted-foreground" : "truncate"}>
                      {jobStatusFilter === "all" ? "All Job Statuses" : jobStatusFilter}
                    </span>
                    <span className="ml-2 flex items-center gap-1 shrink-0">
                      {jobStatusFilter !== "all" ? (
                        <span
                          role="button"
                          aria-label="Clear job status filter"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setJobStatusFilter("all");
                            setJobStatusSearch("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search job status…" value={jobStatusSearch} onValueChange={setJobStatusSearch} />
                    <CommandList>
                      <CommandEmpty>No job status found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all-job-statuses"
                          onSelect={() => {
                            setJobStatusFilter("all");
                            setJobStatusOpen(false);
                            setJobStatusSearch("");
                          }}
                        >
                          <Check className={jobStatusFilter === "all" ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                          All Job Statuses
                        </CommandItem>
                        {filteredJobStatusOptions.map((status) => (
                          <CommandItem
                            key={status}
                            value={status}
                            onSelect={() => {
                              setJobStatusFilter(status);
                              setJobStatusOpen(false);
                              setJobStatusSearch("");
                            }}
                          >
                            <Check className={jobStatusFilter === status ? "mr-2 h-3 w-3 opacity-100" : "mr-2 h-3 w-3 opacity-0"} />
                            {status}
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
                    setOwnerFilter("all");
                    setCustomerFilter("all");
                    setCustomerPmFilter("all");
                    setJobStatusFilter("all");
                    setOwnerSearch("");
                    setCustomerSearch("");
                    setCustomerPmSearch("");
                    setJobStatusSearch("");
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>

            {sortedJobs.length === 0 ? (
              <div className="rounded-lg border bg-card p-16 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No jobs found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete a contract review to add a job.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[200px] font-semibold text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap" onClick={() => toggleSort("etcJobNumber")}>
                        <span className="inline-flex items-center gap-1">
                          ETC job number
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        </span>
                      </TableHead>
                      <TableHead className="w-[260px] font-semibold text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap" onClick={() => toggleSort("projectName")}>
                        <span className="inline-flex items-center gap-1">
                          Project Name
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        </span>
                      </TableHead>
                      <SortableHead label="Project Owner" field="projectOwner" />
                      <TableHead className="w-[200px] font-semibold text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap" onClick={() => toggleSort("contractNumber")}>
                        <span className="inline-flex items-center gap-1">
                          Contract #
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        </span>
                      </TableHead>
                      <SortableHead label="Customer" field="customerName" />
                      <SortableHead label="Customer PM" field="customerPM" />
                      <SortableHead label="Job Status" field="projectStatus" />
                      <SortableHead label="Start Date" field="projectStartDate" />
                      <SortableHead label="End Date" field="projectEndDate" />
                      <SortableHead label="Action Items" field="actionItems" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedJobs.map((job) => (
                      <TableRow
                        key={job.id}
                        className="cursor-pointer hover:bg-muted/20 transition-colors text-sm"
                        onClick={() => router.push(`/l/${job.id}`)}
                      >
                        <TableCell className="font-mono font-semibold text-primary py-3">
                          {job.etcJobNumber || "—"}
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate py-3">
                          {job.projectName || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-xs">
                          {job.projectOwner || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono">
                          {job.contractNumber || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-xs uppercase tracking-wide">
                          {job.customerName || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-xs">
                          {job.customerPM || "—"}
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge status={job.projectStatus} />
                        </TableCell>
                        <TableCell className="tabular-nums py-3 whitespace-nowrap text-xs">
                          {job.projectStartDate ? formatDate(job.projectStartDate) : "—"}
                        </TableCell>
                        <TableCell className="tabular-nums py-3 whitespace-nowrap text-xs">
                          {job.projectEndDate ? formatDate(job.projectEndDate) : "—"}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          —
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default JobList;
