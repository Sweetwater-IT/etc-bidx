"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useJobsList } from "@/hooks/useJobsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  FolderOpen,
  ArrowUpDown,
  MoreHorizontal,
  User,
  Loader2,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

type SortField =
  | "etcJobNumber"
  | "contractNumber"
  | "county"
  | "customerName"
  | "projectName"
  | "projectStartDate"
  | "projectEndDate"
  | "createdAt"
  | "projectStatus"
  | "billingStatus"
  | "etcBranch"
  | "projectOwner"
  | "etcProjectManager";

type SortDir = "asc" | "desc";

const SIGNED_STATUSES = ["CONTRACT_SIGNED"];

const JobList = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my-jobs");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPM, setCurrentPM] = useState<string>("");

  // Fetch jobs from database using Zustand
  const { jobs, isLoading } = useJobsList();

  // Derive unique PMs for the selector
  const allPMs = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.etcProjectManager) set.add(j.etcProjectManager);
    });
    return Array.from(set).sort();
  }, [jobs]);

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
    return list;
  }, [signedJobs, activeTab, currentPM]);

  // Sort
  const sortedJobs = useMemo(() => {
    const sorted = [...filteredJobs].sort((a, b) => {
      const aVal = (a as any)[sortField] || "";
      const bVal = (b as any)[sortField] || "";
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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sortedJobs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedJobs.map((j) => j.id)));
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

  const formatCreatedAt = (iso: string) => {
    try {
      return format(new Date(iso), "MMM d, yyyy, h:mm a");
    } catch {
      return iso;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {/* PM Selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {allPMs.length > 0 ? (
              <Select value={currentPM} onValueChange={setCurrentPM}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue placeholder="Select your name" />
                </SelectTrigger>
                <SelectContent>
                  {allPMs.map((pm) => (
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
          <Button onClick={() => router.push("/contract/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
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

        {sortedJobs.length === 0 ? (
          <div className="rounded-lg border bg-card p-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No jobs found</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Complete a contract review to add a job.
            </p>
            <Button
              onClick={() => router.push("/contract/new")}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Contract
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        sortedJobs.length > 0 &&
                        selected.size === sortedJobs.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <SortableHead label="Job Number" field="etcJobNumber" />
                  <SortableHead label="Contract #" field="contractNumber" />
                  <SortableHead label="Project" field="projectName" />
                  <SortableHead label="Owner" field="projectOwner" />
                  <SortableHead label="Contractor" field="customerName" />
                  <SortableHead label="County / Branch" field="county" />
                  <SortableHead label="Customer PM" field="etcProjectManager" />
                  <SortableHead label="Job Status" field="projectStatus" />
                  <SortableHead label="Billing Status" field="billingStatus" />
                  <SortableHead label="Start Date" field="projectStartDate" />
                  <SortableHead label="End Date" field="projectEndDate" />
                  <SortableHead label="Created" field="createdAt" />
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/20 transition-colors text-sm"
                    onClick={() => router.push(`/l/${job.id}`)}
                  >
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="py-3"
                    >
                      <Checkbox
                        checked={selected.has(job.id)}
                        onCheckedChange={() => toggleSelect(job.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-primary py-3">
                      {job.etcJobNumber
                        ? `${job.etcBranch || ""}-${job.etcJobNumber}`
                        : (job.etcBranch
                          ? `Branch ${job.etcBranch}`
                          : "—")}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono">
                      {job.contractNumber || "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate py-3">
                      {job.projectName || "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      {job.projectOwner || "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs uppercase tracking-wide">
                      {job.customerName || "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      <span>{job.county || "—"}</span>
                      {job.etcBranch && (
                        <span className="block text-[10px] text-muted-foreground">{job.etcBranch}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      {job.etcProjectManager || "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={job.projectStatus} />
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={job.billingStatus} />
                    </TableCell>
                    <TableCell className="tabular-nums py-3 whitespace-nowrap text-xs">
                      {job.projectStartDate || "—"}
                    </TableCell>
                    <TableCell className="tabular-nums py-3 whitespace-nowrap text-xs">
                      {job.projectEndDate || "—"}
                    </TableCell>
                    <TableCell className="tabular-nums py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatCreatedAt(job.createdAt)}
                    </TableCell>
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="py-3"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/l/${job.id}`)}
                          >
                            Open Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobList;