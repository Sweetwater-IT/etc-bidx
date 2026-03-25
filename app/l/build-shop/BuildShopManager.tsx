"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wrench,
  Search,
  RefreshCw,
  Loader2,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Clock,
  Package,
  Hammer,
  CheckCircle2,
  Inbox,
  Eye,
  List,
  Bell,
  ArrowLeft,
  MoreHorizontal,
  Archive,
  LayoutGrid,
  ListOrdered,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type ViewMode = "board" | "list" | "archive";

type BuildRequestEnriched = {
  id: string;
  job_id: string;
  takeoff_id: string;
  work_order_id: string | null;
  branch: string | null;
  requested_at: string;
  priority: string;
  status: string;
  materials_received: boolean;
  archived_at: string | null;
  rejection_reason: string | null;
  build_started_at: string | null;
  completed_at: string | null;
  revision_number?: number;
  signs_ready_at?: string | null;
  job_name: string;
  customer_name: string;
  etc_job_number: string;
  etc_branch: string;
  project_owner: string;
  contract_number: string;
  takeoff_title: string;
  takeoff_needed_by: string | null;
  takeoff_priority: string;
  takeoff_build_shop_notes: string;
  wo_number: string | null;
  work_order_status: string | null;
  item_count: number;
  structure_count: number;
  type_iii_count: number;
  hstand_count: number;
  any_order_required: boolean;
};

const BUILD_REQUEST_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-500/15 text-blue-700", icon: "inbox" },
  { value: "under_review", label: "Under Review", color: "bg-violet-500/15 text-violet-700", icon: "search" },
  { value: "awaiting_signs", label: "Awaiting Signs", color: "bg-orange-500/15 text-orange-700", icon: "clock" },
  { value: "materials_ready", label: "Materials Ready", color: "bg-teal-500/15 text-teal-700", icon: "package" },
  { value: "build_queue", label: "Build Queue", color: "bg-indigo-500/15 text-indigo-700", icon: "list" },
  { value: "in_build", label: "In Build", color: "bg-amber-500/15 text-amber-700", icon: "hammer" },
  { value: "ready_for_pm", label: "Final Inspection", color: "bg-cyan-500/15 text-cyan-700", icon: "bell" },
  { value: "completed", label: "Completed", color: "bg-emerald-500/15 text-emerald-700", icon: "check" },
] as const;

type BuildRequestStatus = (typeof BUILD_REQUEST_STATUSES)[number]["value"];

const KANBAN_COLUMNS = BUILD_REQUEST_STATUSES.map((status) => status.value);

const VALID_TRANSITIONS: Record<BuildRequestStatus, BuildRequestStatus[]> = {
  new: ["under_review"],
  under_review: ["awaiting_signs", "materials_ready"],
  awaiting_signs: ["materials_ready"],
  materials_ready: ["build_queue"],
  build_queue: ["in_build"],
  in_build: ["ready_for_pm"],
  ready_for_pm: ["completed"],
  completed: [],
};

function getStatusConfig(status: string) {
  return BUILD_REQUEST_STATUSES.find((item) => item.value === status) || {
    value: status,
    label: status,
    color: "bg-muted text-muted-foreground",
    icon: "circle",
  };
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  inbox: Inbox,
  search: Eye,
  clock: Clock,
  package: Package,
  list: List,
  hammer: Hammer,
  bell: Bell,
  check: CheckCircle2,
  circle: Wrench,
};

const COLUMN_CONFIGS = KANBAN_COLUMNS.filter((status) => status !== "completed").map((status) => {
  const conf = getStatusConfig(status);
  return {
    id: status,
    label: conf.label,
    shortLabel: conf.label,
    icon: STATUS_ICONS[conf.icon] || Wrench,
    color: conf.color.includes("blue")
      ? "text-blue-600"
      : conf.color.includes("violet")
      ? "text-violet-600"
      : conf.color.includes("orange")
      ? "text-orange-600"
      : conf.color.includes("teal")
      ? "text-teal-600"
      : conf.color.includes("indigo")
      ? "text-indigo-600"
      : conf.color.includes("amber")
      ? "text-amber-600"
      : conf.color.includes("cyan")
      ? "text-cyan-600"
      : conf.color.includes("emerald")
      ? "text-emerald-600"
      : "text-muted-foreground",
    bgColor: conf.color.split(" ").find((entry) => entry.startsWith("bg-")) || "bg-muted/50",
    borderColor: "border-border/40",
  };
});

const canMoveTo = (from: string, to: string) =>
  VALID_TRANSITIONS[from]?.includes(to) ?? false;

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  urgent: { label: "CRITICAL", className: "bg-destructive/15 text-destructive border-destructive/40 font-black" },
  high: { label: "HIGH", className: "bg-orange-500/10 text-orange-700 border-orange-500/30 font-bold" },
  standard: { label: "STANDARD", className: "bg-muted text-muted-foreground border-border" },
  normal: { label: "STANDARD", className: "bg-muted text-muted-foreground border-border" },
  low: { label: "LOW", className: "bg-muted text-muted-foreground/70 border-border" },
};

type SizeClass = "SMALL" | "MEDIUM" | "LARGE";

function getSizeClass(itemCount: number): SizeClass {
  if (itemCount >= 50) return "LARGE";
  if (itemCount >= 30) return "MEDIUM";
  return "SMALL";
}

type UrgencyLevel = "critical" | "high" | "upcoming" | "normal" | "none";

function getUrgency(needDate: string | null | undefined): UrgencyLevel {
  if (!needDate) return "none";
  const diff = Math.ceil((new Date(needDate).getTime() - Date.now()) / 86400000);
  if (diff <= 2) return "critical";
  if (diff <= 5) return "high";
  if (diff <= 10) return "upcoming";
  return "normal";
}

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critical: "border-l-4 border-l-destructive",
  high: "border-l-4 border-l-orange-500",
  upcoming: "border-l-4 border-l-amber-400",
  normal: "border-l-4 border-l-border",
  none: "",
};

type ReadinessLevel = "READY" | "PARTIAL" | "BLOCKED" | "PENDING";

function getReadiness(br: BuildRequestEnriched): ReadinessLevel {
  if (br.materials_received) return "READY";
  if (br.status === "awaiting_signs") return "BLOCKED";
  if (br.any_order_required) return "PARTIAL";
  return "PENDING";
}

const READINESS_CONFIG: Record<ReadinessLevel, { label: string; className: string }> = {
  READY: { label: "READY", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  PARTIAL: { label: "PARTIAL", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  BLOCKED: { label: "BLOCKED", className: "bg-destructive/10 text-destructive border-destructive/30" },
  PENDING: { label: "PENDING", className: "bg-muted text-muted-foreground border-border" },
};

function computePriorityScore(br: BuildRequestEnriched): number {
  let score = 0;
  const tp = br.takeoff_priority || "standard";
  if (tp === "urgent") score -= 1000;
  else if (tp === "low") score += 200;

  if (br.priority === "urgent") score -= 1000;
  else if (br.priority === "high") score -= 500;
  else if (br.priority === "low") score += 200;

  const urg = getUrgency(br.takeoff_needed_by);
  if (urg === "critical") score -= 800;
  else if (urg === "high") score -= 400;
  else if (urg === "upcoming") score -= 100;

  const size = getSizeClass(br.item_count || 0);
  if (size === "LARGE") score -= 50;
  else if (size === "MEDIUM") score -= 20;

  if (br.materials_received) score -= 200;
  return score;
}

const ViewModeToggle = ({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) => {
  const modes: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: "board", label: "Board", icon: LayoutGrid },
    { id: "list", label: "List", icon: ListOrdered },
    { id: "archive", label: "Archive", icon: Archive },
  ];

  return (
    <div className="flex items-center rounded-lg border-2 border-border bg-muted/30 p-0.5">
      {modes.map((mode) => {
        const active = value === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
              active
                ? "border border-border bg-card text-foreground shadow-sm"
                : "border border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <mode.icon className="h-3.5 w-3.5" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function BuildShopManager() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [buildRequests, setBuildRequests] = useState<BuildRequestEnriched[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectBrId, setRejectBrId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const loadBuildRequests = useCallback(async (archiveView: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/l/build-requests?archived=${archiveView ? "true" : "false"}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load build requests");
      }
      setBuildRequests(result.data || []);
    } catch (error) {
      console.error("Error fetching build requests:", error);
      toast.error("Failed to load build requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuildRequests(viewMode === "archive");
  }, [loadBuildRequests, viewMode]);

  const availableBranches = useMemo(() => {
    const branches = new Set<string>();
    buildRequests.forEach((request) => {
      if (request.branch) branches.add(request.branch);
      else if (request.etc_branch) branches.add(request.etc_branch);
    });
    return [...branches].sort();
  }, [buildRequests]);

  const filtered = useMemo(() => {
    let list = buildRequests;
    if (branchFilter !== "all") {
      list = list.filter((request) => (request.branch || request.etc_branch) === branchFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((request) =>
        (request.takeoff_title || "").toLowerCase().includes(q) ||
        (request.job_name || "").toLowerCase().includes(q) ||
        (request.customer_name || "").toLowerCase().includes(q) ||
        (request.etc_job_number || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [buildRequests, branchFilter, search]);

  const columns = useMemo(() => {
    const map = new Map<string, BuildRequestEnriched[]>();
    KANBAN_COLUMNS.forEach((column) => map.set(column, []));
    filtered.forEach((request) => {
      const column = map.get(request.status);
      if (column) column.push(request);
    });
    for (const [, cards] of map) {
      cards.sort((a, b) => computePriorityScore(a) - computePriorityScore(b));
    }
    return map;
  }, [filtered]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      new: filtered.filter((request) => request.status === "new").length,
      inBuild: filtered.filter((request) => request.status === "in_build").length,
      readyForPM: filtered.filter((request) => request.status === "ready_for_pm").length,
    }),
    [filtered]
  );

  const refetch = useCallback(async () => {
    await loadBuildRequests(viewMode === "archive");
    toast.success("Refreshed");
  }, [loadBuildRequests, viewMode]);

  const updateRequest = useCallback(
    async (buildRequestId: string, patch: Record<string, unknown>) => {
      setPendingId(buildRequestId);
      try {
        const response = await fetch(`/api/l/build-requests/${buildRequestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update build request");
        }
        await loadBuildRequests(viewMode === "archive");
      } catch (error) {
        console.error("Error updating build request:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update build request");
        throw error;
      } finally {
        setPendingId(null);
      }
    },
    [loadBuildRequests, viewMode]
  );

  const handleTransition = async (buildRequestId: string, newStatus: string) => {
    if (newStatus === "materials_ready") {
      const request = buildRequests.find((item) => item.id === buildRequestId);
      if (request && !request.materials_received) {
        toast.error("Materials must be marked as received before moving to Materials Ready.");
        return;
      }
    }
    try {
      await updateRequest(buildRequestId, { status: newStatus });
    } catch {}
  };

  const handleMarkMaterialsReceived = async (buildRequestId: string) => {
    try {
      await updateRequest(buildRequestId, { materials_received: true });
      toast.success("Materials marked as received");
    } catch {}
  };

  const handleArchive = async (buildRequestId: string) => {
    try {
      await updateRequest(buildRequestId, { archive: true });
      toast.success("Build request archived");
    } catch {}
  };

  const handleStartReject = (buildRequestId: string) => {
    setRejectBrId(buildRequestId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectBrId) return;
    setRejecting(true);
    try {
      await updateRequest(rejectBrId, {
        status: "rejected",
        rejection_reason: rejectionReason,
      });
      setRejectDialogOpen(false);
      setRejectBrId(null);
      toast.success("Build request rejected");
    } catch {
    } finally {
      setRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-background">
        <p className="animate-pulse text-muted-foreground">Loading build requests...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary p-2">
                <Wrench className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-black leading-none tracking-tight text-foreground uppercase">
                  Build Shop
                </h1>
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                  {stats.total} request{stats.total !== 1 ? "s" : ""} &nbsp;·&nbsp; {stats.new} new &nbsp;·&nbsp; {stats.inBuild} building &nbsp;·&nbsp; {stats.readyForPM} ready
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9 text-sm"
                placeholder="Search jobs, takeoffs..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {availableBranches.length > 1 && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-9 w-[140px] text-sm">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" className="h-9 gap-2 text-sm font-semibold" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex h-full min-h-0 w-full max-w-[1800px] flex-1 flex-col overflow-hidden px-6 py-6">
        {viewMode === "board" && (
          <KanbanView
            columns={columns}
            columnConfigs={COLUMN_CONFIGS}
            onTransition={handleTransition}
            onReject={handleStartReject}
            onArchive={handleArchive}
            onMarkMaterialsReceived={handleMarkMaterialsReceived}
            pendingId={pendingId}
          />
        )}
        {viewMode === "list" && (
          <ListView
            requests={filtered}
            onTransition={handleTransition}
            onReject={handleStartReject}
            onArchive={handleArchive}
            onMarkMaterialsReceived={handleMarkMaterialsReceived}
            isArchiveView={false}
            pendingId={pendingId}
          />
        )}
        {viewMode === "archive" && (
          <ListView
            requests={filtered}
            onTransition={handleTransition}
            onReject={handleStartReject}
            onArchive={handleArchive}
            onMarkMaterialsReceived={handleMarkMaterialsReceived}
            isArchiveView
            pendingId={pendingId}
          />
        )}
      </main>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Build Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this request. The PM will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason (required)..."
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim() || rejecting}
            >
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ListView = ({
  requests,
  onTransition,
  onReject,
  onArchive,
  onMarkMaterialsReceived,
  isArchiveView,
  pendingId,
}: {
  requests: BuildRequestEnriched[];
  onTransition: (buildRequestId: string, newStatus: string) => void;
  onReject: (buildRequestId: string) => void;
  onArchive: (buildRequestId: string) => void;
  onMarkMaterialsReceived: (buildRequestId: string) => void;
  isArchiveView: boolean;
  pendingId: string | null;
}) => {
  if (requests.length === 0) {
    return (
      <div className="py-20 text-center">
        <Archive className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">
          {isArchiveView ? "No archived requests" : "No active requests"}
        </p>
      </div>
    );
  }

  const statusOrder = isArchiveView
    ? ["completed", "ready_for_pm", ...KANBAN_COLUMNS.filter((status) => status !== "completed" && status !== "ready_for_pm")]
    : KANBAN_COLUMNS;

  const colConfigMap = new Map<string, (typeof COLUMN_CONFIGS)[number]>(
    COLUMN_CONFIGS.map((column) => [column.id, column] as [string, (typeof COLUMN_CONFIGS)[number]])
  );

  const grouped = statusOrder
    .map((status) => {
      const colConf = colConfigMap.get(status);
      return {
        status,
        config: getStatusConfig(status),
        colColor: colConf?.color || "text-muted-foreground",
        colBgColor: colConf?.bgColor || "bg-muted/50",
        colIcon: colConf?.icon || Wrench,
        items: requests.filter((request) => request.status === status),
      };
    })
    .filter((group) => group.items.length > 0);

  const renderRow = (request: BuildRequestEnriched) => {
    const statusConf = getStatusConfig(request.status);
    const prio = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.normal;
    const nextStatuses = VALID_TRANSITIONS[request.status] || [];
    const forwardTargets = nextStatuses.filter((status) => {
      if (status === "materials_ready" && !request.materials_received) return false;
      return true;
    });
    const canArchiveRow = request.status === "completed" && !request.archived_at;
    const showMarkReceived = request.status === "awaiting_signs" && !request.materials_received;

    return (
      <TableRow key={request.id} className={isArchiveView ? "opacity-70" : ""}>
        <TableCell>
          <div>
            <p className="text-sm font-black uppercase">{request.takeoff_title || "Untitled"}</p>
            {request.etc_job_number && (
              <p className="text-xs font-mono text-primary">{request.etc_job_number}</p>
            )}
            {(request.revision_number || 1) > 1 && (
              <Badge variant="outline" className="mt-1 border-amber-500/40 text-[9px] text-amber-700">
                REV {request.revision_number}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="max-w-0 truncate text-sm font-medium">{request.job_name || "—"}</TableCell>
        <TableCell className="max-w-0 truncate text-sm">{request.customer_name || "—"}</TableCell>
        <TableCell className="text-sm">{request.branch || request.etc_branch || "—"}</TableCell>
        <TableCell>
          <Badge variant="outline" className={`text-[10px] font-bold ${statusConf.color}`}>
            {statusConf.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge className={`text-[10px] ${prio.className}`}>{prio.label}</Badge>
        </TableCell>
        <TableCell className="text-sm">{formatShortDate(request.takeoff_needed_by)}</TableCell>
        {isArchiveView && (
          <TableCell className="text-sm text-muted-foreground">
            {request.archived_at
              ? new Date(request.archived_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—"}
          </TableCell>
        )}
        {!isArchiveView && (
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                  {pendingId === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {forwardTargets.map((targetStatus) => {
                  const conf = getStatusConfig(targetStatus);
                  const Icon = STATUS_ICONS[conf.icon] || Wrench;
                  return (
                    <DropdownMenuItem key={targetStatus} onClick={() => onTransition(request.id, targetStatus)}>
                      <Icon className="mr-2 h-4 w-4" />
                      Move to {conf.label}
                    </DropdownMenuItem>
                  );
                })}
                {showMarkReceived && <DropdownMenuSeparator />}
                {showMarkReceived && (
                  <DropdownMenuItem onClick={() => onMarkMaterialsReceived(request.id)}>
                    <Package className="mr-2 h-4 w-4" />
                    Mark Materials Received
                  </DropdownMenuItem>
                )}
                {canArchiveRow && <DropdownMenuSeparator />}
                {canArchiveRow && (
                  <DropdownMenuItem onClick={() => onArchive(request.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    Mark Picked Up / Archive
                  </DropdownMenuItem>
                )}
                {request.status !== "completed" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onReject(request.id)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <div className="space-y-4 overflow-y-auto pr-1">
      {grouped.map((group) => {
        const IconComp = group.colIcon;
        return (
          <div key={group.status} className="overflow-hidden rounded-lg border-2 border-border bg-card">
            <div className={`border-b-2 border-border/50 px-4 py-2.5 ${group.colBgColor}`}>
              <div className="flex items-center gap-2">
                <div className={`rounded-md border border-border/30 p-1 ${group.colBgColor}`}>
                  <IconComp className={`h-3.5 w-3.5 ${group.colColor}`} />
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${group.colColor}`}>
                  {group.config.label}
                </span>
                <span className="ml-auto rounded-md border border-border/50 bg-card/80 px-2 py-0.5 text-xs font-black tabular-nums text-muted-foreground">
                  {group.items.length}
                </span>
              </div>
            </div>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[20%] text-[11px] font-black uppercase tracking-wide">Takeoff / Job #</TableHead>
                  <TableHead className="w-[20%] text-[11px] font-black uppercase tracking-wide">Job</TableHead>
                  <TableHead className="w-[15%] text-[11px] font-black uppercase tracking-wide">Customer</TableHead>
                  <TableHead className="w-[8%] text-[11px] font-black uppercase tracking-wide">Branch</TableHead>
                  <TableHead className="w-[10%] text-[11px] font-black uppercase tracking-wide">Status</TableHead>
                  <TableHead className="w-[8%] text-[11px] font-black uppercase tracking-wide">Priority</TableHead>
                  <TableHead className="w-[9%] text-[11px] font-black uppercase tracking-wide">Need By</TableHead>
                  {isArchiveView ? (
                    <TableHead className="w-[10%] text-[11px] font-black uppercase tracking-wide">Archived</TableHead>
                  ) : (
                    <TableHead className="w-[10%] text-right text-[11px] font-black uppercase tracking-wide">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>{group.items.map(renderRow)}</TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
};

const KanbanView = ({
  columns,
  columnConfigs,
  onTransition,
  onReject,
  onArchive,
  onMarkMaterialsReceived,
  pendingId,
}: {
  columns: Map<string, BuildRequestEnriched[]>;
  columnConfigs: typeof COLUMN_CONFIGS;
  onTransition: (buildRequestId: string, newStatus: string) => void;
  onReject: (buildRequestId: string) => void;
  onArchive: (buildRequestId: string) => void;
  onMarkMaterialsReceived: (buildRequestId: string) => void;
  pendingId: string | null;
}) => {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dragSourceCol, setDragSourceCol] = useState<string | null>(null);

  const handleDragOver = (event: React.DragEvent, colId: string) => {
    if (dragSourceCol && !canMoveTo(dragSourceCol, colId)) {
      event.dataTransfer.dropEffect = "none";
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (event: React.DragEvent, colId: string) => {
    event.preventDefault();
    setDragOverCol(null);
    setDragSourceCol(null);
    const buildRequestId = event.dataTransfer.getData("text/plain");
    if (buildRequestId && dragSourceCol && canMoveTo(dragSourceCol, colId)) {
      onTransition(buildRequestId, colId);
    }
  };

  const isValidTarget = (colId: string) =>
    dragSourceCol !== null && canMoveTo(dragSourceCol, colId);

  const isInvalidTarget = (colId: string) =>
    dragSourceCol !== null && !canMoveTo(dragSourceCol, colId) && dragSourceCol !== colId;

  const STACKED_IDS = ["awaiting_signs", "materials_ready"];

  const renderColumn = (col: (typeof columnConfigs)[0]) => {
    const cards = columns.get(col.id) || [];
    const valid = isValidTarget(col.id);
    const invalid = isInvalidTarget(col.id);
    const isOver = dragOverCol === col.id;

    return (
      <div
        key={col.id}
        className={`flex h-full flex-col overflow-hidden rounded-lg border transition-all duration-200 ${
          valid && isOver
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : valid
            ? "border-primary/40 bg-primary/[0.02]"
            : invalid
            ? "border-border/30 opacity-40"
            : `${col.borderColor} ${col.bgColor}`
        }`}
        onDragOver={(event) => handleDragOver(event, col.id)}
        onDragLeave={handleDragLeave}
        onDrop={(event) => handleDrop(event, col.id)}
      >
        <div className={`shrink-0 rounded-t-lg border-b-2 border-border/50 px-3 py-2 ${col.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div className={`rounded-md border border-border/30 p-1 ${col.bgColor}`}>
                <col.icon className={`h-3.5 w-3.5 ${col.color}`} />
              </div>
              <span className={`truncate text-[10px] font-black uppercase tracking-widest ${col.color}`}>
                {col.shortLabel}
              </span>
            </div>
            <span className="shrink-0 rounded-md border-2 border-border/50 bg-card/80 px-2 py-0.5 text-xs font-black tabular-nums text-muted-foreground">
              {cards.length}
            </span>
          </div>
          {(() => {
            const totalTypeIII = cards.reduce((sum, request) => sum + (request.type_iii_count || 0), 0);
            const totalHStand = cards.reduce((sum, request) => sum + (request.hstand_count || 0), 0);
            if (totalTypeIII === 0 && totalHStand === 0) return null;
            return (
              <div className="mt-1.5 flex items-center gap-3 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                {totalTypeIII > 0 && <span>Type III: {totalTypeIII}</span>}
                {totalHStand > 0 && <span>H-Stands: {totalHStand}</span>}
              </div>
            );
          })()}
          {valid && (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-primary">
              <ChevronRight className="h-3 w-3" />
              DROP HERE
            </div>
          )}
          {invalid && dragSourceCol && (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60">
              <XCircle className="h-3 w-3" />
              NOT ALLOWED
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {cards.length === 0 ? (
              <div className={`rounded-md border border-dashed py-6 text-center transition-colors ${valid && isOver ? "border-primary/40 bg-primary/5" : "border-border/30"}`}>
                <Wrench className="mx-auto mb-1 h-4 w-4 text-muted-foreground/30" />
                <p className="text-[10px] font-medium text-muted-foreground/50">
                  {valid && isOver ? "Drop here" : "No requests"}
                </p>
              </div>
            ) : (
              cards.map((request) => (
                <BuildRequestCard
                  key={request.id}
                  request={request}
                  col={col}
                  onTransition={onTransition}
                  onReject={onReject}
                  onArchive={onArchive}
                  onMarkMaterialsReceived={onMarkMaterialsReceived}
                  setDragSourceCol={setDragSourceCol}
                  onDragEnd={() => {
                    setDragSourceCol(null);
                    setDragOverCol(null);
                  }}
                  pending={pendingId === request.id}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const stackedCols = columnConfigs.filter((column) => STACKED_IDS.includes(column.id));
  const firstStackedIdx = columnConfigs.findIndex((column) => STACKED_IDS.includes(column.id));

  const elements: React.ReactNode[] = [];
  for (let index = 0; index < columnConfigs.length; index += 1) {
    const column = columnConfigs[index];
    if (index === firstStackedIdx) {
      elements.push(
        <div key="stacked-pair" className="flex h-full min-h-0 w-[280px] min-w-[280px] shrink-0 flex-col gap-2">
          {stackedCols.map((stackedColumn) => (
            <div key={stackedColumn.id} className="flex min-h-0 flex-1 flex-col">
              {renderColumn(stackedColumn)}
            </div>
          ))}
        </div>
      );
    } else if (!STACKED_IDS.includes(column.id)) {
      elements.push(
        <div key={column.id} className="flex h-full w-[280px] min-w-[280px] shrink-0 flex-col">
          {renderColumn(column)}
        </div>
      );
    }
  }

  return (
    <div className="flex h-full min-h-0 items-stretch gap-3 overflow-x-auto pb-4">
      {elements}
    </div>
  );
};

const BuildRequestCard = ({
  request,
  col,
  onTransition,
  onReject,
  onArchive,
  onMarkMaterialsReceived,
  setDragSourceCol,
  onDragEnd,
  pending,
}: {
  request: BuildRequestEnriched;
  col: (typeof COLUMN_CONFIGS)[0];
  onTransition: (buildRequestId: string, newStatus: string) => void;
  onReject: (buildRequestId: string) => void;
  onArchive: (buildRequestId: string) => void;
  onMarkMaterialsReceived: (buildRequestId: string) => void;
  setDragSourceCol: (status: string) => void;
  onDragEnd: () => void;
  pending: boolean;
}) => {
  const nextStatuses = VALID_TRANSITIONS[request.status] || [];
  const isArchived = Boolean(request.archived_at);
  const isReadOnly = isArchived;
  const isOverdue = !isArchived && Boolean(request.takeoff_needed_by && new Date(request.takeoff_needed_by) <= new Date());
  const showMarkReceived = !isReadOnly && request.status === "awaiting_signs" && !request.materials_received;
  const urgency = getUrgency(request.takeoff_needed_by);
  const readiness = getReadiness(request);
  const readinessConf = READINESS_CONFIG[readiness];
  const sizeClass = getSizeClass(request.item_count || 0);
  const forwardTargets = isReadOnly
    ? []
    : nextStatuses.filter((status) => !(status === "materials_ready" && !request.materials_received));
  const canAdvance = forwardTargets.length > 0;
  const canArchive = request.status === "completed" && !isArchived;

  return (
    <div
      className={`group min-w-0 overflow-hidden rounded-lg border-2 bg-card shadow-sm transition-all hover:shadow-lg ${
        URGENCY_BORDER[urgency]
      } ${
        isReadOnly ? "cursor-default opacity-80" : "cursor-grab active:cursor-grabbing"
      } ${
        request.status === "awaiting_signs" && request.signs_ready_at
          ? "border-emerald-500 ring-2 ring-emerald-500/30"
          : isOverdue
          ? "border-destructive/50 ring-2 ring-destructive/20"
          : isArchived
          ? "border-muted"
          : "border-border"
      }`}
      draggable={!isReadOnly}
      onDragStart={(event) => {
        if (isReadOnly) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/plain", request.id);
        event.dataTransfer.effectAllowed = "move";
        setDragSourceCol(request.status);
        (event.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(event) => {
        (event.currentTarget as HTMLElement).style.opacity = "1";
        onDragEnd();
      }}
    >
      {isArchived && (
        <div className="flex items-center gap-2 rounded-t-lg border-b-2 border-border/30 bg-muted px-4 py-1.5">
          <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
            ARCHIVED {request.archived_at ? formatShortDate(request.archived_at) : ""}
          </span>
        </div>
      )}

      {request.status === "awaiting_signs" && request.signs_ready_at && (
        <div className="flex items-center gap-2 rounded-t-lg border-b-2 border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="text-xs font-black uppercase tracking-wide text-emerald-600">SIGNS READY</span>
        </div>
      )}

      {isOverdue && !(request.status === "awaiting_signs" && request.signs_ready_at) && (
        <div className="flex items-center gap-2 rounded-t-lg border-b-2 border-destructive/30 bg-destructive/10 px-4 py-1.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="text-xs font-black uppercase tracking-wide text-destructive">OVERDUE</span>
        </div>
      )}

      {(request.revision_number || 1) > 1 && (
        <div className="flex items-center gap-2 rounded-t-lg border-b-2 border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
          <RefreshCw className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="text-xs font-black uppercase tracking-wide text-amber-600">REVISION {request.revision_number}</span>
        </div>
      )}

      <div className="p-3">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {(() => {
            const urgencyBadge: Record<UrgencyLevel, { label: string; className: string } | null> = {
              critical: { label: "CRITICAL", className: "bg-destructive/15 text-destructive border-destructive/40 font-black" },
              high: { label: "HIGH", className: "bg-orange-500/10 text-orange-700 border-orange-500/30 font-bold" },
              upcoming: { label: "UPCOMING", className: "bg-amber-500/10 text-amber-700 border-amber-500/30 font-bold" },
              normal: null,
              none: null,
            };
            const badge = urgencyBadge[urgency];
            return badge ? (
              <Badge className={`h-5 rounded-sm px-2 text-[10px] ${badge.className}`}>{badge.label}</Badge>
            ) : null;
          })()}
          <Badge variant="outline" className={`h-5 rounded-sm px-2 text-[10px] font-bold ${col.bgColor} ${col.color} border-border/40`}>
            {col.shortLabel}
          </Badge>
          <Badge variant="outline" className={`h-5 rounded-sm px-2 text-[10px] font-bold ${readinessConf.className}`}>
            {readinessConf.label}
          </Badge>
        </div>

        <div className="mb-2 flex items-start justify-between">
          <p className="pr-2 text-sm font-black uppercase leading-snug text-foreground transition-colors hover:text-primary">
            {request.takeoff_title || "Untitled Takeoff"}
          </p>
          {!isReadOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {forwardTargets.map((targetStatus) => {
                  const conf = getStatusConfig(targetStatus);
                  const Icon = STATUS_ICONS[conf.icon] || Wrench;
                  return (
                    <DropdownMenuItem key={targetStatus} onClick={() => onTransition(request.id, targetStatus)}>
                      <Icon className="mr-2 h-4 w-4" />
                      Move to {conf.label}
                    </DropdownMenuItem>
                  );
                })}
                {showMarkReceived && <DropdownMenuSeparator />}
                {showMarkReceived && (
                  <DropdownMenuItem onClick={() => onMarkMaterialsReceived(request.id)}>
                    <Package className="mr-2 h-4 w-4" />
                    Mark Materials Received
                  </DropdownMenuItem>
                )}
                {canArchive && <DropdownMenuSeparator />}
                {canArchive && (
                  <DropdownMenuItem onClick={() => onArchive(request.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    Mark Picked Up / Archive
                  </DropdownMenuItem>
                )}
                {request.status !== "completed" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onReject(request.id)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Request
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="space-y-1">
          <DottedRow label="ETC JOB #" value={request.etc_job_number || "—"} highlight={Boolean(request.etc_job_number)} />
          <DottedRow label="BRANCH" value={request.etc_branch || request.branch || "—"} />
          <DottedRow label="JOB" value={request.job_name || "—"} />
          <DottedRow label="CUSTOMER" value={request.customer_name || "—"} />
          <DottedRow label="OWNER" value={request.project_owner || "—"} />
          <DottedRow label="NEED BY" value={formatShortDate(request.takeoff_needed_by)} highlight={Boolean(request.takeoff_needed_by)} />
        </div>

        <div className="mt-2 flex items-center gap-2 border-t border-border/30 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <span>{request.item_count || 0} signs</span>
          {(request.structure_count || 0) > 0 && <span>· {request.structure_count} structures</span>}
          <Badge variant="outline" className={`h-4 px-1.5 text-[9px] ${(() => {
            const conf = {
              SMALL: "bg-muted text-muted-foreground border-border",
              MEDIUM: "bg-amber-500/10 text-amber-700 border-amber-500/30",
              LARGE: "bg-orange-500/10 text-orange-700 border-orange-500/30",
            };
            return conf[sizeClass];
          })()}`}>
            {sizeClass === "SMALL" ? "SM" : sizeClass === "MEDIUM" ? "MED" : "LG"}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t-2 border-border/30 pt-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-black uppercase tracking-wide"
            onClick={() =>
              request.work_order_id
                ? window.open(`/l/jobs/${request.job_id}/work-orders/view/${request.work_order_id}`, "_self")
                : window.open(`/l/${request.job_id}/takeoffs/view/${request.takeoff_id}`, "_self")
            }
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {request.work_order_id ? "Open WO" : "Open Takeoff"}
          </Button>

          {showMarkReceived && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-emerald-500/40 text-xs font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-500/10"
              onClick={() => onMarkMaterialsReceived(request.id)}
            >
              <Package className="h-3.5 w-3.5" />
              Mark Materials Received
            </Button>
          )}

          {canArchive && (
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1.5 text-xs font-black uppercase tracking-wide"
              onClick={() => onArchive(request.id)}
            >
              <Archive className="h-3.5 w-3.5" />
              Mark Picked Up
            </Button>
          )}

          {canAdvance && !canArchive && (
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1.5 text-xs font-black uppercase tracking-wide"
              onClick={() => onTransition(request.id, forwardTargets[0])}
            >
              {getStatusConfig(forwardTargets[0]).label}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const DottedRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex items-baseline gap-1.5 text-xs leading-relaxed">
    <span className="shrink-0 font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="min-w-[8px] flex-1 translate-y-[-2px] border-b border-dotted border-muted-foreground/30" />
    <span className={`shrink-0 text-right font-bold ${highlight ? "text-primary" : value === "—" ? "text-muted-foreground/40" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);
