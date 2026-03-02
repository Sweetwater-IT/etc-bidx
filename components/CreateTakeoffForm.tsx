import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { type SignMaterial, SIGN_MATERIALS, DEFAULT_SIGN_MATERIAL, abbreviateMaterial } from "@/utils/signMaterial";
import { useCreateRevision } from "@/hooks/useCreateRevision";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { useUpsertTakeoff, useReopenTakeoff } from "@/hooks/useUpsertTakeoff";
import { MPTSignTable, type MPTSignRow } from "@/components/MPTSignTable";
import { PermanentSignTable, PERM_SIGN_ITEMS, type PermSignRow } from "@/components/PermanentSignTable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TakeoffStatusBadge } from "@/components/TakeoffStatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Plus, Trash2, Package, Check, Save, Send, Truck, Container, ChevronsUpDown, Search, FileOutput, ExternalLink, Download, Loader2, GitBranch, Lock, Ban, AlertTriangle, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";
import { generateTakeoffPdf } from "@/utils/generateTakeoffPdf";

// ── Canonical Work Type Enum ──
const WORK_TYPES = [
  { value: "MPT", label: "MPT (Maintenance & Protection of Traffic)" },
  { value: "PERMANENT_SIGNS", label: "Permanent Signs" },
  { value: "FLAGGING", label: "Flagging" },
  { value: "LANE_CLOSURE", label: "Lane Closure" },
  { value: "SERVICE", label: "Service" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "RENTAL", label: "Rental" },
];

// Friendly label lookup
const WORK_TYPE_LABEL: Record<string, string> = Object.fromEntries(WORK_TYPES.map(wt => [wt.value, wt.label]));

const WORK_TYPE_COLORS: Record<string, string> = {
  MPT: "bg-blue-500/15 text-blue-700",
  PERMANENT_SIGNS: "bg-purple-500/15 text-purple-700",
  FLAGGING: "bg-amber-500/15 text-amber-700",
  LANE_CLOSURE: "bg-amber-500/15 text-amber-700",
  DELIVERY: "bg-emerald-500/15 text-emerald-700",
  SERVICE: "bg-indigo-500/15 text-indigo-700",
  RENTAL: "bg-red-500/15 text-red-700",
};

// ── Destination routing matrix ──
function resolveDestination(workType: string): "build_shop" | "sign_shop" {
  return workType === "PERMANENT_SIGNS" ? "sign_shop" : "build_shop";
}

const MPT_SECTIONS = [
  {
    key: "trailblazers",
    label: "Trailblazers / H-Stands",
    structures: [
      "Loose",
      "8FT POST (COMPLETE)",
      "10FT POST (COMPLETE)",
      "12FT POST (COMPLETE)",
      "14FT POST (COMPLETE)",
      "8FT H-STAND",
      "10FT H-STAND",
      "12FT H-STAND",
      "14FT H-STAND",
    ],
  },
  {
    key: "type_iii",
    label: "Type IIIs",
    structures: [
      "6FT RIGHT",
      "6FT LEFT",
      "4FT RIGHT",
      "4FT LEFT",
      "6FT LEFT/RIGHT",
      "4FT LEFT/RIGHT",
      "6FT WING BARRICADE",
    ],
  },
  {
    key: "sign_stands",
    label: "Sign Stands",
    structures: ["Sign Stand", "Loose"],
  },
];

const MPT_ADDITIONAL_ITEM_OPTIONS = [
  "SAND BAGS",
  "HIP VERTICAL PANEL (TOP AND BASE)",
  "TYPE 11 VERTICAL PANEL (TOP AND BASE)",
  "A LIGHT",
  "C LIGHT",
  "SHARP BARRICADE",
  "TYPE III BARRICADE — 6FT RIGHT",
  "TYPE III BARRICADE — 6FT LEFT",
  "TYPE III BARRICADE — 6FT LEFT/RIGHT",
  "TYPE III BARRICADE — 4FT RIGHT",
  "TYPE III BARRICADE — 4FT LEFT",
  "TYPE III BARRICADE — 4FT LEFT/RIGHT",
  "TYPE III BARRICADE — 6FT WING BARRICADE",
  "8FT H-STAND",
  "10FT H-STAND",
  "12FT H-STAND",
  "14FT H-STAND",
  "SIGN STAND",
];

const PERM_ADDITIONAL_ITEM_OPTIONS = [
  "CORE DRILLING",
  "LADDER",
  "BUCKET TRUCK",
];

// Sandbag calculation per structure type
const SANDBAG_MAP: Record<string, number> = {
  "6FT RIGHT": 12,
  "6FT LEFT": 12,
  "6FT LEFT/RIGHT": 12,
  "4FT RIGHT": 8,
  "4FT LEFT": 8,
  "4FT LEFT/RIGHT": 8,
  "6FT WING BARRICADE": 4,
  "8FT H-STAND": 6,
  "10FT H-STAND": 6,
  "12FT H-STAND": 6,
  "14FT H-STAND": 6,
};

interface AdditionalItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
  autoCalculated?: boolean;
}

interface Props {
  jobId: string;
  existingTakeoffId?: string;
  onBack: () => void;
  onCreated: (takeoff: any) => void;
}

export const CreateTakeoffForm = ({ jobId, existingTakeoffId, onBack, onCreated }: Props) => {
  const navigate = useNavigate();
  const { data: dbJob, isLoading: jobLoading } = useJobFromDB(jobId);
  const info = dbJob?.projectInfo;

  
  const { upsert: upsertTakeoff, saving: upsertSaving } = useUpsertTakeoff();
  const { createRevision, creating: creatingRevision } = useCreateRevision();
  // Form state
  const [title, setTitle] = useState("");
  const [takeoffPriority, setTakeoffPriority] = useState<"urgent" | "standard" | "low">("standard");
  const [workType, setWorkType] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
   const [notes, setNotes] = useState("");
  const [crewNotes, setCrewNotes] = useState("");
  const [buildShopNotes, setBuildShopNotes] = useState("");
  const [neededByDate, setNeededByDate] = useState("");
  const [mobilizationNumber, setMobilizationNumber] = useState(1);
  const [saving, setSaving] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [savedTakeoffId, setSavedTakeoffId] = useState<string | null>(existingTakeoffId || null);
  const [savedItemCount, setSavedItemCount] = useState(0);
  const [linkedWO, setLinkedWO] = useState<{ id: string; woNumber: string } | null>(null);
  // buildRequestSent removed — derive from takeoffStatus
  const [generatingWO, setGeneratingWO] = useState(false);
  const [submittingBuild, setSubmittingBuild] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  // Dirty tracking: snapshot of last-saved state
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>("");
  // Revision tracking
  const [revisionNumber, setRevisionNumber] = useState<number>(1);
  const [takeoffStatus, setTakeoffStatus] = useState<string>("draft");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [defaultSignMaterial, setDefaultSignMaterial] = useState<SignMaterial>(DEFAULT_SIGN_MATERIAL);
  const [showApplyMaterialDialog, setShowApplyMaterialDialog] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(!!existingTakeoffId);

  // Cancel takeoff state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [canceling, setCanceling] = useState(false);
  const { reopenTakeoff, reopening: reopeningTakeoff } = useReopenTakeoff();
  const [manufacturingStarted, setManufacturingStarted] = useState(false);

  const CANCEL_REASONS = [
    { value: "duplicate", label: "Duplicate" },
    { value: "customer_canceled", label: "Customer Canceled" },
    { value: "pm_error", label: "PM Error" },
    { value: "scope_change", label: "Scope Change" },
    { value: "other", label: "Other" },
  ];

  // ── View / Edit mode ──
  // All takeoffs start editable; submitted ones get locked after load
  const [editMode, setEditMode] = useState(true);

  // Determine read-only: submitted or canceled takeoffs are always read-only
  const isCanceled = takeoffStatus === "canceled";
  const isSubmitted = takeoffStatus !== "draft" && !isCanceled;
  const isReadOnly = (isSubmitted || isCanceled) && !editMode;

  // Work type is immutable after first save
  const isWorkTypeLocked = !!savedTakeoffId;

  // Load existing takeoff from DB
  useEffect(() => {
    if (!existingTakeoffId) return;
    const loadTakeoff = async () => {
      setLoadingExisting(true);
      try {
        const { data: takeoff } = await supabase
          .from("takeoffs")
          .select("*")
          .eq("id", existingTakeoffId)
          .single();

        if (!takeoff) return;

        setTitle(takeoff.title || "");
        setWorkType(takeoff.work_type || "");
        setInstallDate(takeoff.install_date || "");
        setPickupDate(takeoff.pickup_date || "");
        setNotes(takeoff.notes || "");
        setCrewNotes((takeoff as any).crew_notes || "");
        setBuildShopNotes((takeoff as any).build_shop_notes || "");
        setNeededByDate(takeoff.needed_by_date || "");
        setTakeoffStatus(takeoff.status || "draft");
        setTakeoffPriority((takeoff as any).priority || "standard");
        setDefaultSignMaterial((takeoff as any).default_sign_material || DEFAULT_SIGN_MATERIAL);
        // Lock editing for submitted or canceled takeoffs; drafts stay editable
        if (takeoff.status && takeoff.status !== "draft") {
          setEditMode(false);
        }
        setRevisionNumber((takeoff as any).revision_number || 1);

        // Check for linked work order
        if (takeoff.work_order_id) {
          const { data: wo } = await supabase
            .from("work_orders")
            .select("id, wo_number")
            .eq("id", takeoff.work_order_id)
            .single();
          if (wo) setLinkedWO({ id: wo.id, woNumber: wo.wo_number || "" });
        }

        // Check if manufacturing started on any linked build requests
        const { data: brMfg } = await supabase
          .from("build_requests")
          .select("manufacturing_started_at")
          .eq("takeoff_id", existingTakeoffId)
          .not("manufacturing_started_at", "is", null)
          .limit(1);
        setManufacturingStarted(!!(brMfg && brMfg.length > 0));

        // Load items and reconstruct form state
        const { data: items } = await supabase
          .from("takeoff_items")
          .select("*")
          .eq("takeoff_id", existingTakeoffId)
          .order("created_at", { ascending: true });

        if (items && items.length > 0) {
          setSavedItemCount(items.length);
          // Reconstruct sections/rows from saved items
          const mptSections = new Set<string>();
          const mptRows: Record<string, MPTSignRow[]> = {};
          const permItems = new Set<string>();
          const permRows: Record<string, PermSignRow[]> = {};
          const addItems: AdditionalItem[] = [];
          const vItems: { id: string; vehicleType: string; quantity: number }[] = [];
          const rsItems: { id: string; equipmentId: string; equipmentLabel: string }[] = [];

          for (const item of items) {
            if (item.category === "Additional Items") {
              addItems.push({ id: crypto.randomUUID(), name: item.product_name, quantity: item.quantity, description: item.notes || "" });
            } else if (item.category === "Vehicles") {
              const vOpt = FLAGGING_VEHICLE_OPTIONS.find(o => o.name === item.product_name);
              vItems.push({ id: crypto.randomUUID(), vehicleType: vOpt?.id || item.product_name, quantity: item.quantity });
            } else if (item.category === "Rolling Stock") {
              let eqId = "";
              try { eqId = JSON.parse(item.notes || "{}").equipmentId || ""; } catch {}
              rsItems.push({ id: crypto.randomUUID(), equipmentId: eqId, equipmentLabel: item.product_name });
            } else if (item.category.startsWith("Perm Signs")) {
              const itemNum = item.category.replace("Perm Signs — ", "");
              permItems.add(itemNum);
              if (!permRows[itemNum]) permRows[itemNum] = [];
              try {
                const meta = JSON.parse(item.notes || "{}");
                permRows[itemNum].push({
                  id: crypto.randomUUID(),
                  itemNumber: itemNum,
                  isCustom: false,
                  signDesignation: item.product_name,
                  signDescription: meta.signDescription || "",
                  width: meta.width || 0, height: meta.height || 0,
                  dimensionLabel: meta.dimensionLabel || "",
                  signLegend: meta.signLegend || "",
                  sheeting: meta.sheeting || "HI",
                  sqft: meta.sqft || 0, totalSqft: meta.totalSqft || 0,
                  quantity: item.quantity, needsOrder: false,
                  postSize: meta.postSize || "",
                  planSheetNum: meta.planSheetNum || "", planSheetTotal: meta.planSheetTotal || "",
                  material: (item as any).material || "ALUMINUM",
                  secondarySigns: (meta.secondarySigns || []).map((s: any) => ({
                    id: crypto.randomUUID(), isCustom: false, ...s, needsOrder: false,
                  })),
                });
              } catch { /* skip malformed */ }
            } else {
              // MPT section
              const sectionKey = MPT_SECTIONS.find(s => s.label === item.category)?.key;
              if (sectionKey) {
                mptSections.add(sectionKey);
                if (!mptRows[sectionKey]) mptRows[sectionKey] = [];
                try {
                  const meta = JSON.parse(item.notes || "{}");
                  mptRows[sectionKey].push({
                    id: crypto.randomUUID(),
                    isCustom: false,
                    signDesignation: item.product_name,
                    signDescription: meta.signDescription || "",
                    width: meta.width || 0, height: meta.height || 0,
                    dimensionLabel: meta.dimensionLabel || "",
                    signLegend: meta.signLegend || "",
                    sheeting: meta.sheeting || "HI",
                    structureType: meta.structureType || "",
                    bLights: meta.bLights || "none",
                    sqft: meta.sqft || 0, totalSqft: meta.totalSqft || 0,
                    quantity: item.quantity, needsOrder: false,
                    cover: meta.cover || false,
                    loadOrder: meta.loadOrder || 0,
                    material: (item as any).material || "PLASTIC",
                    secondarySigns: (meta.secondarySigns || []).map((s: any) => ({
                      id: crypto.randomUUID(), isCustom: false, ...s, needsOrder: false,
                    })),
                  });
                } catch { /* skip malformed */ }
              }
            }
          }

          setActiveSections(Array.from(mptSections));
          setSignRows(mptRows);
          setActivePermItems(Array.from(permItems));
          setPermSignRows(permRows);
          setAdditionalItems(addItems);
          setVehicleItems(vItems);
          setRollingStockItems(rsItems);
        }

        // Set snapshot after loading so it's not dirty
        setTimeout(() => {
          setLastSavedSnapshot(getCurrentSnapshot());
        }, 100);
      } finally {
        setLoadingExisting(false);
      }
    };
    loadTakeoff();
  }, [existingTakeoffId]);

  // Flagging / Lane Closure state
  const FLAGGING_VEHICLE_OPTIONS = [
    { id: "pickup_truck", name: "Pick Up Truck" },
    { id: "tma", name: "TMA" },
    { id: "message_board", name: "Message Board" },
    { id: "arrow_panel", name: "Arrow Panel" },
    { id: "speed_trailer", name: "Speed Trailer" },
  ];
  const [vehicleItems, setVehicleItems] = useState<{ id: string; vehicleType: string; quantity: number }[]>([]);
  const [rollingStockItems, setRollingStockItems] = useState<{ id: string; equipmentId: string; equipmentLabel: string }[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<{ id: string; equipment_number: string; category: string; equipment_type: string; make: string; model: string }[]>([]);

  // MPT sections
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [signRows, setSignRows] = useState<Record<string, MPTSignRow[]>>({});

  // Permanent Signs sections
  const [activePermItems, setActivePermItems] = useState<string[]>([]);
  const [permSignRows, setPermSignRows] = useState<Record<string, PermSignRow[]>>({});
  const [customPermItems, setCustomPermItems] = useState<{ itemNumber: string; displayName: string; uom: string; needsSignPicker: boolean }[]>([]);
  const [showAddCustomItemDialog, setShowAddCustomItemDialog] = useState(false);
  const [customItemNumber, setCustomItemNumber] = useState("");
  const [customItemDescription, setCustomItemDescription] = useState("");
  const [customItemUomType, setCustomItemUomType] = useState<"SF" | "EA">("SF");

  const allPermItems = useMemo(() => [
    ...PERM_SIGN_ITEMS,
    ...customPermItems,
  ], [customPermItems]);

  // Fetch available rental equipment when flagging/lane closure is selected
  useEffect(() => {
    if (workType === "FLAGGING" || workType === "LANE_CLOSURE") {
      const fetchEquipment = async () => {
        const { data } = await supabase
          .from("rental_equipment")
          .select("id, equipment_number, category, equipment_type, make, model, status")
          .eq("status", "available")
          .order("category", { ascending: true });
        if (data) setAvailableEquipment(data as any);
      };
      fetchEquipment();
    }
  }, [workType]);

  // No auto-select — takeoffs exist independently of work orders

  const addCustomPermItem = () => {
    if (!customItemNumber.trim()) return;
    const newItem = {
      itemNumber: customItemNumber.trim(),
      displayName: customItemDescription.trim() || customItemNumber.trim(),
      uom: customItemUomType,
      needsSignPicker: customItemUomType === "SF",
    };
    setCustomPermItems((prev) => [...prev, newItem]);
    setActivePermItems((prev) => [...prev, newItem.itemNumber]);
    setPermSignRows((prev) => ({ ...prev, [newItem.itemNumber]: [] }));
    setCustomItemNumber("");
    setCustomItemDescription("");
    setCustomItemUomType("SF");
    setShowAddCustomItemDialog(false);
  };

  // Dialog states
  
  const [showWorkTypeChangeDialog, setShowWorkTypeChangeDialog] = useState(false);
  const [pendingWorkType, setPendingWorkType] = useState<string | null>(null);

  // Additional items
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);

  const hasEnteredData = () => {
    const hasSignRows = Object.values(signRows).some((rows) => rows.length > 0);
    const hasPermRows = Object.values(permSignRows).some((rows) => rows.length > 0);
    return hasSignRows || hasPermRows || additionalItems.length > 0 || vehicleItems.length > 0 || rollingStockItems.length > 0;
  };

  const handleWorkTypeChange = (newType: string) => {
    if (isReadOnly) return;
    if (newType === workType) return;
    if (hasEnteredData()) {
      setPendingWorkType(newType);
      setShowWorkTypeChangeDialog(true);
    } else {
      setWorkType(newType);
    }
  };

  const confirmWorkTypeChange = () => {
    if (pendingWorkType) {
      setWorkType(pendingWorkType);
      setActiveSections([]);
      setSignRows({});
      setActivePermItems([]);
      setPermSignRows({});
      setAdditionalItems([]);
      setVehicleItems([]);
      setRollingStockItems([]);
      setPendingWorkType(null);
    }
    setShowWorkTypeChangeDialog(false);
  };

  const toggleSection = (key: string) => {
    if (isReadOnly) return;
    if (activeSections.includes(key)) {
      setActiveSections((prev) => prev.filter((s) => s !== key));
    } else {
      setActiveSections((prev) => [...prev, key]);
      if (!signRows[key]) {
        setSignRows((prev) => ({ ...prev, [key]: [] }));
      }
    }
  };

  const togglePermItem = (itemNumber: string) => {
    if (isReadOnly) return;
    if (activePermItems.includes(itemNumber)) {
      setActivePermItems((prev) => prev.filter((i) => i !== itemNumber));
    } else {
      setActivePermItems((prev) => [...prev, itemNumber]);
      if (!permSignRows[itemNumber]) {
        setPermSignRows((prev) => ({ ...prev, [itemNumber]: [] }));
      }
    }
  };

  const [dateWarning, setDateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (dateWarning) {
      const t = setTimeout(() => setDateWarning(null), 4000);
      return () => clearTimeout(t);
    }
  }, [dateWarning]);

  const handlePickupDateChange = (value: string) => {
    if (installDate && value && value < installDate) {
      setDateWarning("Pickup date cannot be before install date");
      return;
    }
    setDateWarning(null);
    setPickupDate(value);
  };

  const handleInstallDateChange = (value: string) => {
    setInstallDate(value);
    if (pickupDate && value && pickupDate < value) {
      setPickupDate("");
      setDateWarning("Pickup date cleared — it was before the new install date");
    } else if (endDate && value && endDate < value) {
      setEndDate("");
      setDateWarning("End date cleared — it was before the new start date");
    } else if (neededByDate && value && neededByDate >= value) {
      setNeededByDate("");
      setDateWarning("Needed-by date cleared — it must be before the install date");
    } else {
      setDateWarning(null);
    }
  };

  // Auto-calculate sandbags from all sign rows
  const calculatedSandbags = useMemo(() => {
    let total = 0;
    for (const sectionKey of Object.keys(signRows)) {
      for (const row of signRows[sectionKey] || []) {
        const bags = SANDBAG_MAP[row.structureType] || 0;
        total += bags * row.quantity;
      }
    }
    return total;
  }, [signRows]);

  const addAdditionalItem = () => {
    if (isReadOnly) return;
    setAdditionalItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", quantity: 1, description: "" },
    ]);
  };

  const updateAdditionalItem = (id: string, updates: Partial<AdditionalItem>) => {
    if (isReadOnly) return;
    setAdditionalItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const removeAdditionalItem = (id: string) => {
    if (isReadOnly) return;
    setAdditionalItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ── Snapshot for dirty tracking ──
  const getCurrentSnapshot = () => JSON.stringify({
    title, workType, installDate, pickupDate, neededByDate, notes, crewNotes, buildShopNotes,
    activeSections, signRows, activePermItems, permSignRows,
    additionalItems, vehicleItems, rollingStockItems, defaultSignMaterial, takeoffPriority,
  });

  const isDirty = getCurrentSnapshot() !== lastSavedSnapshot;

  // ── Build item payloads (shared by save + PDF) ──
  const buildItemPayloads = () => {
    const itemPayloads: { productName: string; category: string; unit: string; quantity: number; requisitionType: string; notes: string; material?: string }[] = [];

    for (const sectionKey of activeSections) {
      const section = MPT_SECTIONS.find((s) => s.key === sectionKey);
      const rows = signRows[sectionKey] || [];
      for (const row of rows) {
        if (!row.signDesignation) continue;
        itemPayloads.push({
          productName: row.signDesignation,
          category: section?.label || sectionKey,
          unit: "SF",
          quantity: row.quantity,
          requisitionType: "none",
          material: row.material || defaultSignMaterial,
          notes: JSON.stringify({
            signDescription: row.signDescription, sheeting: row.sheeting,
            width: row.width, height: row.height, dimensionLabel: row.dimensionLabel,
            signLegend: row.signLegend, structureType: row.structureType,
            bLights: row.bLights, sqft: row.sqft, totalSqft: row.totalSqft,
            loadOrder: row.loadOrder, cover: row.cover,
            secondarySigns: (row.secondarySigns || []).filter(s => s.signDesignation).map(s => ({
              signDesignation: s.signDesignation, signDescription: s.signDescription,
              dimensionLabel: s.dimensionLabel, width: s.width, height: s.height,
              signLegend: s.signLegend, sheeting: s.sheeting, sqft: s.sqft,
            })),
          }),
        });
      }
    }

    for (const itemNum of activePermItems) {
      const rows = permSignRows[itemNum] || [];
      const itemMeta = allPermItems.find((i) => i.itemNumber === itemNum);
      for (const row of rows) {
        itemPayloads.push({
          productName: row.signDesignation || itemMeta?.displayName || itemNum,
          category: `Perm Signs — ${itemNum}`,
          unit: itemMeta?.uom === "SF" || itemMeta?.uom === "SQM" ? itemMeta.uom : "EA",
          quantity: row.quantity,
          requisitionType: "none",
          material: "ALUMINUM",
          notes: JSON.stringify({
            itemNumber: itemNum, signDescription: row.signDescription,
            sheeting: row.sheeting, width: row.width, height: row.height,
            dimensionLabel: row.dimensionLabel, signLegend: row.signLegend,
            substrate: "Aluminum", structure: "Post Complete",
            sqft: row.sqft, totalSqft: row.totalSqft,
            postSize: row.postSize,
            planSheetNum: row.planSheetNum, planSheetTotal: row.planSheetTotal,
            secondarySigns: (row.secondarySigns || []).filter(s => s.signDesignation).map(s => ({
              signDesignation: s.signDesignation, signDescription: s.signDescription,
              dimensionLabel: s.dimensionLabel, width: s.width, height: s.height,
              signLegend: s.signLegend, sheeting: s.sheeting, sqft: s.sqft,
            })),
          }),
        });
      }
    }

    for (const item of additionalItems) {
      if (!item.name) continue;
      itemPayloads.push({ productName: item.name, category: "Additional Items", unit: "EA", quantity: item.quantity, requisitionType: "none", notes: item.description });
    }

    for (const item of vehicleItems) {
      if (!item.vehicleType) continue;
      const label = FLAGGING_VEHICLE_OPTIONS.find((o) => o.id === item.vehicleType)?.name || item.vehicleType;
      itemPayloads.push({ productName: label, category: "Vehicles", unit: "EA", quantity: item.quantity, requisitionType: "none", notes: "" });
    }

    for (const item of rollingStockItems) {
      if (!item.equipmentId) continue;
      itemPayloads.push({ productName: item.equipmentLabel, category: "Rolling Stock", unit: "EA", quantity: 1, requisitionType: "none", notes: JSON.stringify({ equipmentId: item.equipmentId }) });
    }

    return itemPayloads;
  };

  // ── SAVE DRAFT (multi-save: create OR update) ──
  const handleSaveDraft = async (): Promise<boolean> => {
    setSubmitAttempted(true);
    if (!title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!workType) {
      toast.error("Work Type is required");
      return false;
    }
    if (!dbJob) {
      toast.error("This contract has not been saved to the database yet. Please create it via the Contract Wizard first.");
      return false;
    }
    setSaving(true);

    const itemPayloads = buildItemPayloads();

    const result = await upsertTakeoff({
      takeoffId: savedTakeoffId || undefined,
      jobId,
      patch: {
        title: title.trim(),
        workType,
        notes,
        crewNotes,
        buildShopNotes,
        installDate: installDate || null,
        pickupDate: pickupDate || null,
        neededByDate: neededByDate || null,
        defaultSignMaterial,
        priority: takeoffPriority,
      },
      items: itemPayloads,
    });

    if (!result) {
      setSaving(false);
      return false;
    }

    const takeoffId = result.takeoff.id;

    // Create rental reservations for rolling stock items on first save only
    const reservationRows = rollingStockItems
      .filter((item) => item.equipmentId)
      .map((item) => ({
        equipment_id: item.equipmentId,
        job_id: jobId,
        customer_name: info?.customerName || "",
        start_date: installDate || new Date().toISOString().split("T")[0],
        end_date: (isMultiDay && endDate) ? endDate : (installDate || null),
        status: "reserved",
        notes: `Auto-reserved from takeoff "${title}"`,
      }));

    if (reservationRows.length > 0 && !savedTakeoffId) {
      const { error: resError } = await supabase.from("rental_reservations").insert(reservationRows as any);
      if (resError) {
        console.error("Failed to create rental reservations:", resError);
        toast.error("Takeoff created but failed to reserve some equipment");
      } else {
        const equipIds = reservationRows.map((r) => r.equipment_id);
        await supabase
          .from("rental_equipment")
          .update({ status: "on_rent" } as any)
          .in("id", equipIds);
      }
    }

    setSaving(false);
    setSavedTakeoffId(takeoffId);
    setSavedItemCount(itemPayloads.length);
    setLastSavedAt(new Date());
    setLastSavedSnapshot(getCurrentSnapshot());
    // Draft stays editable after save — no editMode change
    toast.success(`Takeoff "${title}" saved with ${itemPayloads.length} items`);
    return true;
  };

  // ── ensureSavedThen wrapper ──
  const ensureSavedThen = async (action: () => Promise<void>) => {
    // In read-only/view mode, skip save — generate directly from DB
    if (isReadOnly || (!isDirty && savedTakeoffId)) {
      await action();
      return;
    }
    if (!savedTakeoffId || isDirty) {
      const ok = await handleSaveDraft();
      if (!ok) return;
    }
    await action();
  };

  // ── DOWNLOAD PDF (purely from in-memory state — no save required) ──
  const handleDownloadPdf = () => {
    if (!title.trim()) {
      toast.error("Title is required to generate a PDF");
      return;
    }
    if (!workType) {
      toast.error("Work Type is required to generate a PDF");
      return;
    }
    setDownloadingPdf(true);
    try {
      const itemPayloads = buildItemPayloads();
      generateTakeoffPdf({
        title: title.trim(),
        workType,
        status: takeoffStatus,
        installDate: installDate || null,
        pickupDate: pickupDate || null,
        neededByDate: neededByDate || null,
        notes: notes || null,
        workOrderNumber: linkedWO?.woNumber || null,
        contractedOrAdditional: "contracted",
        projectName: info?.projectName,
        etcJobNumber: info?.etcJobNumber?.toString() || "",
        customerName: info?.customerName,
        customerJobNumber: info?.customerJobNumber,
        customerPM: info?.customerPM,
        projectOwner: info?.projectOwner,
        county: info?.county,
        etcBranch: info?.etcBranch,
        etcProjectManager: info?.etcProjectManager,
        items: itemPayloads.map((i) => ({
          product_name: i.productName,
          category: i.category,
          unit: i.unit,
          quantity: i.quantity,
          notes: i.notes || "",
          material: i.material,
        })),
      });
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ── Validate structure selection on sign rows ──
  const validateSignRowsForSubmit = (destination: "build_shop" | "sign_shop"): string | null => {
    if (destination === "build_shop") {
      // MPT / Flagging: every sign row must have a structureType selected
      for (const sectionKey of activeSections) {
        const rows = signRows[sectionKey] || [];
        for (const row of rows) {
          if (!row.signDesignation) continue; // skip empty rows
          if (!row.structureType) {
            const section = MPT_SECTIONS.find((s) => s.key === sectionKey);
            return `Structure is required for every sign in "${section?.label || sectionKey}". Please select a structure for "${row.signDesignation || "unnamed sign"}".`;
          }
        }
      }
    }
    if (destination === "sign_shop") {
      // Perm signs: every row must have a sign designation
      for (const itemNum of activePermItems) {
        const rows = permSignRows[itemNum] || [];
        for (const row of rows) {
          if (!row.signDesignation) {
            return `Sign designation is required for every row in Perm Signs item "${itemNum}".`;
          }
        }
      }
    }
    return null;
  };

  // ── SUBMIT TO BUILD SHOP ──
  const handleSubmitToBuildShop = async () => {
    setSubmittingBuild(true);
    await ensureSavedThen(async () => {
      if (savedItemCount === 0) {
        toast.error("At least one item is required before sending to Build Shop.");
        return;
      }
      // Client-side structure validation
      const validationError = validateSignRowsForSubmit("build_shop");
      if (validationError) {
        toast.error(validationError);
        return;
      }
      try {
        const resp = await supabase.functions.invoke("submit-takeoff-to-build-shop", {
          body: { takeoffId: savedTakeoffId },
        });

        // supabase.functions.invoke returns { data, error }
        // For non-2xx, error is a FunctionsHttpError with context.body containing JSON
        if (resp.error) {
          let parsed: any = null;
          try {
            // The error body may be in resp.error.context?.body (string) or resp.data may have it
            const rawBody = (resp.error as any)?.context?.body;
            parsed = rawBody ? JSON.parse(rawBody) : null;
          } catch {
            // If parsing fails, try resp.data which sometimes has the JSON
            parsed = resp.data;
          }

          console.error("[SendToBuildShop] Edge function error", {
            errorMessage: resp.error.message,
            status: (resp.error as any)?.context?.status,
            parsed,
            rawError: resp.error,
          });

          if (parsed?.code === "DUPLICATE_REQUEST") {
            toast.info("Build request already submitted for this takeoff");
            setTakeoffStatus("sent_to_build_shop");
            setEditMode(false);
            return;
          }
          // WORK_ORDER_REQUIRED no longer applies at build shop submission
          if (parsed?.code === "NO_ITEMS") {
            toast.error("Takeoff must contain at least one item before submission.");
            return;
          }
          if (parsed?.code === "MISSING_STRUCTURE") {
            toast.error(parsed.details || "Every sign must have a structure selected before submission.");
            return;
          }
          if (parsed?.code === "INELIGIBLE_WORK_TYPE") {
            toast.error(parsed.details || "Only MPT takeoffs can be sent to Build Shop.");
            return;
          }
          if (parsed?.code === "INVALID_TRANSITION") {
            toast.error(parsed.details || "Takeoff is not in a valid state for submission.");
            return;
          }
          if (parsed?.code === "ACCESS_DENIED") {
            toast.error(parsed.details || "You don't have permission to submit to Build Shop.");
            return;
          }
          if (parsed?.code === "BRANCH_ACCESS_DENIED") {
            toast.error("You don't have access to this branch's Build Shop.");
            return;
          }

          // Generic fallback
          toast.error(parsed?.details || parsed?.error || resp.error.message || "Failed to submit to build shop");
          return;
        }

        // Success path — data is the JSON response
        const data = resp.data;
        if (data?.code === "DUPLICATE_REQUEST") {
          toast.info("Build request already submitted for this takeoff");
          setTakeoffStatus("sent_to_build_shop");
          setEditMode(false);
          return;
        }
        if (data?.buildRequestId) {
          // Use server-confirmed status
          setTakeoffStatus(data.takeoffStatus || "sent_to_build_shop");
          setEditMode(false);
          toast.success("Submitted to Build Shop");
        }
      } catch (err: any) {
        console.error("[SendToBuildShop] Unexpected error", err);
        toast.error("Failed to submit to build shop");
      }
    });
    setSubmittingBuild(false);
  };

  // ── SUBMIT TO SIGN SHOP ──
  const handleSubmitToSignShop = async () => {
    setSubmittingBuild(true);
    await ensureSavedThen(async () => {
      if (savedItemCount === 0) {
        toast.error("At least one item is required before sending to Sign Shop.");
        return;
      }
      // Client-side sign designation validation
      const validationError = validateSignRowsForSubmit("sign_shop");
      if (validationError) {
        toast.error(validationError);
        return;
      }
      try {
        const resp = await supabase.functions.invoke("submit-takeoff-to-sign-shop", {
          body: { takeoffId: savedTakeoffId },
        });

        if (resp.error) {
          let parsed: any = null;
          try {
            const rawBody = (resp.error as any)?.context?.body;
            parsed = rawBody ? JSON.parse(rawBody) : null;
          } catch {
            parsed = resp.data;
          }

          if (parsed?.code === "NO_ITEMS") {
            toast.error("Takeoff must contain at least one item before submission.");
            return;
          }
          if (parsed?.code === "DESTINATION_MISMATCH") {
            toast.error(parsed.details || "This takeoff should not be sent to Sign Shop.");
            return;
          }
          toast.error(parsed?.details || parsed?.error || resp.error.message || "Failed to submit to sign shop");
          return;
        }

        const data = resp.data;
        if (data?.takeoffId) {
          setTakeoffStatus("sent_to_sign_shop");
          setEditMode(false);
          toast.success("Submitted to Sign Shop");
        }
      } catch (err: any) {
        console.error("[SendToSignShop] Unexpected error", err);
        toast.error("Failed to submit to sign shop");
      }
    });
    setSubmittingBuild(false);
  };

  // ── CANCEL TAKEOFF ──
  const handleCancelTakeoff = async () => {
    if (!savedTakeoffId || !cancelReason) return;
    if (cancelReason === "other" && !cancelNotes.trim()) {
      toast.error("Notes are required when selecting 'Other' as the cancel reason.");
      return;
    }
    setCanceling(true);
    try {
      const resp = await supabase.functions.invoke("cancel-takeoff", {
        body: {
          takeoffId: savedTakeoffId,
          cancelReason,
          cancelNotes: cancelNotes.trim() || null,
        },
      });

      if (resp.error) {
        let parsed: any = null;
        try {
          const rawBody = (resp.error as any)?.context?.body;
          parsed = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          parsed = resp.data;
        }
        toast.error(parsed?.details || parsed?.error || resp.error.message || "Failed to cancel takeoff");
        return;
      }

      setTakeoffStatus("canceled");
      setEditMode(false);
      setShowCancelDialog(false);
      setCancelReason("");
      setCancelNotes("");
      toast.success("Takeoff canceled");
    } catch (err: any) {
      toast.error("Failed to cancel takeoff");
    } finally {
      setCanceling(false);
    }
  };

  const handleGenerateWorkOrder = async () => {
    if (!savedTakeoffId) {
      toast.error("Save the takeoff first");
      return;
    }
    setGeneratingWO(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-work-order-from-takeoff", {
        body: { takeoffId: savedTakeoffId },
      });
      if (error) {
        const body = typeof error === "object" && "message" in error ? error.message : String(error);
        toast.error(`Failed to generate work order: ${body}`);
        return;
      }
      if (data?.code === "WORK_ORDER_EXISTS") {
        setLinkedWO({ id: data.workOrderId, woNumber: data.woNumber });
        toast.info("Work Order already exists for this takeoff");
        return;
      }
      if (data?.workOrderId) {
        setLinkedWO({ id: data.workOrderId, woNumber: data.woNumber });
        toast.success(`Work Order ${data.woNumber} generated`);
        navigate(`/work-order/${data.workOrderId}`);
      }
    } catch (err: any) {
      // Parse response body for edge function errors
      try {
        const parsed = JSON.parse(err?.context?.body || "{}");
        if (parsed.code === "WORK_ORDER_EXISTS") {
          setLinkedWO({ id: parsed.workOrderId, woNumber: parsed.woNumber });
          toast.info("Work Order already exists for this takeoff");
          return;
        }
        toast.error(parsed.error || "Failed to generate work order");
      } catch {
        toast.error("Failed to generate work order");
      }
    } finally {
      setGeneratingWO(false);
    }
  };



  const getAllSigns = () => {
    const ordered: { designation: string; legend: string; dimensions: string; sheeting: string; quantity: number; sqft: number }[] = [];
    const notOrdered: typeof ordered = [];
    // MPT signs
    for (const sectionKey of activeSections) {
      for (const row of signRows[sectionKey] || []) {
        if (!row.signDesignation) continue;
        const sign = {
          designation: row.signDesignation,
          legend: row.signLegend,
          dimensions: row.dimensionLabel || `${row.width}×${row.height}`,
          sheeting: row.sheeting,
          quantity: row.quantity,
          sqft: row.totalSqft,
        };
        if (row.needsOrder) ordered.push(sign); else notOrdered.push(sign);
        for (const sec of row.secondarySigns || []) {
          if (!sec.signDesignation) continue;
          const secSign = {
            designation: sec.signDesignation,
            legend: sec.signLegend,
            dimensions: sec.dimensionLabel || `${sec.width}×${sec.height}`,
            sheeting: sec.sheeting,
            quantity: row.quantity,
            sqft: Math.round(sec.sqft * row.quantity * 100) / 100,
          };
          if (sec.needsOrder) ordered.push(secSign); else notOrdered.push(secSign);
        }
      }
    }
    // Permanent signs
    for (const itemNum of activePermItems) {
      for (const row of permSignRows[itemNum] || []) {
        if (!row.signDesignation) continue;
        const sign = {
          designation: row.signDesignation,
          legend: row.signLegend,
          dimensions: row.dimensionLabel || `${row.width}×${row.height}`,
          sheeting: row.sheeting,
          quantity: row.quantity,
          sqft: row.totalSqft,
        };
        if (row.needsOrder) ordered.push(sign); else notOrdered.push(sign);
        for (const sec of row.secondarySigns || []) {
          if (!sec.signDesignation) continue;
          const secSign = {
            designation: sec.signDesignation,
            legend: sec.signLegend,
            dimensions: sec.dimensionLabel || `${sec.width}×${sec.height}`,
            sheeting: sec.sheeting,
            quantity: row.quantity,
            sqft: Math.round(sec.sqft * row.quantity * 100) / 100,
          };
          if (sec.needsOrder) ordered.push(secSign); else notOrdered.push(secSign);
        }
      }
    }
    return { ordered, notOrdered };
  };


  // WO dialog removed — WO creation happens via dedicated route after takeoff save

  const isMPT = workType === "MPT";
  const isPerm = workType === "PERMANENT_SIGNS";
  const isFlagging = workType === "FLAGGING" || workType === "LANE_CLOSURE";
  const destination = resolveDestination(workType);

  return (
    <div className="space-y-6">
      {/* Page Title Bar — Salesforce-style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {isSubmitted ? "Material Takeoff" : editMode ? (existingTakeoffId ? "Edit Material Takeoff" : "New Material Takeoff") : "Material Takeoff"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {info?.projectName || "Untitled Project"} · {info?.etcJobNumber || "—"}
              {revisionNumber > 1 && <span className="ml-2 font-semibold">· Revision #{revisionNumber}</span>}
            </p>
          </div>
          <span className={`ml-2 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${WORK_TYPE_COLORS[workType] || "bg-muted"}`}>
            {WORK_TYPE_LABEL[workType] || workType}
          </span>
          {isCanceled && (
            <Badge variant="destructive" className="ml-2 text-[10px] gap-1 font-black">
              <Ban className="h-3 w-3" /> CANCELED
            </Badge>
          )}
          {isReadOnly && !editMode && !isCanceled && (
            <Badge variant="outline" className="ml-2 text-[10px] gap-1 border-amber-300 text-amber-700 bg-amber-50">
              <Lock className="h-3 w-3" /> {isSubmitted ? "Submitted" : "View Only"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {/* Status indicators */}
          {savedTakeoffId && (
            <TakeoffStatusBadge status={takeoffStatus} className="mr-1" />
          )}
          {lastSavedAt && (
            <span className="text-[10px] text-muted-foreground mr-2">
              Last saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          <Button variant="outline" size="sm" onClick={onBack}>Back</Button>

          {/* Submitted takeoffs are fully locked — no Edit, no Cancel. Use Create Revision. */}

          {/* Create Revision — shown for submitted takeoffs */}
          {isSubmitted && savedTakeoffId && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                const result = await createRevision(savedTakeoffId);
                if (result) {
                  navigate(`/project/${jobId}/takeoff/${result.takeoffId}`);
                }
              }}
              disabled={creatingRevision}
            >
              {creatingRevision ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
              {creatingRevision ? "Creating…" : "Create Revision"}
            </Button>
          )}

          {/* PRIMARY: Save Draft — visible when not read-only (drafts always, submitted only in edit mode) */}
          {!isReadOnly && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSaveDraft}
              disabled={saving || upsertSaving}
            >
              {saving || upsertSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving || upsertSaving ? "Saving…" : "Save Draft"}
            </Button>
          )}

          {/* SECONDARY: Download PDF */}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download PDF
          </Button>

          {/* Generate Work Order (separate workflow action) */}
          {!isSubmitted && savedTakeoffId && !linkedWO && !isReadOnly && (
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleGenerateWorkOrder} disabled={generatingWO}>
              <FileOutput className="h-3.5 w-3.5" /> {generatingWO ? "Generating…" : "Generate Work Order"}
            </Button>
          )}
          {savedTakeoffId && linkedWO && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/work-order/${linkedWO.id}`)}>
              <ExternalLink className="h-3.5 w-3.5" /> View WO {linkedWO.woNumber}
            </Button>
          )}

          {/* SECONDARY: Submit — route based on destination */}
          {editMode && !isSubmitted && !isCanceled && destination === "build_shop" && (
            <div className="relative group inline-flex">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={handleSubmitToBuildShop}
                disabled={submittingBuild || saving || (savedTakeoffId != null && savedItemCount === 0)}
              >
                {submittingBuild ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {submittingBuild ? "Submitting…" : "Send to Build Shop"}
              </Button>
              {savedTakeoffId && savedItemCount === 0 && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-foreground text-background px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  Add at least one item before sending to Build Shop.
                </span>
              )}
            </div>
          )}
          {editMode && !isSubmitted && !isCanceled && destination === "sign_shop" && (
            <div className="relative group inline-flex">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={handleSubmitToSignShop}
                disabled={submittingBuild || saving || (savedTakeoffId != null && savedItemCount === 0)}
              >
                {submittingBuild ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {submittingBuild ? "Submitting…" : "Send to Sign Shop"}
              </Button>
              {savedTakeoffId && savedItemCount === 0 && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-foreground text-background px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  Add at least one item before sending to Sign Shop.
                </span>
              )}
            </div>
          )}

          {/* Cancel Takeoff — for any non-canceled saved takeoff (draft or submitted) */}
          {!isCanceled && savedTakeoffId && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => setShowCancelDialog(true)}
            >
              <Ban className="h-3.5 w-3.5" /> Cancel Takeoff
            </Button>
          )}
        </div>
      </div>

      {/* Canceled banner */}
      {isCanceled && savedTakeoffId && (
        <div className="rounded-lg border px-4 py-3 flex items-center justify-between text-sm bg-destructive/10 border-destructive/30 text-destructive">
          <div className="flex items-center gap-3">
            <Ban className="h-4 w-4 shrink-0" />
            <span>
              <strong>This takeoff has been canceled.</strong>
              {manufacturingStarted
                ? " Manufacturing started—cannot reopen. Create a revision instead."
                : " You can reopen it to edit and re-submit."}
            </span>
          </div>
          {!manufacturingStarted && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={async () => {
                const ok = await reopenTakeoff(savedTakeoffId);
                if (ok) {
                  setTakeoffStatus("draft");
                  setEditMode(true);
                  toast.success("Takeoff reopened as draft");
                }
              }}
              disabled={reopeningTakeoff}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {reopeningTakeoff ? "Reopening…" : "Reopen"}
            </Button>
          )}
        </div>
      )}

      {/* Submitted banner — only for locked submitted takeoffs */}
      {isSubmitted && !editMode && savedTakeoffId && (
        <div className="rounded-lg border px-4 py-3 flex items-center gap-3 text-sm bg-blue-50 border-blue-200 text-blue-800">
          <Lock className="h-4 w-4 shrink-0" />
          <span><strong>Submitted to {destination === "sign_shop" ? "Sign Shop" : "Build Shop"}.</strong> This takeoff is locked. Use "Create Revision" to make changes.</span>
        </div>
      )}

      {/* Project Info Card */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Information</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-xs">
            <AdminField label="Branch" value={dbJob?.etc_branch || "—"} />
            <AdminField label="ETC Project Manager" value={dbJob?.etc_project_manager || "—"} />
            <AdminField label="ETC Job #" value={info?.etcJobNumber || "—"} mono />
            <AdminField label="County" value={info?.county || "—"} />
            <AdminField label="Customer" value={info?.customerName || "—"} />
            <AdminField label="Customer PM / POC" value={info?.customerPM || "—"} />
            <AdminField label="Customer Job #" value={info?.customerJobNumber || "—"} />
            <AdminField label="Owner" value={info?.projectOwner || "—"} />
            <AdminField label="Owner Contract #" value={info?.contractNumber || "—"} />
          </div>
        </div>
      </div>

      {/* Takeoff Details Card */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Takeoff Details</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Takeoff Title *</label>
              <Input className="h-9 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Phase 1 MPT Setup" disabled={isReadOnly} aria-invalid={submitAttempted && !title.trim()} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Work Type * {isWorkTypeLocked && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
              </label>
              <Select value={workType} onValueChange={handleWorkTypeChange} disabled={isReadOnly || isWorkTypeLocked}>
                <SelectTrigger className="h-9 text-sm" aria-invalid={submitAttempted && !workType}><SelectValue placeholder="Choose Work Type" /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((wt) => (
                    <SelectItem key={wt.value} value={wt.value}>{wt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isWorkTypeLocked && (
                <p className="text-[10px] text-muted-foreground mt-1">Work type cannot be changed after creation. Create a revision if needed.</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Order #</label>
              {linkedWO ? (
                <button
                  onClick={() => navigate(`/work-order/${linkedWO.id}`)}
                  className="h-9 flex items-center gap-1.5 px-3 rounded-md border bg-muted/50 text-sm text-primary font-mono hover:underline"
                >
                  {linkedWO.woNumber} <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                  {savedTakeoffId ? "Not generated yet" : "Save takeoff first"}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Contracted / Additional <span className="text-muted-foreground font-normal normal-case">(from Work Order)</span>
              </label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                Not set (create Work Order to set)
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-xs mt-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {isFlagging ? "Job Start Date" : "Install Date"}
              </label>
              <Input type="date" className="h-9 text-sm" value={installDate} onChange={(e) => handleInstallDateChange(e.target.value)} max={pickupDate || endDate || undefined} disabled={isReadOnly} />
            </div>
            {isFlagging && (
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    id="multi-day"
                    checked={isMultiDay}
                    onCheckedChange={(checked) => {
                      setIsMultiDay(!!checked);
                      if (!checked) setEndDate("");
                    }}
                    disabled={isReadOnly}
                  />
                  <label htmlFor="multi-day" className="text-xs font-medium text-foreground cursor-pointer select-none">Multi-Day Job</label>
                </div>
              </div>
            )}
            {isFlagging && isMultiDay && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">End Date</label>
                <Input type="date" className="h-9 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={installDate || undefined} disabled={isReadOnly} />
              </div>
            )}
            {!isPerm && !isFlagging && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Pick Up Date</label>
                <Input type="date" className="h-9 text-sm" value={pickupDate} onChange={(e) => handlePickupDateChange(e.target.value)} min={installDate || undefined} disabled={isReadOnly} />
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Needed By Date</label>
              <Input type="date" className="h-9 text-sm" value={neededByDate} onChange={(e) => {
                const val = e.target.value;
                if (installDate && val && val >= installDate) {
                  setDateWarning("Needed-by date must be before the install date");
                  return;
                }
                setDateWarning(null);
                setNeededByDate(val);
              }} max={installDate ? (() => { const d = new Date(installDate); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; })() : undefined} disabled={isReadOnly} />
              <p className="text-[10px] text-muted-foreground mt-1">Internal suspense date for build/sign shop prioritization</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Priority</label>
              <Select value={takeoffPriority} onValueChange={(v) => setTakeoffPriority(v as "urgent" | "standard" | "low")} disabled={isReadOnly}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">Sets production priority for Build / Sign Shop</p>
            </div>
            {dateWarning && (
              <div className="col-span-2 md:col-span-4 flex items-center gap-1.5 text-destructive">
                <p className="text-[11px] font-medium">⚠ {dateWarning}</p>
              </div>
            )}
            {isPerm && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Mobilization #</label>
                <Input type="number" min={1} className="h-9 text-sm w-24" value={mobilizationNumber} onChange={(e) => setMobilizationNumber(Math.max(1, parseInt(e.target.value) || 1))} disabled={isReadOnly} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MPT / Flagging Sign Sections */}
      {(isMPT || isFlagging) && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isFlagging ? "Sign Configuration" : "MPT Sign Configuration"}</h2>
            {!isReadOnly && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Default Material:</span>
                <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
                  {SIGN_MATERIALS.map((m) => (
                    <button key={m.value} onClick={() => setDefaultSignMaterial(m.value)} className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${defaultSignMaterial === m.value ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground border border-transparent"}`}>
                      {m.abbrev}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setShowApplyMaterialDialog(true)}>
                  Apply to All
                </Button>
              </div>
            )}
          </div>
          <div className="flex">
            <div className="w-[200px] shrink-0 border-r p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Structure Types</h4>
              <div className="space-y-2">
                {MPT_SECTIONS.map((section) => {
                  const active = activeSections.includes(section.key);
                  return (
                    <label key={section.key} className={`flex items-center gap-2 select-none ${isReadOnly ? "opacity-60 cursor-default" : "cursor-pointer"}`} onClick={() => !isReadOnly && toggleSection(section.key)}>
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${active ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"}`}>
                        {active && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="text-xs font-medium text-foreground">{section.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 min-w-0 p-4">
              {activeSections.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Select a structure type</p>
                  <p className="text-xs text-muted-foreground mt-1">Click a structure type on the left to start building your MPT takeoff.</p>
                </div>
              ) : (
                activeSections.map((sectionKey) => {
                  const section = MPT_SECTIONS.find((s) => s.key === sectionKey)!;
                  const sectionSandbags = (signRows[sectionKey] || []).reduce((total, row) => {
                    const bags = SANDBAG_MAP[row.structureType] || 0;
                    return total + bags * row.quantity;
                  }, 0);
                  return (
                    <div key={sectionKey}>
                      <MPTSignTable sectionTitle={section.label} structureOptions={section.structures} rows={signRows[sectionKey] || []} onRowsChange={(rows) => setSignRows((prev) => ({ ...prev, [sectionKey]: rows }))} orderable={sectionKey === "type_iii"} disabled={isReadOnly} defaultMaterial={defaultSignMaterial} />
                      {sectionSandbags > 0 && (
                        <div className="mt-1.5 mb-4 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sand Bags</span>
                          <span className="text-sm font-bold tabular-nums text-amber-700">{sectionSandbags}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permanent Signs Sections */}
      {isPerm && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permanent Sign Configuration</h2>
          </div>
          <div className="flex">
            <div className="w-[240px] shrink-0 border-r p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Item Numbers</h4>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {allPermItems.map((item) => {
                  const active = activePermItems.includes(item.itemNumber);
                  return (
                    <label key={item.itemNumber} className={`flex items-center gap-2 select-none ${isReadOnly ? "opacity-60 cursor-default" : "cursor-pointer"}`} onClick={() => !isReadOnly && togglePermItem(item.itemNumber)}>
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${active ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"}`}>
                        {active && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-medium text-foreground">{item.itemNumber}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{item.displayName}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {!isReadOnly && (
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs mt-3 w-full" onClick={() => setShowAddCustomItemDialog(true)}>
                  <Plus className="h-3 w-3" /> Custom Item
                </Button>
              )}
            </div>
            <div className="flex-1 min-w-0 p-4">
              {activePermItems.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Select an item number</p>
                  <p className="text-xs text-muted-foreground mt-1">Click an item number on the left to start building your permanent signs takeoff.</p>
                </div>
              ) : (
                activePermItems.map((itemNum) => {
                  const item = allPermItems.find((i) => i.itemNumber === itemNum)!;
                  return (
                    <PermanentSignTable key={itemNum} sectionTitle={item.displayName} itemNumber={item.itemNumber} rows={permSignRows[itemNum] || []} onRowsChange={(rows) => setPermSignRows((prev) => ({ ...prev, [itemNum]: rows }))} showSignPicker={item.needsSignPicker} disabled={isReadOnly} />
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flagging / Lane Closure — Vehicles */}
      {isFlagging && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vehicles</h2>
            </div>
            {!isReadOnly && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                onClick={() =>
                  setVehicleItems((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), vehicleType: "", quantity: 1 },
                  ])
                }
              >
                <Plus className="h-3 w-3" /> Add Vehicle
              </Button>
            )}
          </div>
          <div className="p-5">
            {vehicleItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Truck className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No vehicles assigned</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add Vehicle" to assign trucks, TMAs, etc.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicleItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-md border bg-background">
                    <Select
                      value={item.vehicleType}
                      onValueChange={(v) =>
                        setVehicleItems((prev) =>
                          prev.map((vi) => (vi.id === item.id ? { ...vi, vehicleType: v } : vi))
                        )
                      }
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="h-8 text-xs w-[220px]">
                        <SelectValue placeholder="Select vehicle type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {FLAGGING_VEHICLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground font-medium">Qty</span>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-16 text-xs"
                        value={item.quantity}
                        onChange={(e) =>
                          setVehicleItems((prev) =>
                            prev.map((vi) =>
                              vi.id === item.id
                                ? { ...vi, quantity: Math.max(1, parseInt(e.target.value) || 1) }
                                : vi
                            )
                          )
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                    {!isReadOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-auto"
                      onClick={() => setVehicleItems((prev) => prev.filter((vi) => vi.id !== item.id))}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flagging / Lane Closure — Rolling Stock */}
      {isFlagging && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Container className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rolling Stock</h2>
            </div>
            {!isReadOnly && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                onClick={() =>
                  setRollingStockItems((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), equipmentId: "", equipmentLabel: "" },
                  ])
                }
              >
                <Plus className="h-3 w-3" /> Add Equipment
              </Button>
            )}
          </div>
          <div className="p-5">
            {rollingStockItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Container className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No rolling stock selected</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add Equipment" to select from available rental inventory.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rollingStockItems.map((item) => {
                  // Filter out already-selected equipment (except the current row's selection)
                  const selectedIds = rollingStockItems
                    .filter((rs) => rs.id !== item.id && rs.equipmentId)
                    .map((rs) => rs.equipmentId);
                  const filteredEquipment = availableEquipment.filter(
                    (eq) => !selectedIds.includes(eq.id)
                  );

                  // Group by category
                  const groupedEquipment = filteredEquipment.reduce<Record<string, typeof filteredEquipment>>((acc, eq) => {
                    if (!acc[eq.category]) acc[eq.category] = [];
                    acc[eq.category].push(eq);
                    return acc;
                  }, {});

                  return (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-md border bg-background">
                      {isReadOnly ? (
                        <div className="h-8 text-xs flex-1 min-w-[300px] flex items-center px-3 rounded-md border bg-muted/50 text-foreground">
                          {item.equipmentId ? (
                            <span className="truncate">{item.equipmentLabel}</span>
                          ) : (
                            <span className="text-muted-foreground">No equipment selected</span>
                          )}
                        </div>
                      ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="h-8 text-xs flex-1 min-w-[300px] justify-between font-normal"
                          >
                            {item.equipmentId ? (
                              <span className="truncate">{item.equipmentLabel}</span>
                            ) : (
                              <span className="text-muted-foreground">Search equipment…</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[450px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search by number, type, make…" className="h-9 text-xs" />
                            <CommandList>
                              <CommandEmpty>No available equipment found.</CommandEmpty>
                              {Object.entries(groupedEquipment).map(([category, items]) => (
                                <CommandGroup key={category} heading={category}>
                                  {items.map((eq) => (
                                    <CommandItem
                                      key={eq.id}
                                      value={`${eq.equipment_number} ${eq.equipment_type} ${eq.make} ${eq.model} ${eq.category}`}
                                      onSelect={() => {
                                        setRollingStockItems((prev) =>
                                          prev.map((rs) =>
                                            rs.id === item.id
                                              ? {
                                                  ...rs,
                                                  equipmentId: eq.id,
                                                  equipmentLabel: `${eq.equipment_number} — ${eq.category} ${eq.equipment_type} (${eq.make} ${eq.model})`,
                                                }
                                              : rs
                                          )
                                        );
                                      }}
                                      className="text-xs"
                                    >
                                      <Check
                                        className={`mr-2 h-3 w-3 ${item.equipmentId === eq.id ? "opacity-100" : "opacity-0"}`}
                                      />
                                      <span className="font-mono">{eq.equipment_number}</span>
                                      <span className="text-muted-foreground ml-2">
                                        {eq.equipment_type} · {eq.make} {eq.model}
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      )}
                      {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRollingStockItems((prev) => prev.filter((rs) => rs.id !== item.id))}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/30 px-5 py-3 flex items-center justify-between border-b">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Additional Items</h2>
          {!isReadOnly && (
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={addAdditionalItem}>
              <Plus className="h-3 w-3" /> Add Item
            </Button>
          )}
        </div>

        {calculatedSandbags > 0 && (
          <div className="px-5 py-2.5 flex items-center gap-3 border-b bg-warning/5">
            <span className="text-xs font-medium text-foreground">SAND BAGS</span>
            <span className="text-xs font-bold tabular-nums text-warning">{calculatedSandbags}</span>
            <span className="text-[10px] text-muted-foreground italic">auto-calculated from structures</span>
          </div>
        )}

        {additionalItems.length === 0 && calculatedSandbags === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">No additional items.</div>
        ) : (
          <div className="divide-y">
            {additionalItems.map((item) => (
              <div key={item.id} className="px-5 py-2.5 flex items-center gap-3">
                <Select value={item.name} onValueChange={(v) => updateAdditionalItem(item.id, { name: v })} disabled={isReadOnly}>
                  <SelectTrigger className="h-8 text-xs w-[260px]"><SelectValue placeholder="Select item…" /></SelectTrigger>
                  <SelectContent>
                    {(isPerm ? PERM_ADDITIONAL_ITEM_OPTIONS : MPT_ADDITIONAL_ITEM_OPTIONS).map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                    <SelectItem value="__custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {item.name === "__custom" && (
                  <Input className="h-8 text-xs w-[160px]" value={item.description} onChange={(e) => updateAdditionalItem(item.id, { description: e.target.value })} placeholder="Custom item name" disabled={isReadOnly} />
                )}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Qty</span>
                  <Input type="number" min={1} className="h-8 w-16 text-xs" value={item.quantity} onChange={(e) => updateAdditionalItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} disabled={isReadOnly} />
                </div>
                {item.name !== "__custom" && (
                  <Input className="h-8 text-xs flex-1" value={item.description} onChange={(e) => updateAdditionalItem(item.id, { description: e.target.value })} placeholder="Notes (optional)" disabled={isReadOnly} />
                )}
                {!isReadOnly && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeAdditionalItem(item.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Card */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Crew Notes</label>
            <Textarea value={crewNotes} onChange={(e) => setCrewNotes(e.target.value)} placeholder="Notes for the road crew…" rows={2} className="text-sm" disabled={isReadOnly} />
            <p className="text-[10px] text-muted-foreground mt-1">Visible to road crew on dispatches</p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Build Shop Notes</label>
            <Textarea value={buildShopNotes} onChange={(e) => setBuildShopNotes(e.target.value)} placeholder="Internal notes for the build shop…" rows={2} className="text-sm" disabled={isReadOnly} />
            <p className="text-[10px] text-muted-foreground mt-1">Sent with the build request submission</p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">PM Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Personal notes (PM only)…" rows={2} className="text-sm" disabled={isReadOnly} />
            <p className="text-[10px] text-muted-foreground mt-1">Private notes for your reference only</p>
          </div>
        </div>
      </div>


      {/* WO dialog removed — WO creation now happens via /takeoff/:id/work-order/new */}

      {/* Work Type Change Confirmation Dialog */}
      <Dialog open={showWorkTypeChangeDialog} onOpenChange={setShowWorkTypeChangeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Work Type?</DialogTitle>
            <DialogDescription>
              You have items entered for the current work type. Switching will clear all sign rows and additional items. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowWorkTypeChangeDialog(false); setPendingWorkType(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmWorkTypeChange}>
              Clear &amp; Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Custom Item Number Dialog */}
      <Dialog open={showAddCustomItemDialog} onOpenChange={setShowAddCustomItemDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Item Number</DialogTitle>
            <DialogDescription>
              Enter the item number and choose whether it uses square footage (sign picker) or each (quantity only).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Item Number</Label>
              <Input
                className="h-8 text-sm"
                value={customItemNumber}
                onChange={(e) => setCustomItemNumber(e.target.value)}
                placeholder="e.g. 0933-0001"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Input
                className="h-8 text-sm"
                value={customItemDescription}
                onChange={(e) => setCustomItemDescription(e.target.value)}
                placeholder="e.g. POST MOUNTED SIGNS, TYPE D"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Unit of Measure</Label>
              <RadioGroup value={customItemUomType} onValueChange={(v) => setCustomItemUomType(v as "SF" | "EA")} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="SF" id="uom-sf" />
                  <Label htmlFor="uom-sf" className="text-xs cursor-pointer">
                    <span className="font-medium">SF</span>
                    <span className="text-muted-foreground ml-1">— pick signs</span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="EA" id="uom-ea" />
                  <Label htmlFor="uom-ea" className="text-xs cursor-pointer">
                    <span className="font-medium">EA</span>
                    <span className="text-muted-foreground ml-1">— quantities only</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomItemDialog(false)}>Cancel</Button>
            <Button onClick={addCustomPermItem} disabled={!customItemNumber.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Material to All Signs Dialog */}
      <Dialog open={showApplyMaterialDialog} onOpenChange={setShowApplyMaterialDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply Material to All Signs?</DialogTitle>
            <DialogDescription>
              This will set all existing sign items to <strong>{abbreviateMaterial(defaultSignMaterial)}</strong> ({defaultSignMaterial}). You can still override individual signs after.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyMaterialDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              // Apply to all MPT sign rows
              const newSignRows = { ...signRows };
              for (const key of Object.keys(newSignRows)) {
                newSignRows[key] = newSignRows[key].map(r => ({ ...r, material: defaultSignMaterial }));
              }
              setSignRows(newSignRows);
              // Perm signs are always ALUMINUM — skip them
              setShowApplyMaterialDialog(false);
              toast.success(`All signs set to ${abbreviateMaterial(defaultSignMaterial)}`);
            }}>
              Apply to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Takeoff AlertDialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Takeoff
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel this takeoff and archive any linked build requests. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Cancel Reason *</label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a reason…" /></SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Notes {cancelReason === "other" ? "*" : "(optional)"}
              </label>
              <Textarea
                className="min-h-[60px] text-sm"
                placeholder="Additional details…"
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCancelReason(""); setCancelNotes(""); }}>
              Keep Takeoff
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelTakeoff}
              disabled={!cancelReason || (cancelReason === "other" && !cancelNotes.trim()) || canceling}
            >
              {canceling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
              {canceling ? "Canceling…" : "Cancel Takeoff"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const AdminField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="min-h-[2.5rem]">
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 leading-tight">{label}</span>
    <span className={`text-sm font-medium leading-snug block truncate ${mono ? "font-mono text-primary" : "text-foreground"}`}>{value}</span>
  </div>
);
