import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Package, Loader2, AlertTriangle, CheckCircle2, Construction, Lightbulb,
  TriangleAlert, ChevronDown, ChevronRight, FileDown, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateReturnTakeoffPdf } from "@/app/l/utils/generateReturnTakeoffPdf";
import { toast } from "sonner";

/* ─── Types ─── */
interface TakeoffRow {
  id: string;
  title: string;
  work_type: string;
  status: string;
  install_date: string | null;
  pickup_date: string | null;
  contracted_or_additional: string;
  work_order_id: string | null;
}

interface JobRow {
  project_name: string;
  etc_job_number: string | null;
  etc_branch: string | null;
  etc_project_manager: string | null;
  customer_name: string | null;
  customer_job_number: string | null;
  project_owner: string | null;
  county: string | null;
  customer_pm: string | null;
  customer_pm_phone: string | null;
}

interface TakeoffItemRow {
  id: string;
  takeoff_id: string;
  product_name: string;
  category: string;
  quantity: number;
  notes: string | null;
  material: string;
  return_condition: string | null;
  return_details: Record<string, string> | null;
  damage_photos: Record<string, string[]> | null;
}

interface WORow {
  id: string;
  is_pickup: boolean;
  wo_number: string | null;
}

type ComponentKey = "sign" | "structure" | "lights";

/* ─── Helpers ─── */
function getComponents(item: TakeoffItemRow): ComponentKey[] {
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

/** Categorize a product into an equipment group for the summary cards */
function getEquipmentGroup(productName: string, category: string): string {
  const name = productName.toUpperCase();
  const cat = category.toUpperCase();
  if (name.includes("SAND BAG") || name.includes("SANDBAG")) return "Sand Bags";
  if (name.includes("TYPE III") || name.includes("TYPE 3") || name.includes("BARRICADE")) return "Barricades";
  if (name.includes("VERTICAL PANEL") || name.includes("HIP VERTICAL")) return "Vertical Panels";
  if (name.includes("DRUM") || name.includes("BARREL")) return "Drums";
  if (name.includes("CONE")) return "Cones";
  if (name.includes("DELINEATOR")) return "Delineators";
  if (cat === "VEHICLES" || cat === "ROLLING STOCK") return "Vehicles/Equipment";
  if (cat === "ADDITIONAL ITEMS") return "Additional Items";
  if (cat === "PERMANENT SIGNS") return "Permanent Signs";
  return "Signs";
}

interface EquipmentSummaryProps {
  jobId: string;
}

export const EquipmentSummary = ({ jobId }: EquipmentSummaryProps) => {
  const [takeoffs, setTakeoffs] = useState<TakeoffRow[]>([]);
  const [items, setItems] = useState<TakeoffItemRow[]>([]);
  const [workOrders, setWorkOrders] = useState<WORow[]>([]);
  const [jobData, setJobData] = useState<JobRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTakeoff, setFilterTakeoff] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Fetch job data and dispatches in parallel
      const [{ data: jobRow }, { data: dispatchData }] = await Promise.all([
        supabase
          .from("jobs")
          .select("project_name, etc_job_number, etc_branch, etc_project_manager, customer_name, customer_job_number, project_owner, county, customer_pm, customer_pm_phone")
          .eq("id", jobId)
          .single(),
        supabase
          .from("dispatches")
          .select("takeoff_id")
          .eq("job_id", jobId),
      ]);

      setJobData(jobRow as JobRow | null);
      const dispatchedTakeoffIds = new Set((dispatchData || []).map(d => d.takeoff_id));

      const { data: tData } = await supabase
        .from("takeoffs")
        .select("id, title, work_type, status, install_date, pickup_date, contracted_or_additional, work_order_id")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      const allTakeoffs = ((tData || []) as TakeoffRow[]).filter(t => dispatchedTakeoffIds.has(t.id));
      setTakeoffs(allTakeoffs);

      if (allTakeoffs.length === 0) {
        setItems([]);
        setWorkOrders([]);
        setLoading(false);
        return;
      }

      const takeoffIds = allTakeoffs.map(t => t.id);
      const woIds = allTakeoffs.map(t => t.work_order_id).filter(Boolean) as string[];

      const [itemsRes, woRes] = await Promise.all([
        supabase
          .from("takeoff_items")
          .select("id, takeoff_id, product_name, category, quantity, notes, material, return_condition, return_details, damage_photos")
          .in("takeoff_id", takeoffIds),
        woIds.length > 0
          ? supabase.from("work_orders").select("id, is_pickup, wo_number").in("id", woIds)
          : Promise.resolve({ data: [] }),
      ]);

      setItems((itemsRes.data || []) as TakeoffItemRow[]);
      setWorkOrders((woRes.data || []) as WORow[]);
      setLoading(false);
    };
    fetch();
  }, [jobId]);

  // Build lookup maps
  const woMap = useMemo(() => new Map(workOrders.map(w => [w.id, w])), [workOrders]);

  // Separate install vs pickup takeoffs
  const { installTakeoffs, pickupTakeoffs } = useMemo(() => {
    const install: TakeoffRow[] = [];
    const pickup: TakeoffRow[] = [];
    takeoffs.forEach(t => {
      const wo = t.work_order_id ? woMap.get(t.work_order_id) : null;
      if (wo?.is_pickup) pickup.push(t);
      else install.push(t);
    });
    return { installTakeoffs: install, pickupTakeoffs: pickup };
  }, [takeoffs, woMap]);

  // Filter takeoffs for display
  const activeTakeoffs = useMemo(() => {
    if (filterTakeoff === "all") return installTakeoffs;
    return installTakeoffs.filter(t => t.id === filterTakeoff);
  }, [installTakeoffs, filterTakeoff]);

  const activeTakeoffIds = useMemo(() => new Set(activeTakeoffs.map(t => t.id)), [activeTakeoffs]);

  // Items deployed (from install takeoffs)
  const deployedItems = useMemo(
    () => items.filter(i => activeTakeoffIds.has(i.takeoff_id)),
    [items, activeTakeoffIds],
  );

  // Items returned (from pickup takeoffs that match the filtered install takeoffs' work orders)
  const relevantPickupTakeoffIds = useMemo(() => {
    // If filtering "all", include all pickup takeoffs
    if (filterTakeoff === "all") return new Set(pickupTakeoffs.map(t => t.id));
    // Otherwise find PU work orders whose parent matches the selected takeoff's WO
    return new Set(pickupTakeoffs.map(t => t.id));
  }, [pickupTakeoffs, filterTakeoff]);

  const returnedItems = useMemo(
    () => items.filter(i => relevantPickupTakeoffIds.has(i.takeoff_id)),
    [items, relevantPickupTakeoffIds],
  );

  // ─── Aggregate Stats ───
  const stats = useMemo(() => {
    // Deployed counts by group
    const deployed: Record<string, number> = {};
    const deployedByProduct: Record<string, { qty: number; category: string; group: string; material: string; dimensions: string; sheeting: string; structureType: string }> = {};
    let totalStructures = 0;
    let totalSandBags = 0;

    deployedItems.forEach(item => {
      const group = getEquipmentGroup(item.product_name, item.category);
      deployed[group] = (deployed[group] || 0) + item.quantity;
      const key = item.product_name;
      let meta: Record<string, any> = {};
      try { meta = JSON.parse(item.notes || "{}"); } catch { /* */ }
      const dimensions = meta.size || meta.dimensions || "";
      const sheeting = meta.sheeting || "";
      const structureType = meta.structureType || "";

      // Count structures
      if (structureType && structureType !== "" && structureType !== "Loose") {
        totalStructures += item.quantity;
      }
      // Barricades always have a structure
      const nameUpper = item.product_name.toUpperCase();
      if (nameUpper.includes("TYPE III") || nameUpper.includes("TYPE 3") || nameUpper.includes("BARRICADE")) {
        totalStructures += item.quantity;
      }

      // Count sand bags
      if (nameUpper.includes("SAND BAG") || nameUpper.includes("SANDBAG")) {
        totalSandBags += item.quantity;
      }

      if (!deployedByProduct[key]) {
        deployedByProduct[key] = { qty: 0, category: item.category, group, material: item.material || "", dimensions, sheeting, structureType };
      }
      deployedByProduct[key].qty += item.quantity;
    });

    // Return condition breakdown per group AND per product
    const returnedOk: Record<string, number> = {};
    const returnedDamaged: Record<string, number> = {};
    const returnedMissing: Record<string, number> = {};
    const returnedOnJob: Record<string, number> = {};
    const returnedOkByProduct: Record<string, number> = {};
    const returnedDamagedByProduct: Record<string, number> = {};
    const returnedMissingByProduct: Record<string, number> = {};
    const returnedOnJobByProduct: Record<string, number> = {};

    returnedItems.forEach(item => {
      const rd = (item.return_details || {}) as Record<string, string>;
      const comps = getComponents(item);
      const group = getEquipmentGroup(item.product_name, item.category);
      const key = item.product_name;

      comps.forEach(comp => {
        const condition = rd[comp];
        if (!condition) return;
        const qty = item.quantity;
        if (condition === "ok") { returnedOk[group] = (returnedOk[group] || 0) + qty; returnedOkByProduct[key] = (returnedOkByProduct[key] || 0) + qty; }
        else if (condition === "damaged") { returnedDamaged[group] = (returnedDamaged[group] || 0) + qty; returnedDamagedByProduct[key] = (returnedDamagedByProduct[key] || 0) + qty; }
        else if (condition === "missing") { returnedMissing[group] = (returnedMissing[group] || 0) + qty; returnedMissingByProduct[key] = (returnedMissingByProduct[key] || 0) + qty; }
        else if (condition === "on_job") { returnedOnJob[group] = (returnedOnJob[group] || 0) + qty; returnedOnJobByProduct[key] = (returnedOnJobByProduct[key] || 0) + qty; }
      });
    });

    // All groups
    const allGroups = [...new Set([
      ...Object.keys(deployed),
      ...Object.keys(returnedOk),
      ...Object.keys(returnedDamaged),
      ...Object.keys(returnedMissing),
      ...Object.keys(returnedOnJob),
    ])].sort();

    // Totals
    const totalDeployed = Object.values(deployed).reduce((s, v) => s + v, 0);
    const totalDamaged = Object.values(returnedDamaged).reduce((s, v) => s + v, 0);
    const totalMissing = Object.values(returnedMissing).reduce((s, v) => s + v, 0);
    const totalReturnedOk = Object.values(returnedOk).reduce((s, v) => s + v, 0);
    const totalOnJob = Object.values(returnedOnJob).reduce((s, v) => s + v, 0);
    const totalCurrentOnJob = totalDeployed - totalReturnedOk - totalDamaged - totalMissing;

    return {
      deployed, deployedByProduct,
      returnedOk, returnedDamaged, returnedMissing, returnedOnJob,
      returnedOkByProduct, returnedDamagedByProduct, returnedMissingByProduct, returnedOnJobByProduct,
      allGroups,
      totalDeployed, totalDamaged, totalMissing, totalReturnedOk, totalOnJob, totalCurrentOnJob,
      totalStructures, totalSandBags,
    };
  }, [deployedItems, returnedItems]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  // Compute aggregated dates from active takeoffs
  const { earliestInstall, latestPickup } = useMemo(() => {
    let earliest: string | null = null;
    let latest: string | null = null;
    activeTakeoffs.forEach(t => {
      if (t.install_date) {
        if (!earliest || t.install_date < earliest) earliest = t.install_date;
      }
      if (t.pickup_date) {
        if (!latest || t.pickup_date > latest) latest = t.pickup_date;
      }
    });
    return { earliestInstall: earliest, latestPickup: latest };
  }, [activeTakeoffs]);

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Generate Return Inventory Report PDF
  const handleGenerateReturnPdf = async () => {
    if (!jobData) return;
    setGeneratingPdf(true);
    try {
      // Build items from returnedItems (pickup takeoff items with return details)
      const pdfItems = returnedItems.map(item => {
        const rd = (item.return_details || {}) as Record<string, string>;
        const comps = getComponents(item);
        return {
          product_name: item.product_name,
          category: item.category,
          quantity: item.quantity,
          components: comps.map(key => ({
            key,
            label: key === "sign" ? "Sign" : key === "structure" ? "Structure" : "Lights",
            condition: rd[key] || "ok",
          })),
        };
      });

      // If no returned items, use deployed items with "on_job" status
      const finalItems = pdfItems.length > 0 ? pdfItems : deployedItems.map(item => {
        const comps = getComponents(item);
        return {
          product_name: item.product_name,
          category: item.category,
          quantity: item.quantity,
          components: comps.map(key => ({
            key,
            label: key === "sign" ? "Sign" : key === "structure" ? "Structure" : "Lights",
            condition: "on_job",
          })),
        };
      });

      const selectedTakeoff = filterTakeoff !== "all"
        ? activeTakeoffs.find(t => t.id === filterTakeoff)
        : activeTakeoffs[0];

      await generateReturnTakeoffPdf({
        title: selectedTakeoff?.title || "Equipment Summary",
        workType: selectedTakeoff?.work_type || "MPT",
        projectName: jobData.project_name,
        etcJobNumber: jobData.etc_job_number || undefined,
        etcBranch: jobData.etc_branch || undefined,
        etcProjectManager: jobData.etc_project_manager || undefined,
        customerName: jobData.customer_name || undefined,
        customerJobNumber: jobData.customer_job_number || undefined,
        projectOwner: jobData.project_owner || undefined,
        county: jobData.county || undefined,
        installDate: earliestInstall,
        pickupDate: latestPickup,
        customerPM: jobData.customer_pm || undefined,
        contractedOrAdditional: selectedTakeoff?.contracted_or_additional,
        customerPocPhone: jobData.customer_pm_phone || undefined,
        items: finalItems,
      });
      toast.success("Return Inventory Report generated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Compute overdays for this project (must be before early returns)
  const overdaysAlert = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let maxOverdays = 0;
    activeTakeoffs.forEach(t => {
      if (t.pickup_date && t.pickup_date < today && t.status !== "canceled" && t.status !== "complete") {
        const days = Math.ceil(
          (new Date(today + "T00:00:00").getTime() - new Date(t.pickup_date + "T00:00:00").getTime()) / 86400000
        );
        maxOverdays = Math.max(maxOverdays, days);
      }
    });
    return { hasOverdays: maxOverdays > 0, days: maxOverdays, hasOnJob: stats.totalCurrentOnJob > 0 };
  }, [activeTakeoffs, stats.totalCurrentOnJob]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (takeoffs.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">No takeoffs created yet</p>
        <p className="text-xs text-muted-foreground mt-1">Equipment data will appear once takeoffs are added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* On-Job Alert Banner */}
      {overdaysAlert.hasOnJob && (
        <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
          overdaysAlert.hasOverdays ? "bg-destructive/10 border-destructive/30" : "bg-accent/50 border-accent"
        }`}>
          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${overdaysAlert.hasOverdays ? "text-destructive" : "text-warning"}`} />
          <div className="text-sm">
            <span className="font-semibold">
              {stats.totalCurrentOnJob} item{stats.totalCurrentOnJob !== 1 ? "s" : ""} remain on this job
            </span>
            {overdaysAlert.hasOverdays && (
              <span className="text-destructive font-medium ml-1">
                — {overdaysAlert.days} day{overdaysAlert.days !== 1 ? "s" : ""} past pickup date
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Equipment has been deployed but not yet fully returned. Review the summary below for details.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">Equipment Summary</h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterTakeoff} onValueChange={setFilterTakeoff}>
            <SelectTrigger className="h-8 text-xs w-[220px]">
              <SelectValue placeholder="All Takeoffs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Takeoffs</SelectItem>
              {installTakeoffs.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.title || "Untitled"} — {t.work_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleGenerateReturnPdf}
            disabled={generatingPdf}
          >
            {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            Return Inventory PDF
          </Button>
        </div>
      </div>

      {/* Install / Pickup Dates */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Install:</span>
          <span className="font-bold text-foreground">{fmtDate(earliestInstall)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Pickup:</span>
          <span className="font-bold text-foreground">{fmtDate(latestPickup)}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard
          label="Total Deployed"
          value={stats.totalDeployed}
          icon={Package}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <SummaryCard
          label="Currently On Job"
          value={Math.max(0, stats.totalCurrentOnJob)}
          icon={Construction}
          color="text-blue-700"
          bgColor="bg-blue-500/10"
        />
        <SummaryCard
          label="Structures"
          value={stats.totalStructures}
          icon={Construction}
          color="text-indigo-700"
          bgColor="bg-indigo-500/10"
        />
        <SummaryCard
          label="Sand Bags"
          value={stats.totalSandBags}
          icon={Package}
          color="text-amber-700"
          bgColor="bg-amber-500/10"
        />
        <SummaryCard
          label="Total Damaged"
          value={stats.totalDamaged}
          icon={AlertTriangle}
          color="text-destructive"
          bgColor="bg-destructive/10"
          highlight={stats.totalDamaged > 0}
        />
        <SummaryCard
          label="Total Missing"
          value={stats.totalMissing}
          icon={TriangleAlert}
          color="text-warning"
          bgColor="bg-warning/10"
          highlight={stats.totalMissing > 0}
        />
      </div>

      {/* Equipment Breakdown Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
             <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-black uppercase w-[200px]">Equipment Group</TableHead>
                <TableHead className="text-xs font-black uppercase">Dimensions</TableHead>
                <TableHead className="text-xs font-black uppercase">Sheeting</TableHead>
                <TableHead className="text-xs font-black uppercase text-right">Deployed</TableHead>
                <TableHead className="text-xs font-black uppercase text-right">Returned OK</TableHead>
                <TableHead className="text-xs font-black uppercase text-right">Damaged</TableHead>
                <TableHead className="text-xs font-black uppercase text-right">Missing</TableHead>
                <TableHead className="text-xs font-black uppercase text-right">On Job</TableHead>
                <TableHead className="text-xs font-black uppercase text-right">Net On Job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.allGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                    No equipment data available.
                  </TableCell>
                </TableRow>
              ) : (
                stats.allGroups.map(group => {
                  const dep = stats.deployed[group] || 0;
                  const retOk = stats.returnedOk[group] || 0;
                  const retDmg = stats.returnedDamaged[group] || 0;
                  const retMiss = stats.returnedMissing[group] || 0;
                  const onJob = stats.returnedOnJob[group] || 0;
                  const netOnJob = dep - retOk - retDmg - retMiss;
                  const isExpanded = expandedGroups.has(group);

                  const groupProducts = Object.entries(stats.deployedByProduct)
                    .filter(([, v]) => v.group === group)
                    .sort(([a], [b]) => a.localeCompare(b));

                  return (
                    <>
                      <TableRow
                        key={group}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => toggleGroup(group)}
                      >
                        <TableCell className="text-sm font-bold py-2">
                          <div className="flex items-center gap-1.5">
                            {isExpanded
                              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                            {group}
                            <Badge variant="secondary" className="text-[9px] ml-1">{groupProducts.length}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-2 text-muted-foreground">—</TableCell>
                        <TableCell className="text-sm py-2 text-muted-foreground">—</TableCell>
                        <TableCell className="text-sm text-right font-mono font-bold py-2">{dep}</TableCell>
                        <TableCell className="text-sm text-right font-mono py-2">{retOk || "—"}</TableCell>
                        <TableCell className={`text-sm text-right font-mono py-2 ${retDmg > 0 ? "text-destructive font-bold" : ""}`}>
                          {retDmg || "—"}
                        </TableCell>
                        <TableCell className={`text-sm text-right font-mono py-2 ${retMiss > 0 ? "text-warning font-bold" : ""}`}>
                          {retMiss || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-right font-mono py-2">{onJob || "—"}</TableCell>
                        <TableCell className="text-sm text-right font-mono font-bold py-2">
                          {Math.max(0, netOnJob)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && groupProducts.map(([prodName, prodData]) => {
                        const pRetOk = stats.returnedOkByProduct[prodName] || 0;
                        const pRetDmg = stats.returnedDamagedByProduct[prodName] || 0;
                        const pRetMiss = stats.returnedMissingByProduct[prodName] || 0;
                        const pOnJob = stats.returnedOnJobByProduct[prodName] || 0;
                        const pNetOnJob = prodData.qty - pRetOk - pRetDmg - pRetMiss;
                        return (
                          <TableRow key={`${group}-${prodName}`} className="bg-muted/10">
                            <TableCell className="text-xs text-muted-foreground py-1.5 pl-10">
                              <div className="flex items-center gap-1">
                                {prodName}
                                {prodData.material && (
                                  <Badge variant="outline" className="text-[9px] py-0 ml-1">{prodData.material}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs py-1.5 text-muted-foreground">{prodData.dimensions || "—"}</TableCell>
                            <TableCell className="text-xs py-1.5 text-muted-foreground">{prodData.sheeting || "—"}</TableCell>
                            <TableCell className="text-xs text-right font-mono py-1.5">{prodData.qty}</TableCell>
                            <TableCell className="text-xs text-right font-mono py-1.5">{pRetOk || "—"}</TableCell>
                            <TableCell className={`text-xs text-right font-mono py-1.5 ${pRetDmg > 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                              {pRetDmg || "—"}
                            </TableCell>
                            <TableCell className={`text-xs text-right font-mono py-1.5 ${pRetMiss > 0 ? "text-warning font-bold" : "text-muted-foreground"}`}>
                              {pRetMiss || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono py-1.5">{pOnJob || "—"}</TableCell>
                            <TableCell className="text-xs text-right font-mono font-bold py-1.5">
                              {Math.max(0, pNetOnJob)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  );
                })
              )}
              {/* Totals row */}
              {stats.allGroups.length > 0 && (
                <TableRow className="bg-muted/30 border-t-2">
                  <TableCell className="text-xs font-black uppercase py-2">Totals</TableCell>
                  <TableCell className="py-2" />
                  <TableCell className="py-2" />
                  <TableCell className="text-sm text-right font-mono font-black py-2">{stats.totalDeployed}</TableCell>
                  <TableCell className="text-sm text-right font-mono font-bold py-2">{stats.totalReturnedOk || "—"}</TableCell>
                  <TableCell className={`text-sm text-right font-mono font-bold py-2 ${stats.totalDamaged > 0 ? "text-destructive" : ""}`}>
                    {stats.totalDamaged || "—"}
                  </TableCell>
                  <TableCell className={`text-sm text-right font-mono font-bold py-2 ${stats.totalMissing > 0 ? "text-warning" : ""}`}>
                    {stats.totalMissing || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-right font-mono font-bold py-2">{stats.totalOnJob || "—"}</TableCell>
                  <TableCell className="text-sm text-right font-mono font-black py-2">
                    {Math.max(0, stats.totalCurrentOnJob)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Damage History */}
      {stats.totalDamaged > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b bg-destructive/5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-destructive">Damage History</h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-black uppercase">Item</TableHead>
                  <TableHead className="text-xs font-black uppercase">Details</TableHead>
                  <TableHead className="text-xs font-black uppercase">Takeoff</TableHead>
                  <TableHead className="text-xs font-black uppercase">Component</TableHead>
                  <TableHead className="text-xs font-black uppercase text-right">Qty</TableHead>
                  <TableHead className="text-xs font-black uppercase">Photos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnedItems.flatMap(item => {
                  const rd = (item.return_details || {}) as Record<string, string>;
                  const takeoff = takeoffs.find(t => t.id === item.takeoff_id);
                  let meta: Record<string, any> = {};
                  try { meta = JSON.parse(item.notes || "{}"); } catch { /* */ }
                  const dimensions = meta.size || meta.dimensions || "";
                  const sheeting = meta.sheeting || "";
                  const photos = item.damage_photos || {};
                  return Object.entries(rd)
                    .filter(([, cond]) => cond === "damaged")
                    .map(([comp]) => {
                      const compPhotos = (photos as Record<string, string[]>)[comp] || [];
                      return (
                        <TableRow key={`${item.id}-${comp}`}>
                          <TableCell className="text-xs font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div className="flex gap-1 flex-wrap">
                              {item.material && <Badge variant="outline" className="text-[9px] py-0">{item.material}</Badge>}
                              {dimensions && <Badge variant="outline" className="text-[9px] py-0">{dimensions}</Badge>}
                              {sheeting && <Badge variant="outline" className="text-[9px] py-0">{sheeting}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{takeoff?.title || "—"}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-[10px]">
                              {comp === "sign" ? "Sign" : comp === "structure" ? "Structure" : "Lights"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono font-bold text-destructive">{item.quantity}</TableCell>
                          <TableCell className="text-xs">
                            {compPhotos.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {compPhotos.map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={url}
                                      alt={`Damage ${idx + 1}`}
                                      className="h-8 w-8 rounded object-cover border border-destructive/30 hover:ring-2 hover:ring-destructive/50 cursor-pointer"
                                    />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    });
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ─── Summary Card ─── */
const SummaryCard = ({
  label, value, icon: Icon, color, bgColor, highlight,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  highlight?: boolean;
}) => (
  <Card className={highlight ? "border-destructive/30" : ""}>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${bgColor}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-black text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      </div>
    </CardContent>
  </Card>
);