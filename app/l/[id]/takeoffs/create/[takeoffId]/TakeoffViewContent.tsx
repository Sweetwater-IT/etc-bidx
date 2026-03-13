"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardList, Download, Send, Edit, FileText, ArrowRight, Loader2, Upload, Trash2 } from "lucide-react";
import { MPTSignConfiguration, type MPTSignRow } from "@/components/MPTSignConfiguration";
import { PermanentSignConfiguration } from "@/components/PermanentSignConfiguration";

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
  const [pickupItems, setPickupItems] = useState<any[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupSaving, setPickupSaving] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  useEffect(() => {
    const loadPickupReport = async () => {
      if (!takeoff?.is_pickup || !takeoff?.work_order_id) return;

      setPickupLoading(true);
      try {
        const response = await fetch(`/api/l/jobs/${jobId}/work-orders/${takeoff.work_order_id}/pickup-report`);
        if (!response.ok) {
          throw new Error('Failed to load pickup report');
        }

        const data = await response.json();
        setPickupItems(
          (data || []).map((item: any) => ({
            ...item,
            pickup_condition: item.pickup_condition || 'good',
            pickup_images: Array.isArray(item.pickup_images) ? item.pickup_images : [],
            pickup_image_urls: Array.isArray(item.pickup_image_urls) ? item.pickup_image_urls : [],
          }))
        );
      } catch (error) {
        console.error('Error loading pickup report:', error);
        toast.error('Failed to load return inventory');
      } finally {
        setPickupLoading(false);
      }
    };

    loadPickupReport();
  }, [jobId, takeoff?.is_pickup, takeoff?.work_order_id]);

  const savePickupReport = async () => {
    if (!takeoff?.work_order_id) return;

    setPickupSaving(true);
    try {
      const response = await fetch(`/api/l/jobs/${jobId}/work-orders/${takeoff.work_order_id}/pickup-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: pickupItems.map((item) => ({
            item_id: item.id,
            condition: item.pickup_condition || 'good',
            images: Array.isArray(item.pickup_images) ? item.pickup_images : [],
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save return inventory');
      }

      toast.success('Return inventory saved');
    } catch (error) {
      console.error('Error saving pickup report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save return inventory');
    } finally {
      setPickupSaving(false);
    }
  };

  const uploadPickupImages = async (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0 || !takeoff?.work_order_id) return;

    setUploadingItemId(itemId);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const response = await fetch(`/api/l/jobs/${jobId}/work-orders/${takeoff.work_order_id}/pickup-report/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload images');
      }

      const data = await response.json();
      const uploadedFiles = Array.isArray(data.files) ? data.files : [];

      setPickupItems((prev) => prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          pickup_images: [...(item.pickup_images || []), ...uploadedFiles.map((file: any) => file.path)],
          pickup_image_urls: [...(item.pickup_image_urls || []), ...uploadedFiles.map((file: any) => file.signedUrl)],
        };
      }));

      toast.success(`${uploadedFiles.length} image(s) uploaded`);
    } catch (error) {
      console.error('Error uploading pickup images:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploadingItemId(null);
      if (fileInputRefs.current[itemId]) {
        fileInputRefs.current[itemId]!.value = '';
      }
    }
  };

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
        router.push(`/l/jobs/${jobId}/work-orders/view/${result.workOrder.id}`);
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
      <div className="py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading takeoff...</p>
        </div>
      </div>
    );
  }

  if (!takeoff) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Takeoff not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">

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
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{takeoff.title}</div>
                {takeoff.is_pickup && (
                  <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Pickup
                  </span>
                )}
              </div>
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
                    onClick={() => router.push(`/l/jobs/${jobId}/work-orders/view/${takeoff.work_order_id}`)}
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

          {(takeoff.parent_takeoff || takeoff.pickup_takeoff) && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              {takeoff.parent_takeoff && (
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Parent Takeoff</Label>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => router.push(`/l/${jobId}/takeoffs/view/${takeoff.parent_takeoff.id}`)}
                  >
                    {takeoff.parent_takeoff.title}
                  </button>
                </div>
              )}
              {takeoff.pickup_takeoff && (
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Pickup Takeoff</Label>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => router.push(`/l/${jobId}/takeoffs/view/${takeoff.pickup_takeoff.id}`)}
                  >
                    {takeoff.pickup_takeoff.title}
                  </button>
                </div>
              )}
            </div>
          )}
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
              <PermanentSignConfiguration
                activeItems={takeoff.active_permanent_items || []}
                signRows={takeoff.permanent_sign_rows || {}}
                entryRows={takeoff.permanent_entry_rows || {}}
                defaultSignMaterial={takeoff.default_permanent_sign_material || 'ALUMINUM'}
                onToggleItem={() => {}}
                onSignRowsChange={() => {}}
                onEntryRowsChange={() => {}}
                onDefaultMaterialChange={() => {}}
                onApplyMaterialToAll={() => {}}
                disabled={true}
              />
            )}

            {(takeoff.work_type === "FLAGGING" || takeoff.work_type === "LANE_CLOSURE" || takeoff.work_type === "SERVICE" || takeoff.work_type === "DELIVERY") && (
              <MPTSignConfiguration
                activeSections={takeoff.active_sections || []}
                signRows={takeoff.sign_rows || {}}
                defaultSignMaterial={takeoff.default_sign_material || 'PLASTIC'}
                onToggleSection={() => {}}
                onSignRowsChange={() => {}}
                onDefaultMaterialChange={() => {}}
                onApplyMaterialToAll={() => {}}
                disabled={true}
              />
            )}

            {takeoff.work_type === "DELIVERY" && (
              <div className="mt-4 rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Delivery rolling stock remains disabled and read-only.
              </div>
            )}

            {takeoff.work_type === "RENTAL" && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Additional items configuration would be displayed here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {Array.isArray(takeoff.takeoff_items) && takeoff.takeoff_items.length > 0 && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Takeoff Items</h2>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/20">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Item</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qty</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dimensions</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sq Ft</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Sq Ft</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Material</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sheeting</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {takeoff.takeoff_items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="px-3 py-2 font-medium">{item.product_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.category}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">
                      {item.width_inches && item.height_inches ? `${item.width_inches}" x ${item.height_inches}"` : '—'}
                    </td>
                    <td className="px-3 py-2">{item.sqft ?? '—'}</td>
                    <td className="px-3 py-2">{item.total_sqft ?? '—'}</td>
                    <td className="px-3 py-2">{item.material || '—'}</td>
                    <td className="px-3 py-2">{item.sheeting || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {takeoff.is_pickup && takeoff.work_order_id && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Return Inventory</h2>
            <Button size="sm" onClick={savePickupReport} disabled={pickupSaving || pickupLoading}>
              {pickupSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              {pickupSaving ? 'Saving…' : 'Save Return Inventory'}
            </Button>
          </div>
          <div className="p-5 space-y-4">
            {pickupLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : pickupItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No return inventory items found for this pickup work order.</div>
            ) : (
              pickupItems.map((item) => (
                <div key={item.id} className="rounded-md border p-4 space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium">{item.item_number || '—'} {item.description ? `— ${item.description}` : ''}</p>
                      <p className="text-xs text-muted-foreground">WO Qty: {item.work_order_quantity ?? 0} {item.uom || 'EA'}</p>
                    </div>
                    <div className="w-full md:w-52">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Condition</Label>
                      <Select
                        value={item.pickup_condition || 'good'}
                        onValueChange={(value) => {
                          setPickupItems((prev) => prev.map((row) => row.id === item.id ? { ...row, pickup_condition: value } : row));
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="serviceable">Serviceable</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="missing">Missing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Photos</Label>
                      <div>
                        <input
                          ref={(el) => {
                            fileInputRefs.current[item.id] = el;
                          }}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={(e) => uploadPickupImages(item.id, e.target.files)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => fileInputRefs.current[item.id]?.click()}
                          disabled={uploadingItemId === item.id}
                        >
                          {uploadingItemId === item.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                          Upload Photos
                        </Button>
                      </div>
                    </div>

                    {Array.isArray(item.pickup_image_urls) && item.pickup_image_urls.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {item.pickup_image_urls.map((imageUrl: string, index: number) => (
                          <div key={`${item.id}-${index}`} className="relative">
                            <a href={imageUrl} target="_blank" rel="noreferrer">
                              <img
                                src={imageUrl}
                                alt={`Pickup item ${item.item_number || ''} ${index + 1}`}
                                className="h-24 w-24 rounded-md border object-cover bg-muted"
                              />
                            </a>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => {
                                setPickupItems((prev) => prev.map((row) => {
                                  if (row.id !== item.id) return row;
                                  return {
                                    ...row,
                                    pickup_images: (row.pickup_images || []).filter((_: string, i: number) => i !== index),
                                    pickup_image_urls: (row.pickup_image_urls || []).filter((_: string, i: number) => i !== index),
                                  };
                                }));
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No photos uploaded.</div>
                    )}
                  </div>
                </div>
              ))
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
  );
}
