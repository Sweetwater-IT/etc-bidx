"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardList, Download, Send, Edit, FileText, ArrowRight } from "lucide-react";
import { MPTSignConfiguration, type MPTSignRow } from "@/components/MPTSignConfiguration";

interface Props {
  jobId: string;
  takeoffId: string;
  isViewMode?: boolean;
}

const WORK_TYPES = [
  { value: "MPT", label: "MPT (Maintenance & Protection of Traffic)" },
  { value: "PERMANENT_SIGNS", label: "Permanent Signs" },
  { value: "FLAGGING", label: "Flagging" },
  { value: "LANE_CLOSURE", label: "Lane Closure" },
  { value: "SERVICE", label: "Service" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "RENTAL", label: "Rental" },
];

export default function TakeoffViewContent({ jobId, takeoffId, isViewMode = false }: Props) {
  const router = useRouter();
  const { data: dbJob, isLoading } = useJobFromDB(jobId);
  const info = dbJob?.projectInfo;

  const [takeoff, setTakeoff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const formattedWorkOrderNumber = (() => {
    const raw = takeoff?.work_order_number;
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return String(raw);
    return String(Math.trunc(n)).padStart(3, '0');
  })();

  // Load takeoff data
  useEffect(() => {
    const loadTakeoff = async () => {
      try {
        console.log('Loading takeoff with ID:', takeoffId);
        const response = await fetch(`/api/takeoffs/${takeoffId}`);
        console.log('API response status:', response.status);
        console.log('API response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('API error response:', errorText);
          throw new Error(`Failed to load takeoff: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('API response data:', data);
        setTakeoff(data);
      } catch (error) {
        console.error('Error loading takeoff:', error);
        toast.error('Failed to load takeoff');
      } finally {
        setLoading(false);
      }
    };

    if (takeoffId) {
      loadTakeoff();
    }
  }, [takeoffId]);

  const handleEdit = () => {
    const resolvedJobId = takeoff?.job_id ?? jobId;
    const resolvedTakeoffId = takeoff?.id ?? takeoffId;

    if (!resolvedJobId || !resolvedTakeoffId) {
      toast.error('Unable to open edit view. Missing takeoff details.');
      return;
    }

    router.push(`/l/${resolvedJobId}/takeoffs/edit/${resolvedTakeoffId}`);
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const response = await fetch(`/api/takeoffs/${takeoffId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `takeoff-${takeoff?.title || 'untitled'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCreateWorkOrder = async () => {
    setLoading(true);
    try {
      const woResponse = await fetch(`/api/workorders/from-takeoff/${takeoffId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: 'unknown@example.com' // You might want to get this from auth context
        })
      });

      if (woResponse.ok) {
        const result = await woResponse.json();
        toast.success('Work order generated successfully!');
        router.push(`/l/jobs/${jobId}/work-orders/${result.workOrder.id}/edit`);
      } else {
        const err = await woResponse.json();
        toast.error(err.error || 'Failed to generate work order');
      }
    } catch (error) {
      console.error("Error generating work order:", error);
      toast.error("Failed to generate work order");
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
        <div className="w-full px-6 py-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading takeoff...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!takeoff) {
    return (
      <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
        <div className="w-full px-6 py-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Takeoff not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 flex-1 overflow-x-auto">
      <div className="space-y-6">

      {/* Project Info */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Information</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Branch</span>
              <span className="text-sm font-medium">{dbJob?.etc_branch || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Project Manager</span>
              <span className="text-sm font-medium">{dbJob?.etc_project_manager || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Job #</span>
              <span className="text-sm font-medium font-mono">{info?.etcJobNumber || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">County</span>
              <span className="text-sm font-medium">{info?.county || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer</span>
              <span className="text-sm font-medium">{info?.customerName || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer PM / POC</span>
              <span className="text-sm font-medium">{info?.customerPM || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer Job #</span>
              <span className="text-sm font-medium">{info?.customerJobNumber || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Owner</span>
              <span className="text-sm font-medium">{info?.projectOwner || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Owner Contract #</span>
              <span className="text-sm font-medium">{info?.contractNumber || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Takeoff Details */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Takeoff Details</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-xs">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Takeoff Title</Label>
              <div className="text-sm font-medium">{takeoff.title}</div>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Type</Label>
              <div className="text-sm font-medium">{WORK_TYPES.find(wt => wt.value === takeoff.work_type)?.label || takeoff.work_type}</div>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Order #</Label>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium font-mono">{formattedWorkOrderNumber || "—"}</div>
                {takeoff.work_order_id && (
                  <button
                    onClick={() => router.push(`/l/jobs/${jobId}/work-orders/${takeoff.work_order_id}/view`)}
                    className="text-primary hover:text-primary/80 transition-colors p-1 rounded hover:bg-primary/10"
                    title="View Work Order"
                    type="button"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Contracted / Additional</Label>
              <div className="text-sm font-medium capitalize">{takeoff.contracted_or_additional}</div>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Install Date</Label>
              <div className="text-sm font-medium">{takeoff.install_date || "—"}</div>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Pick Up Date</Label>
              <div className="text-sm font-medium">{takeoff.pickup_date || "—"}</div>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Needed By Date</Label>
              <div className="text-sm font-medium">{takeoff.needed_by_date || "—"}</div>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Priority</Label>
              <div className="text-sm font-medium capitalize">{takeoff.priority}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Type Specific Content */}
      {takeoff.work_type && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {WORK_TYPES.find(wt => wt.value === takeoff.work_type)?.label} Configuration
            </h2>
          </div>
          <div className="p-5 overflow-x-auto">
            {takeoff.work_type === "MPT" && (
              <MPTSignConfiguration
                activeSections={takeoff.active_sections || []}
                signRows={takeoff.sign_rows || {}}
                defaultSignMaterial={takeoff.default_sign_material || 'PLASTIC'}
                onToggleSection={() => {}} // Read-only
                onSignRowsChange={() => {}} // Read-only
                onDefaultMaterialChange={() => {}} // Read-only
                onApplyMaterialToAll={() => {}} // Read-only
                disabled={true}
              />
            )}

            {takeoff.work_type === "PERMANENT_SIGNS" && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Permanent signs configuration would be displayed here.</p>
                </div>
              </div>
            )}

            {(takeoff.work_type === "FLAGGING" || takeoff.work_type === "LANE_CLOSURE") && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Vehicle and equipment configuration would be displayed here.</p>
                </div>
              </div>
            )}

            {(takeoff.work_type === "SERVICE" || takeoff.work_type === "DELIVERY" || takeoff.work_type === "RENTAL") && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Additional items configuration would be displayed here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {(takeoff.notes || takeoff.crew_notes || takeoff.build_shop_notes || takeoff.pm_notes) && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</h2>
          </div>
          <div className="p-5 space-y-4">
            {takeoff.crew_notes && (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Crew Notes</Label>
                <div className="text-sm">{takeoff.crew_notes}</div>
                <span className="text-[10px] text-muted-foreground mt-1 block">Visible to road crew on dispatches</span>
              </div>
            )}
            {takeoff.build_shop_notes && (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Build Shop Notes</Label>
                <div className="text-sm">{takeoff.build_shop_notes}</div>
                <span className="text-[10px] text-muted-foreground mt-1 block">Sent with the build request submission</span>
              </div>
            )}
            {takeoff.pm_notes && (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">PM Notes</Label>
                <div className="text-sm">{takeoff.pm_notes}</div>
                <span className="text-[10px] text-muted-foreground mt-1 block">Private notes for your reference only</span>
              </div>
            )}
            {takeoff.notes && (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">General Notes</Label>
                <div className="text-sm">{takeoff.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
    </div>
  );
}
