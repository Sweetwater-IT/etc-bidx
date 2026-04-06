"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClipboardList, Download, Send, Edit, FileText, ArrowRight, Loader2, Upload, Trash2, Package, Plus, Lock } from "lucide-react";
import { MPTSignConfiguration, type MPTSignRow } from "@/components/MPTSignConfiguration";
import { PermanentSignConfiguration } from "@/components/PermanentSignConfiguration";
import { TakeoffViewCard } from "@/app/l/components/TakeoffViewCard";
import { ReturnInventoryCard } from "@/app/l/components/ReturnInventoryCard";
import type { SignMaterial } from "@/utils/signMaterial";
import { formatLocalDateForDisplay } from "@/lib/local-date";

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

const formatVehicleType = (vehicleType?: string | null) => {
  if (!vehicleType) {
    return "";
  }

  const vehicleTypeMap: Record<string, string> = {
    pickup_truck: "Pick Up Truck",
    message_board: "Message Board",
    arrow_panel: "Arrow Panel",
    speed_trailer: "Speed Trailer",
    tma: "TMA",
  };
  if (vehicleTypeMap[vehicleType]) {
    return vehicleTypeMap[vehicleType];
  }

  return vehicleType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatSqft = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TAKEOFF_PANEL_MAX_WIDTH_CLASS = "w-full max-w-[calc(100vw-272px-64px)] min-[1921px]:max-w-[calc(100vw-272px-24px)]";

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
        console.log('[TakeoffViewContent] Loading takeoff', { takeoffId, jobId, isViewMode });
        const response = await fetch(`/api/takeoffs/${takeoffId}`);
        console.log('[TakeoffViewContent] API response', { status: response.status, ok: response.ok });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[TakeoffViewContent] API error response', { errorText });
          throw new Error(`Failed to load takeoff: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('[TakeoffViewContent] Loaded takeoff payload', {
          id: data?.id,
          title: data?.title,
          workType: data?.work_type,
          isPickup: data?.is_pickup,
          takeoffItemsCount: Array.isArray(data?.takeoff_items) ? data.takeoff_items.length : 0,
          activeSections: data?.active_sections,
          vehicleItemsCount: Array.isArray(data?.vehicle_items) ? data.vehicle_items.length : 0,
          additionalItemsCount: Array.isArray(data?.additional_items) ? data.additional_items.length : 0,
        });
        setTakeoff(data);
      } catch (error) {
        console.error('[TakeoffViewContent] Error loading takeoff', error);
        toast.error('Failed to load takeoff');
      } finally {
        setLoading(false);
      }
    };

    if (takeoffId) {
      loadTakeoff();
    }
  }, [takeoffId, jobId, isViewMode]);



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
      console.log('[TakeoffViewContent] Generate work order clicked', {
        takeoffId,
        jobId,
        workType: takeoff?.work_type,
        title: takeoff?.title,
        takeoffItemCount: Array.isArray(takeoff?.takeoff_items) ? takeoff.takeoff_items.length : 0,
        additionalItemsCount: Array.isArray(takeoff?.additional_items) ? takeoff.additional_items.length : 0,
      });

      const woResponse = await fetch(`/api/workorders/from-takeoff/${takeoffId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: 'unknown@example.com' // You might want to get this from auth context
        })
      });

      console.log('[TakeoffViewContent] Generate work order response', {
        status: woResponse.status,
        ok: woResponse.ok,
      });

      if (woResponse.ok) {
        const result = await woResponse.json();
        console.log('[TakeoffViewContent] Generate work order success', result);
        toast.success('Work order generated successfully!');
        router.push(`/l/jobs/${jobId}/work-orders/edit/${result.workOrder.id}`);
      } else {
        const err = await woResponse.json();
        console.error('[TakeoffViewContent] Generate work order failed', err);
        toast.error(err.error || 'Failed to generate work order');
      }
    } catch (error) {
      console.error("[TakeoffViewContent] Error generating work order", error);
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
    projectOwner: info?.projectOwner || dbJob?.project_owner || undefined,
    county: info?.county || undefined,
    installDate: takeoff.install_date || undefined,
    pickupDate: takeoff.pickup_date || undefined,
    customerPM: info?.customerPM || undefined,
    assignedTo: takeoff.assigned_to || undefined,
    contractedOrAdditional: takeoff.contracted_or_additional || undefined,
  };

  // Separate takeoff items by category
  const vehicleItems = Array.isArray(takeoff.takeoff_items)
    ? takeoff.takeoff_items.filter((item: any) => item.category === 'vehicle')
    : [];
  const additionalItems = Array.isArray(takeoff.takeoff_items)
    ? takeoff.takeoff_items.filter((item: any) => item.category !== 'sign' && item.category !== 'vehicle')
    : [];

  const mptSquareFootageSummary = (() => {
    if (takeoff.work_type !== "MPT" || !takeoff.sign_rows) {
      return null;
    }

    const sectionLabelMap: Record<string, string> = {
      trailblazers: "Trailblazers / H-Stands",
      type_iii: "Type IIIs",
      sign_stands: "Sign Stands",
    };

    const sectionTotals: { label: string; signs: number; sqft: number }[] = [];
    let grandSigns = 0;
    let grandSqft = 0;

    const sectionKeys = Array.isArray(takeoff.active_sections) && takeoff.active_sections.length > 0
      ? takeoff.active_sections
      : Object.keys(takeoff.sign_rows || {});

    for (const sectionKey of sectionKeys) {
      let sectionSigns = 0;
      let sectionSqft = 0;

      for (const row of takeoff.sign_rows[sectionKey] || []) {
        if (!row?.signDesignation) continue;

        const quantity = Number(row.quantity || 0);
        const primarySqft =
          Number(row.totalSqft || 0) || Math.round(Number(row.sqft || 0) * quantity * 100) / 100;
        sectionSigns += quantity;
        sectionSqft += primarySqft;

        for (const sec of row.secondarySigns || []) {
          if (!sec?.signDesignation) continue;
          sectionSigns += quantity;
          sectionSqft += Math.round(Number(sec.sqft || 0) * quantity * 100) / 100;
        }
      }

      if (sectionSigns > 0) {
        const roundedSqft = Math.round(sectionSqft * 100) / 100;
        sectionTotals.push({
          label: sectionLabelMap[sectionKey] || sectionKey,
          signs: sectionSigns,
          sqft: roundedSqft,
        });
        grandSigns += sectionSigns;
        grandSqft += roundedSqft;
      }
    }

    if (grandSigns === 0) return null;

    return {
      items: sectionTotals,
      totalSigns: grandSigns,
      totalSqft: Math.round(grandSqft * 100) / 100,
    };
  })();

  const permanentSquareFootageSummary = (() => {
    if (
      takeoff.work_type !== "PERMANENT_SIGNS" ||
      !Array.isArray(takeoff.active_permanent_items) ||
      !takeoff.permanent_sign_rows
    ) {
      return null;
    }

    const itemTotals: { label: string; signs: number; sqft: number }[] = [];
    let grandSigns = 0;
    let grandSqft = 0;

    for (const itemNumber of takeoff.active_permanent_items) {
      let itemSigns = 0;
      let itemSqft = 0;

      for (const row of takeoff.permanent_sign_rows[itemNumber] || []) {
        if (!row?.signDesignation) continue;

        const quantity = Number(row.quantity || 0);
        itemSigns += quantity;
        itemSqft += Number(row.totalSqft || 0);

        for (const sec of row.secondarySigns || []) {
          if (!sec?.signDesignation) continue;
          itemSigns += quantity;
          itemSqft += Math.round(Number(sec.sqft || 0) * quantity * 100) / 100;
        }
      }

      if (itemSigns > 0) {
        const roundedSqft = Math.round(itemSqft * 100) / 100;
        itemTotals.push({
          label: itemNumber,
          signs: itemSigns,
          sqft: roundedSqft,
        });
        grandSigns += itemSigns;
        grandSqft += roundedSqft;
      }
    }

    if (grandSigns === 0) return null;

    return {
      items: itemTotals,
      totalSigns: grandSigns,
      totalSqft: Math.round(grandSqft * 100) / 100,
    };
  })();

  return (
    <div className="mx-auto w-full max-w-7xl min-[1921px]:max-w-[calc(100vw-272px-24px)] px-4 py-8 space-y-6">
      {/* Pickup Takeoff Banner */}
      {takeoff.is_pickup && (
        <div className="rounded-lg border px-4 py-3 flex items-center gap-3 text-sm bg-blue-50 border-blue-200 text-blue-800">
          <Lock className="h-4 w-4 shrink-0" />
          <div>
            <h3 className="font-semibold">Pickup Takeoff</h3>
            <p className="text-xs text-blue-700">
              This takeoff was auto-generated from the parent work order and cannot be modified. Use the Return Inventory section below to log item conditions.
            </p>
          </div>
        </div>
      )}

      {/* Project Info */}
      <TakeoffViewCard title="Project Information">
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
      </TakeoffViewCard>

      {/* Takeoff Details */}
      <TakeoffViewCard title="Takeoff Details">
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
              <button
                type="button"
                className="text-sm font-medium font-mono text-primary underline underline-offset-2 hover:text-primary/80"
                onClick={() => {
                  if (takeoff.work_order_id) {
                    router.push(`/l/jobs/${jobId}/work-orders/view/${takeoff.work_order_id}`);
                  }
                }}
              >
                {formattedWorkOrderNumber}
              </button>
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
            <span className="text-sm font-medium">
              {takeoff.install_date
                ? formatLocalDateForDisplay(takeoff.install_date, { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Pick Up Date</span>
            <span className="text-sm font-medium">
              {takeoff.pickup_date
                ? formatLocalDateForDisplay(takeoff.pickup_date, { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Needed By Date</span>
            <span className="text-sm font-medium">
              {takeoff.needed_by_date
                ? formatLocalDateForDisplay(takeoff.needed_by_date, { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Priority</span>
            <span className="text-sm font-medium capitalize">{takeoff.priority || "standard"}</span>
          </div>
        </div>
      </TakeoffViewCard>

      {takeoff.is_pickup && (
        <div className={TAKEOFF_PANEL_MAX_WIDTH_CLASS}>
          <ReturnInventoryCard takeoffId={takeoffId} jobInfo={jobInfo} />
        </div>
      )}


      {/* ─── Vehicles Card — For flagging and lane closure work types ─── */}
      {!takeoff.is_pickup && (takeoff.work_type === "FLAGGING" || takeoff.work_type === "LANE_CLOSURE") && (
        <div className={TAKEOFF_PANEL_MAX_WIDTH_CLASS}>
          <TakeoffViewCard title="Vehicles" icon={<Package />} badge={vehicleItems.length}>
          {vehicleItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm" style={{ tableLayout: 'fixed' }}>
                <thead className="bg-muted/70">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-64">Type</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-32">Quantity</th>
                    <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-96">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vehicleItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/10">
                      <td className="px-2 py-1 w-64 text-xs font-medium">{formatVehicleType(item.vehicleType) || item.product_name || '—'}</td>
                      <td className="px-2 py-1 w-32 text-xs tabular-nums">{item.quantity || 1}</td>
                      <td className="px-2 py-1 w-96 text-xs">{item.description || item.notes || item.sign_details?.description || '—'}</td>
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
          </TakeoffViewCard>
        </div>
      )}

      {!takeoff.is_pickup && (takeoff.work_type === "MPT" || takeoff.work_type === "FLAGGING" || takeoff.work_type === "LANE_CLOSURE") && (
        <div className={TAKEOFF_PANEL_MAX_WIDTH_CLASS}>
          <MPTSignConfiguration
            activeSections={Array.isArray(takeoff.active_sections) ? takeoff.active_sections : []}
            signRows={(takeoff.sign_rows || {}) as Record<string, MPTSignRow[]>}
            defaultSignMaterial={(takeoff.default_sign_material || "PLASTIC") as SignMaterial}
            onToggleSection={() => {}}
            onSignRowsChange={() => {}}
            onDefaultMaterialChange={() => {}}
            onApplyMaterialToAll={() => {}}
            disabled
          />
        </div>
      )}

      {takeoff.work_type === "PERMANENT_SIGNS" && (
        <PermanentSignConfiguration
          activeItems={Array.isArray(takeoff.active_permanent_items) ? takeoff.active_permanent_items : []}
          signRows={takeoff.permanent_sign_rows || {}}
          entryRows={takeoff.permanent_entry_rows || {}}
          defaultSignMaterial={(takeoff.default_permanent_sign_material || "ALUMINUM") as SignMaterial}
          onToggleItem={() => {}}
          onSignRowsChange={() => {}}
          onEntryRowsChange={() => {}}
          onDefaultMaterialChange={() => {}}
          onApplyMaterialToAll={() => {}}
          disabled
          jobId={jobId}
        />
      )}

      {/* ─── Additional Items Card — Custom items added to takeoff ─── */}
      {!takeoff.is_pickup && (
        <div className={TAKEOFF_PANEL_MAX_WIDTH_CLASS}>
          <TakeoffViewCard title="Additional Items" icon={<Plus />} badge={additionalItems.length}>
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
          </TakeoffViewCard>
        </div>
      )}

      {/* Notes */}
      {(takeoff.notes || takeoff.crew_notes || takeoff.build_shop_notes || takeoff.pm_notes) && (
        <TakeoffViewCard title="Notes">
          <div className="space-y-4">
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
        </TakeoffViewCard>
      )}
    </div>
  );
}
