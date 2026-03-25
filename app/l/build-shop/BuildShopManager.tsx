"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionCards } from "@/components/section-cards";
import {
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Hammer,
  Loader2,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

type ViewMode = "board" | "list" | "archive";

type BuildRequest = {
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

const STATUS_ORDER = [
  "new",
  "under_review",
  "awaiting_signs",
  "materials_ready",
  "build_queue",
  "in_build",
  "ready_for_pm",
  "completed",
] as const;

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  under_review: "Under Review",
  awaiting_signs: "Awaiting Signs",
  materials_ready: "Materials Ready",
  build_queue: "Build Queue",
  in_build: "In Build",
  ready_for_pm: "Ready for PM",
  completed: "Completed",
  rejected: "Rejected",
  superseded: "Superseded",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-violet-50 text-violet-700 border-violet-200",
  awaiting_signs: "bg-orange-50 text-orange-700 border-orange-200",
  materials_ready: "bg-teal-50 text-teal-700 border-teal-200",
  build_queue: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_build: "bg-amber-50 text-amber-700 border-amber-200",
  ready_for_pm: "bg-cyan-50 text-cyan-700 border-cyan-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  superseded: "bg-slate-100 text-slate-700 border-slate-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  standard: "bg-slate-100 text-slate-700 border-slate-200",
  low: "bg-slate-50 text-slate-500 border-slate-200",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nextStatus(status: string) {
  const index = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
  if (index === -1 || index === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[index + 1];
}

function isOverdue(neededByDate: string | null) {
  if (!neededByDate) return false;
  const date = new Date(neededByDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export default function BuildShopManager() {
  const [requests, setRequests] = useState<BuildRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadRequests = useCallback(async (mode: ViewMode, options?: { background?: boolean }) => {
    const isArchive = mode === "archive";
    if (options?.background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch(`/api/l/build-requests?archived=${isArchive ? "true" : "false"}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load build requests");
      }

      setRequests(result.data || []);
    } catch (error) {
      console.error("Error loading build requests:", error);
      toast.error("Failed to load build shop requests");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(viewMode);
  }, [loadRequests, viewMode]);

  const branches = useMemo(() => {
    return [...new Set(requests.map((request) => request.etc_branch).filter(Boolean))].sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (branchFilter !== "all" && request.etc_branch !== branchFilter) {
        return false;
      }
      if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }
      if (!search.trim()) {
        return true;
      }

      const query = search.trim().toLowerCase();
      return [
        request.takeoff_title,
        request.job_name,
        request.customer_name,
        request.etc_job_number,
        request.wo_number || "",
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [branchFilter, requests, search, statusFilter]);

  const groupedRequests = useMemo(() => {
    return STATUS_ORDER.reduce<Record<string, BuildRequest[]>>((accumulator, status) => {
      accumulator[status] = filteredRequests.filter((request) => request.status === status);
      return accumulator;
    }, {});
  }, [filteredRequests]);

  const stats = useMemo(() => {
    return {
      total: filteredRequests.length,
      newCount: filteredRequests.filter((request) => request.status === "new").length,
      inBuild: filteredRequests.filter((request) => request.status === "in_build").length,
      readyForPm: filteredRequests.filter((request) => request.status === "ready_for_pm").length,
      totalSigns: filteredRequests.reduce((sum, request) => sum + (request.item_count || 0), 0),
    };
  }, [filteredRequests]);

  const updateRequest = useCallback(
    async (requestId: string, payload: Record<string, unknown>) => {
      setPendingId(requestId);

      try {
        const response = await fetch(`/api/l/build-requests/${requestId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update build request");
        }

        await loadRequests(viewMode, { background: true });
      } catch (error) {
        console.error("Error updating build request:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update build request");
      } finally {
        setPendingId(null);
      }
    },
    [loadRequests, viewMode]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Build Shop</h1>
          <p className="text-sm text-muted-foreground">
            Production workflow for `_l` takeoffs and work orders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border p-1">
            {([
              ["board", "Board"],
              ["list", "List"],
              ["archive", "Archive"],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                variant={viewMode === value ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRequests(viewMode, { background: true })}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <SectionCards
        data={[
          { title: "Requests", value: String(stats.total) },
          { title: "New", value: String(stats.newCount) },
          { title: "In Build", value: String(stats.inBuild) },
          { title: "Ready For PM", value: String(stats.readyForPm) },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search takeoffs, jobs, customers, ETC job #..."
            className="pl-9"
          />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_ORDER.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === "board" ? (
        <div className="grid gap-4 xl:grid-cols-4">
          {STATUS_ORDER.filter((status) => status !== "completed").map((status) => (
            <div key={status} className="flex min-h-[420px] flex-col rounded-xl border bg-card">
              <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Hammer className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{STATUS_LABELS[status]}</p>
                  </div>
                  <Badge variant="outline">{groupedRequests[status]?.length || 0}</Badge>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
                {(groupedRequests[status] || []).length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    No requests
                  </div>
                ) : (
                  groupedRequests[status].map((request) => (
                    <BuildRequestCard
                      key={request.id}
                      request={request}
                      pending={pendingId === request.id}
                      onAdvance={() => {
                        const next = nextStatus(request.status);
                        if (next) {
                          updateRequest(request.id, { status: next });
                        }
                      }}
                      onMarkMaterialsReceived={() =>
                        updateRequest(request.id, {
                          materials_received: true,
                          status: "materials_ready",
                        })
                      }
                      onArchive={() => updateRequest(request.id, { archive: true })}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === "archive" ? "Archived Build Requests" : "Build Requests"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Takeoff</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Need By</TableHead>
                  <TableHead>WO</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No build requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => {
                    const next = nextStatus(request.status);
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{request.takeoff_title || "Untitled takeoff"}</span>
                            <span className="text-xs text-muted-foreground">
                              {request.etc_job_number || "No ETC job #"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{request.job_name || "—"}</TableCell>
                        <TableCell>{request.etc_branch || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_STYLES[request.status]}>
                            {STATUS_LABELS[request.status] || request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.standard}>
                            {request.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(request.takeoff_needed_by)}</TableCell>
                        <TableCell>{request.wo_number || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {next && viewMode !== "archive" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingId === request.id}
                                onClick={() => updateRequest(request.id, { status: next })}
                              >
                                Next
                              </Button>
                            )}
                            {request.status === "awaiting_signs" && !request.materials_received && viewMode !== "archive" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingId === request.id}
                                onClick={() =>
                                  updateRequest(request.id, {
                                    materials_received: true,
                                    status: "materials_ready",
                                  })
                                }
                              >
                                Materials Received
                              </Button>
                            )}
                            {request.status === "completed" && viewMode !== "archive" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingId === request.id}
                                onClick={() => updateRequest(request.id, { archive: true })}
                              >
                                Archive
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BuildRequestCard({
  request,
  pending,
  onAdvance,
  onMarkMaterialsReceived,
  onArchive,
}: {
  request: BuildRequest;
  pending: boolean;
  onAdvance: () => void;
  onMarkMaterialsReceived: () => void;
  onArchive: () => void;
}) {
  const next = nextStatus(request.status);
  const overdue = isOverdue(request.takeoff_needed_by);

  return (
    <Card className={overdue ? "border-red-200" : ""}>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="font-medium leading-tight">{request.takeoff_title || "Untitled takeoff"}</p>
            <p className="text-xs text-muted-foreground">
              {request.etc_job_number || "No ETC job #"} · {request.job_name || "No job name"}
            </p>
          </div>
          <Badge variant="outline" className={STATUS_STYLES[request.status]}>
            {STATUS_LABELS[request.status] || request.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.standard}>
            {request.priority}
          </Badge>
          <Badge variant="outline">
            {request.item_count} items
          </Badge>
          {request.structure_count > 0 && (
            <Badge variant="outline">{request.structure_count} structures</Badge>
          )}
          {request.any_order_required && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Order required
            </Badge>
          )}
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Branch: {request.etc_branch || "—"}</p>
          <p>Customer: {request.customer_name || "—"}</p>
          <p>Need By: {formatDate(request.takeoff_needed_by)}</p>
          <p>WO: {request.wo_number || "—"}</p>
          {request.takeoff_build_shop_notes && (
            <p className="line-clamp-3 text-xs">{request.takeoff_build_shop_notes}</p>
          )}
        </div>

        {overdue && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Overdue
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/l/${request.job_id}/takeoffs/view/${request.takeoff_id}`}>
              View Takeoff
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
          {request.work_order_id && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/l/jobs/${request.job_id}/work-orders/view/${request.work_order_id}`}>
                View WO
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-3">
          {request.status === "awaiting_signs" && !request.materials_received && (
            <Button size="sm" variant="outline" onClick={onMarkMaterialsReceived} disabled={pending}>
              <Package className="mr-2 h-4 w-4" />
              Materials Received
            </Button>
          )}
          {next && (
            <Button size="sm" onClick={onAdvance} disabled={pending}>
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="mr-2 h-4 w-4" />
              )}
              Move to {STATUS_LABELS[next]}
            </Button>
          )}
          {request.status === "completed" && (
            <Button size="sm" variant="outline" onClick={onArchive} disabled={pending}>
              Archive
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
