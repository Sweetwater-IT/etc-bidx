"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardList, Download, Send, Edit, FileText, ArrowRight, Loader2, Upload, Trash2, Package, Plus } from "lucide-react";
import { MPTSignConfiguration, type MPTSignRow } from "@/components/MPTSignConfiguration";
import { PermanentSignConfiguration } from "@/components/PermanentSignConfiguration";
import { ReturnInventoryCard } from "@/app/l/components/ReturnInventoryCard";

interface Props {
  jobId: string;
  takeoffId: string;
  isViewMode?: boolean;
}

const WORK_TYPES = [
  { value: "MPT", label: "MPT" },
  { value: "PERMANENT_SIGNS", label: "Permanent Sign" },
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
        router.push(`/l/jobs/${jobId}/work-orders/edit/${result.workOrder.id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-16 flex items-center justify-center">
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
      <div className="min-h-screen bg-background">
        <div className="py-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Takeoff not found</p>
            <button
              onClick={() => router.push(`/l/${jobId}`)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Go back to job
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Construct jobInfo for ReturnInventoryCard
  const jobInfo = {
    title: takeoff.title || "Pickup Return",
    workType: takeoff.work_type || "",
    projectName: info?.projectName || undefined,
    etcJobNumber: info?.etcJobNumber?.toString() || undefined,
    etcBranch: dbJob?.etc_branch || undefined,
    etcProjectManager: dbJob?.etc_project_manager || undefined,
    customerName: info?.customerName || undefined,
    customerJobNumber: info?.customerJobNumber || undefined,
    projectOwner: info?.projectOwner || undefined,
    county: info?.county || undefined,
    installDate: takeoff.install_date || undefined,
    pickupDate: takeoff.pickup_date || undefined,
    customerPM: info?.customerPM || undefined,
    assignedTo: takeoff.assigned_to || undefined,
    contractedOrAdditional: takeoff.contracted_or_additional || undefined,
  };

  // Separate takeoff items by category
  const signItems = Array.isArray(takeoff.takeoff_items)
    ? takeoff.takeoff_items.filter((item: any) => item.category === 'sign' || !item.category)
    : [];
  const vehicleItems = Array.isArray(takeoff.takeoff_items)
    ? takeoff.takeoff_items.filter((item: any) => item.category === 'vehicle')
    : [];
  const additionalItems = Array.isArray(takeoff.takeoff_items)
    ? takeoff.takeoff_items.filter((item: any) => item.category !== 'sign' && item.category !== 'vehicle')
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Pickup Takeoff Banner */}
      {takeoff.is_pickup && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
              <span className="text-xs font-bold text-amber-800">!</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800">Pickup Takeoff</h3>
              <p className="text-xs text-amber-700">
                This takeoff was auto-generated from the parent work order and cannot be modified. Use the Return Inventory section below to log item conditions.
              </p>
            </div>
          </div>
        </div>
      )}

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
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Takeoff Title</span>
              <span className="text-sm font-medium">{takeoff.title || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Type</span>
              <span className="text-sm font-medium">{WORK_TYPES.find((wt) => wt.value === takeoff.work_type)?.label || takeoff.work_type || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Order #</span>
              {formattedWorkOrderNumber ? (
                <span className="text-sm font-medium font-mono">{formattedWorkOrderNumber}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Not assigned</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Contracted / Additional</span>
              <span className="text-sm font-medium">{takeoff.contracted_or_additional === "contracted" ? "Contracted Work" : "Additional Work"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Install Date</span>
              <span className="text-sm font-medium">{takeoff.install_date || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Pick Up Date</span>
              <span className="text-sm font-medium">{takeoff.pickup_date || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Needed By Date</span>
              <span className="text-sm font-medium">{takeoff.needed_by_date || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Priority</span>
              <span className="text-sm font-medium capitalize">{takeoff.priority || "standard"}</span>
            </div>
          </div>
        </div>
      </div>



      {/* ─── Vehicles Card — For flagging and lane closure work types ─── */}
      {(takeoff.work_type === "FLAGGING" || takeoff.work_type === "LANE_CLOSURE") && (
        <div className="rounded-xl border bg-card p-4 overflow-x-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Vehicles
            </h2>
            <Badge variant="secondary" className="text-[10px]">{vehicleItems.length} vehicles</Badge>
          </div>

          {vehicleItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm" style={{ tableLayout: 'fixed' }}>
                <thead className="bg-muted/70">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-64">Type</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vehicleItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/10">
                      <td className="px-2 py-1 w-64 text-xs font-medium">{item.vehicleType || item.product_name || '—'}</td>
                      <td className="px-2 py-1 w-32 text-xs tabular-nums">{item.quantity || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No vehicles assigned. Vehicles will appear here when the takeoff is created.
            </div>
          )}
        </div>
      )}

      {/* ─── Takeoff Items Card — Sign designations from takeoff ─── */}
      <div className="rounded-xl border bg-card p-4 overflow-x-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Takeoff Items
          </h2>
          <Badge variant="secondary" className="text-[10px]">{signItems.length} sign items</Badge>
        </div>

        {signItems.length > 0 ? (
          <div className="overflow-x-auto">
            {takeoff.work_type === "PERMANENT_SIGNS" ? (
              // Permanent Signs Table
              <table className="w-full min-w-[1000px] text-sm" style={{ tableLayout: 'fixed' }}>
                <thead className="bg-muted/70">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Designation</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-96">Legend</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-28">Dimensions</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-24">Sheeting</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Qty</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-24">Post Size</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Plan Sheet</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Sq Ft</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {signItems.map((item: any) => {
                    // Extract sign details from the jsonb field
                    const signDetails = item.sign_details || {};
                    return (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="px-2 py-1 w-32 text-xs font-medium">{signDetails.signDesignation || item.product_name || '—'}</td>
                        <td className="px-2 py-1 w-96 text-xs">{signDetails.signLegend || item.description || '—'}</td>
                        <td className="px-2 py-1 w-28 text-xs">{signDetails.dimensionLabel || (item.width_inches && item.height_inches ? `${item.width_inches}" x ${item.height_inches}"` : '—')}</td>
                        <td className="px-2 py-1 w-24 text-xs">{signDetails.sheeting || item.sheeting || '—'}</td>
                        <td className="px-2 py-1 w-32 text-xs tabular-nums">{item.quantity || 1}</td>
                        <td className="px-2 py-1 w-24 text-xs">{signDetails.postSize || '—'}</td>
                        <td className="px-2 py-1 w-32 text-xs">
                          {signDetails.planSheetNum && signDetails.planSheetTotal ? `${signDetails.planSheetNum}/${signDetails.planSheetTotal}` : '—'}
                        </td>
                        <td className="px-2 py-1 w-32 text-xs font-medium tabular-nums text-right">{item.total_sqft ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              // MPT Signs Table
              <table className="w-full min-w-[1100px] text-sm" style={{ tableLayout: 'fixed' }}>
                <thead className="bg-muted/70">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Designation</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-96">Legend</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-28">Dimensions</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-24">Sheeting</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Qty</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-40">Structure</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-24">B-Lights</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Sq Ft</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-24">Material</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-16">Cover</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {signItems.map((item: any) => {
                    // Extract sign details from the jsonb field
                    const signDetails = item.sign_details || {};
                    return (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="px-2 py-1 w-32 text-xs font-medium">{signDetails.signDesignation || item.product_name || '—'}</td>
                        <td className="px-2 py-1 w-96 text-xs">{signDetails.signLegend || item.description || '—'}</td>
                        <td className="px-2 py-1 w-28 text-xs">{signDetails.dimensionLabel || (item.width_inches && item.height_inches ? `${item.width_inches}" x ${item.height_inches}"` : '—')}</td>
                        <td className="px-2 py-1 w-24 text-xs">{signDetails.sheeting || item.sheeting || '—'}</td>
                        <td className="px-2 py-1 w-32 text-xs tabular-nums">{item.quantity || 1}</td>
                        <td className="px-2 py-1 w-40 text-xs">{signDetails.structureType || item.structure_type || '—'}</td>
                        <td className="px-2 py-1 w-24 text-xs">{signDetails.bLights || item.b_lights || 'none'}</td>
                        <td className="px-2 py-1 w-32 text-xs font-medium tabular-nums text-right">{item.total_sqft ?? '—'}</td>
                        <td className="px-2 py-1 w-24 text-xs">{signDetails.material || item.material || '—'}</td>
                        <td className="px-2 py-1 w-16 text-xs text-center">{signDetails.cover !== undefined ? (signDetails.cover ? '✓' : '—') : (item.cover ? '✓' : '—')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No takeoff items found. Sign designations will appear here when the takeoff is created.
          </div>
        )}
      </div>

      {/* ─── Additional Items Card — Custom items added to takeoff ─── */}
      <div className="rounded-xl border bg-card p-4 overflow-x-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            Additional Items
          </h2>
          <Badge variant="secondary" className="text-[10px]">{additionalItems.length} items</Badge>
        </div>

        {additionalItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-muted/70">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-48">Item</th>
                  <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Quantity</th>
                  <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-96">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {additionalItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="px-2 py-1 w-48 text-xs font-medium">{item.product_name || '—'}</td>
                    <td className="px-2 py-1 w-32 text-xs tabular-nums">{item.quantity || 1}</td>
                    <td className="px-2 py-1 w-96 text-xs">{item.description || item.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No additional items. Custom items added manually will appear here.
          </div>
        )}
      </div>

      {takeoff.is_pickup && takeoff.work_order_id && (
        <ReturnInventoryCard
          takeoffId={takeoffId}
          jobInfo={jobInfo}
        />
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
  );
}