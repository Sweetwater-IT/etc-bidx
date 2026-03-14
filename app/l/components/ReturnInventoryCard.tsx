import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { RotateCcw, Loader2, CheckCircle2, Camera, X, Send, FileText, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateReturnTakeoffPdf } from "@/app/l/utils/generateReturnTakeoffPdf";

const CONDITIONS = [
  { value: "ok", label: "OK", color: "bg-emerald-500/15 text-emerald-700" },
  { value: "damaged", label: "Damaged", color: "bg-red-500/15 text-red-700" },
  { value: "missing", label: "Missing", color: "bg-amber-500/15 text-amber-700" },
  { value: "on_job", label: "On Job", color: "bg-blue-500/15 text-blue-700" },
];

type ComponentKey = "sign" | "structure" | "lights";

const COMP_LABELS: Record<ComponentKey, string> = {
  sign: "Sign",
  structure: "Structure",
  lights: "Lights",
};

interface ReturnItem {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  return_details: Record<string, string> | null;
  return_condition: string | null;
  damage_photos: Record<string, string> | null;
  notes: string | null;
}

export interface ReturnInventoryJobInfo {
  title: string;
  workType: string;
  projectName?: string;
  etcJobNumber?: string;
  etcBranch?: string;
  etcProjectManager?: string;
  customerName?: string;
  customerJobNumber?: string;
  projectOwner?: string;
  county?: string;
  installDate?: string | null;
  pickupDate?: string | null;
  customerPM?: string;
  assignedTo?: string;
  contractedOrAdditional?: string;
}

interface ReturnInventoryCardProps {
  takeoffId: string;
  disabled?: boolean;
  jobInfo?: ReturnInventoryJobInfo;
}

/** Determine which component columns apply to this item */
function getComponents(item: ReturnItem): ComponentKey[] {
  const name = item.product_name.toUpperCase();
  const category = item.category.toUpperCase();
  const comps: ComponentKey[] = [];

  let meta: Record<string, any> = {};
  try { meta = JSON.parse(item.notes || "{}"); } catch { /* */ }

  const isAdditionalOrEquip =
    category === "ADDITIONAL ITEMS" || category === "VEHICLES" || category === "ROLLING STOCK";

  if (isAdditionalOrEquip || name.includes("VERTICAL PANEL") || name.includes("HIP VERTICAL") || name.includes("SAND BAG")) {
    comps.push("sign");
    return comps;
  }

  if (name.includes("TYPE III") || name.includes("TYPE 3") || name.includes("BARRICADE")) {
    comps.push("structure");
    comps.push("lights");
    return comps;
  }

  comps.push("sign");

  const hasStruct = meta.structureType && meta.structureType !== "" && meta.structureType !== "Loose";
  if (hasStruct) comps.push("structure");

  const hasLights = meta.bLights && meta.bLights !== "none" && meta.bLights !== "";
  if (hasLights) comps.push("lights");

  return comps;
}

/** Extract the structure type label for display */
function getStructureLabel(item: ReturnItem): string {
  const name = item.product_name.toUpperCase();
  if (name.includes("TYPE III") || name.includes("TYPE 3") || name.includes("BARRICADE")) {
    return "Barricade";
  }
  let meta: Record<string, any> = {};
  try { meta = JSON.parse(item.notes || "{}"); } catch { /* */ }
  return meta.structureType || "—";
}

/* ── Damage Photo Inline ── */
const DamagePhotoUpload = ({
  itemId,
  comp,
  currentUrl,
  onPhotoUpdated,
}: {
  itemId: string;
  comp: string;
  currentUrl: string | null;
  onPhotoUpdated: (url: string | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('itemId', itemId);
      formData.append('comp', comp);

      const response = await fetch('/api/takeoffs/upload-damage-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      onPhotoUpdated(data.url);
      toast.success("Damage photo attached");
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onPhotoUpdated(null);
    toast.success("Photo removed");
  };

  return (
    <div className="mt-1">
      {currentUrl ? (
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt="Damage"
            className="h-10 w-10 rounded object-cover border cursor-pointer"
            onClick={() => window.open(currentUrl, "_blank")}
          />
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-3.5 w-3.5 flex items-center justify-center"
          >
            <X className="h-2 w-2" />
          </button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] gap-1 px-1.5"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          {uploading ? "…" : "Photo"}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};

export const ReturnInventoryCard = ({ takeoffId, disabled, jobInfo }: ReturnInventoryCardProps) => {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Record<string, Record<string, string>>>({});
  const [photos, setPhotos] = useState<Record<string, Record<string, string>>>({});
  const [savingBulk, setSavingBulk] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/takeoffs/${takeoffId}/data`);
        if (!response.ok) {
          throw new Error('Failed to fetch takeoff data');
        }
        const data = await response.json();
        const rows = (data.takeoffItems || []) as ReturnItem[];
        setItems(rows);

        const init: Record<string, Record<string, string>> = {};
        const initPhotos: Record<string, Record<string, string>> = {};
        rows.forEach((item) => {
          const saved = (item.return_details as Record<string, string>) || {};
          if (item.return_condition && Object.keys(saved).length === 0) {
            const comps = getComponents(item);
            const m: Record<string, string> = {};
            comps.forEach((c) => { m[c] = item.return_condition!; });
            init[item.id] = m;
          } else {
            init[item.id] = { ...saved };
          }
          initPhotos[item.id] = { ...((item.damage_photos as Record<string, string>) || {}) };
        });
        setDetails(init);
        setPhotos(initPhotos);
      } catch (error) {
        console.error('Error fetching takeoff data:', error);
        toast.error('Failed to load return inventory data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [takeoffId]);

  const setCondition = useCallback((itemId: string, comp: string, value: string) => {
    setDetails((prev) => {
      const itemDets = { ...(prev[itemId] || {}), [comp]: value };
      return { ...prev, [itemId]: itemDets };
    });
    if (value !== "damaged") {
      setPhotos((prev) => {
        const itemPhotos = { ...(prev[itemId] || {}) };
        delete itemPhotos[comp];
        return { ...prev, [itemId]: itemPhotos };
      });
    }
    setDirty(true);
  }, []);

  const handlePhotoUpdate = useCallback((itemId: string, comp: string, url: string | null) => {
    setPhotos((prev) => {
      const itemPhotos = { ...(prev[itemId] || {}) };
      if (url) {
        itemPhotos[comp] = url;
      } else {
        delete itemPhotos[comp];
      }
      return { ...prev, [itemId]: itemPhotos };
    });
    setDirty(true);
  }, []);

  const handleMarkAllOk = useCallback(async () => {
    setSavingBulk(true);
    const updated: Record<string, Record<string, string>> = {};

    items.forEach((item) => {
      const comps = getComponents(item);
      const itemDets: Record<string, string> = {};
      comps.forEach((c) => { itemDets[c] = "ok"; });
      updated[item.id] = itemDets;
    });

    setDetails(updated);
    setPhotos({});
    setDirty(true);
    setSavingBulk(false);
  }, [items]);

  const handleFetchData = useCallback(async () => {
    console.log('🔍 [FRONTEND] Manual fetch triggered for takeoff:', takeoffId);
    setFetching(true);
    try {
      const response = await fetch(`/api/takeoffs/${takeoffId}/data`);
      console.log('🔍 [FRONTEND] Fetch response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 [FRONTEND] Raw API response:', data);
      console.log('🔍 [FRONTEND] Takeoff items found:', data.takeoffItems?.length || 0);

      if (data.takeoffItems) {
        console.log('🔍 [FRONTEND] First few items:', data.takeoffItems.slice(0, 3).map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity
        })));
      }

      const rows = (data.takeoffItems || []) as ReturnItem[];
      setItems(rows);

      const init: Record<string, Record<string, string>> = {};
      const initPhotos: Record<string, Record<string, string>> = {};
      rows.forEach((item) => {
        const saved = (item.return_details as Record<string, string>) || {};
        if (item.return_condition && Object.keys(saved).length === 0) {
          const comps = getComponents(item);
          const m: Record<string, string> = {};
          comps.forEach((c) => { m[c] = item.return_condition!; });
          init[item.id] = m;
        } else {
          init[item.id] = { ...saved };
        }
        initPhotos[item.id] = { ...((item.damage_photos as Record<string, string>) || {}) };
      });
      setDetails(init);
      setPhotos(initPhotos);

      toast.success(`Fetched ${rows.length} items`);
    } catch (error) {
      console.error('🔍 [FRONTEND] Error fetching takeoff data:', error);
      toast.error('Failed to fetch return inventory data');
    } finally {
      setFetching(false);
    }
  }, [takeoffId]);

  const handleSave = useCallback(async () => {
    // Check if any damaged items are missing photos
    const missingPhotos = items.some((item) => {
      const comps = getComponents(item);
      const d = details[item.id] || {};
      const p = photos[item.id] || {};
      return comps.some((c) => d[c] === "damaged" && !p[c]);
    });

    if (missingPhotos) {
      toast.error("All damaged items require a photo before saving.");
      return;
    }
    setSaving(true);
    try {
      const updatePromises = items.map(async (item) => {
        const itemDets = details[item.id] || {};
        const itemPhotos = photos[item.id] || {};

        const response = await fetch(`/api/takeoffs/${takeoffId}/items`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: item.id,
            return_details: itemDets,
            return_condition: Object.values(itemDets)[0] || null,
            damage_photos: itemPhotos,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update item ${item.id}`);
        }

        return response.json();
      });

      await Promise.all(updatePromises);
      setDirty(false);
      setLastSavedAt(new Date());
      toast.success("Return inventory saved.");
    } catch (error) {
      console.error('Error saving return inventory:', error);
      toast.error("Failed to save return inventory.");
    } finally {
      setSaving(false);
    }
  }, [items, details, photos, takeoffId]);

  // Check if all items have all components filled
  const allComplete = items.length > 0 && items.every((item) => {
    const comps = getComponents(item);
    const d = details[item.id] || {};
    return comps.every((c) => !!d[c]);
  });

  // Check if any damaged items are missing photos
  const hasMissingDamagePhotos = items.some((item) => {
    const comps = getComponents(item);
    const d = details[item.id] || {};
    const p = photos[item.id] || {};
    return comps.some((c) => d[c] === "damaged" && !p[c]);
  });

  const handleSubmit = useCallback(async () => {
    if (!allComplete) {
      toast.error("All items must have a condition selected before submitting.");
      return;
    }
    if (hasMissingDamagePhotos) {
      toast.error("All damaged items require a photo before submitting.");
      return;
    }

    setSubmitting(true);

    // Save all data first
    try {
      const savePromises = items.map(async (item) => {
        const itemDets = details[item.id] || {};
        const itemPhotos = photos[item.id] || {};

        const response = await fetch(`/api/takeoffs/${takeoffId}/items`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: item.id,
            return_details: itemDets,
            return_condition: Object.values(itemDets)[0] || null,
            damage_photos: itemPhotos,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update item ${item.id}`);
        }

        return response.json();
      });

      await Promise.all(savePromises);
    } catch (error) {
      console.error('Error saving before submitting:', error);
      toast.error("Failed to save before submitting.");
      setSubmitting(false);
      return;
    }

    // Build PDF data
    const pdfItems = items.map((item) => {
      const comps = getComponents(item);
      const d = details[item.id] || {};
      const p = photos[item.id] || {};
      return {
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        components: comps.map((c) => ({
          key: c,
          label: COMP_LABELS[c],
          condition: d[c] || "ok",
          photoUrl: p[c] || undefined,
        })),
      };
    });

    await generateReturnTakeoffPdf({
      title: jobInfo?.title || "Pickup Return",
      workType: jobInfo?.workType || "",
      projectName: jobInfo?.projectName,
      etcJobNumber: jobInfo?.etcJobNumber,
      etcBranch: jobInfo?.etcBranch,
      etcProjectManager: jobInfo?.etcProjectManager,
      customerName: jobInfo?.customerName,
      customerJobNumber: jobInfo?.customerJobNumber,
      projectOwner: jobInfo?.projectOwner,
      county: jobInfo?.county,
      installDate: jobInfo?.installDate,
      pickupDate: jobInfo?.pickupDate,
      customerPM: jobInfo?.customerPM,
      assignedTo: jobInfo?.assignedTo,
      contractedOrAdditional: jobInfo?.contractedOrAdditional,
      items: pdfItems,
    });

    setSubmitted(true);
    setDirty(false);
    setSubmitting(false);
    toast.success("Return inventory submitted — PDF downloaded.");
  }, [allComplete, items, details, photos, jobInfo]);

  // Stats
  const completedCount = items.filter((item) => {
    const comps = getComponents(item);
    const d = details[item.id] || {};
    return comps.every((c) => !!d[c]);
  }).length;

  const allComps = new Set<ComponentKey>();
  items.forEach((item) => getComponents(item).forEach((c) => allComps.add(c)));
  const compCols = (["sign", "structure", "lights"] as ComponentKey[]).filter((c) => allComps.has(c));

  const ConditionSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange} disabled={disabled || submitted}>
      <SelectTrigger className="h-8 text-xs w-full min-w-[90px]">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {CONDITIONS.map((c) => (
          <SelectItem key={c.value} value={c.value} className="text-xs">
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const ConditionBadge = ({ value }: { value: string }) => {
    const cfg = CONDITIONS.find((c) => c.value === value);
    return (
      <Badge className={`text-[10px] ${cfg?.color || "bg-muted text-muted-foreground"}`}>
        {cfg?.label || value}
      </Badge>
    );
  };

  const isReadOnly = disabled || submitted;

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Return Inventory
          </h2>
          <Badge variant="secondary" className="text-[10px] ml-1">
            {completedCount}/{items.length}
          </Badge>
          {submitted && (
            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 ml-1">
              Submitted
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-7"
            onClick={handleFetchData}
            disabled={fetching}
          >
            {fetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {fetching ? "Fetching…" : "Fetch Data"}
          </Button>
          {!isReadOnly && items.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-7"
              onClick={handleMarkAllOk}
              disabled={savingBulk}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {savingBulk ? "Saving…" : "Mark All OK"}
            </Button>
          )}
          {submitted && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-7"
              onClick={handleSubmit}
            >
              <FileText className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          )}
        </div>
      </div>
      <div className="p-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No items to inventory.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[36px] text-center">#</TableHead>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs w-[100px]">Structure</TableHead>
                    <TableHead className="text-xs text-center w-[50px]">Qty</TableHead>
                    {compCols.map((c) => (
                      <TableHead key={c} className="text-xs w-[130px]">
                        {COMP_LABELS[c]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => {
                    const itemComps = getComponents(item);
                    const d = details[item.id] || {};
                    const p = photos[item.id] || {};
                    const allDone = itemComps.every((c) => !!d[c]);

                    return (
                      <TableRow key={item.id} className={allDone ? "bg-emerald-500/5" : ""}>
                        <TableCell className="text-xs text-muted-foreground font-mono text-center py-1.5">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-xs font-medium py-1.5">
                          {item.product_name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-1.5">
                          {getStructureLabel(item)}
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono py-1.5">
                          {item.quantity}
                        </TableCell>
                        {compCols.map((comp) => (
                          <TableCell key={comp} className={`py-1.5 px-1.5 ${!itemComps.includes(comp) ? "bg-muted/40" : ""}`}>
                            {!itemComps.includes(comp) ? (
                              <span className="text-[10px] text-muted-foreground/30 italic">N/A</span>
                            ) : isReadOnly && d[comp] ? (
                              <div>
                                <ConditionBadge value={d[comp]} />
                                {d[comp] === "damaged" && p[comp] && (
                                  <img
                                    src={p[comp]}
                                    alt="Damage"
                                    className="h-8 w-8 rounded object-cover border mt-1 cursor-pointer"
                                    onClick={() => window.open(p[comp], "_blank")}
                                  />
                                )}
                              </div>
                            ) : (
                              <div>
                                <ConditionSelect
                                  value={d[comp] || ""}
                                  onChange={(v) => setCondition(item.id, comp, v)}
                                />
                                {d[comp] === "damaged" && (
                                  <DamagePhotoUpload
                                    itemId={item.id}
                                    comp={comp}
                                    currentUrl={p[comp] || null}
                                    onPhotoUpdated={(url) => handlePhotoUpdate(item.id, comp, url)}
                                  />
                                )}
                              </div>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Action bar */}
            {!isReadOnly && (
              <div className="px-5 py-4 border-t bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {!allComplete
                    ? "Select a condition for all items before submitting."
                    : hasMissingDamagePhotos
                      ? "⚠ Some damaged items are missing photos."
                      : "All items inventoried. Ready to submit."}
                  {lastSavedAt && (
                    <span className="ml-2 text-muted-foreground/70">
                      Last saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!allComplete || submitting}
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};