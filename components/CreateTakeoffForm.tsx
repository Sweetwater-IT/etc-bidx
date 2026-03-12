import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { ClipboardList, Save, Download, Send, ArrowLeft, Check, Package, Plus, Minus, Trash2, ChevronsUpDown, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MPTSignTable, type MPTSignRow } from "@/components/MPTSignTable";
import { MPTSignConfiguration } from "@/components/MPTSignConfiguration";
import { PermanentSignConfiguration, type PermSignRow, type PermEntryRow } from "@/components/PermanentSignConfiguration";
import { SignMaterial, DEFAULT_SIGN_MATERIAL } from "@/utils/signMaterial";
import { SaveStatusIndicator } from "@/app/l/components/SaveStatusIndicator";
import { QuantityInput } from "@/components/ui/quantity-input";

interface Props {
  jobId: string;
  onBack: () => void;
  draftTakeoff?: any;
  stickyHeader?: boolean;
  mode?: "create" | "edit";
}

const WORK_TYPES = [
  { value: "MPT", label: "MPT (Maintenance & Protection of Traffic)" },
  { value: "PERMANENT_SIGNS", label: "Permanent Signs" },
  { value: "FLAGGING", label: "Flagging" },
  { value: "LANE_CLOSURE", label: "Lane Closure" },
  { value: "SERVICE", label: "Service" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "CUSTOM", label: "Custom" },
  { value: "RENTAL", label: "Rental" },
];

const normalizeSovWorkTypeToTakeoffValue = (workType?: string | null): string | null => {
  if (!workType) return null;

  const normalized = workType.trim().toUpperCase();

  const mapping: Record<string, string> = {
    MPT: "MPT",
    "PERMANENT SIGN": "PERMANENT_SIGNS",
    "PERMANENT SIGNS": "PERMANENT_SIGNS",
    FLAGGING: "FLAGGING",
    "LANE CLOSURE": "LANE_CLOSURE",
    SERVICE: "SERVICE",
    DELIVERY: "DELIVERY",
    CUSTOM: "CUSTOM",
    OTHER: "CUSTOM",
  };

  return mapping[normalized] || null;
};

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

const SIGN_MATERIALS = [
  { value: "PLASTIC", label: "Plastic", abbrev: "PL" },
  { value: "ALUMINUM", label: "Aluminum", abbrev: "AL" },
];

const getSandbagsForRow = (sectionKey: string, structureType: string, quantity: number) => {
  if (!structureType) return 0;
  if (sectionKey === "trailblazers") {
    return structureType.toUpperCase().includes("H-STAND") ? 6 * quantity : 0;
  }
  if (sectionKey === "type_iii") {
    return structureType === "Loose" ? 0 : 12 * quantity;
  }
  return 0;
};

const FLAGGING_VEHICLE_OPTIONS = [
  { id: "pickup_truck", name: "Pick Up Truck" },
  { id: "tma", name: "TMA" },
  { id: "message_board", name: "Message Board" },
  { id: "arrow_panel", name: "Arrow Panel" },
  { id: "speed_trailer", name: "Speed Trailer" },
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

export const CreateTakeoffForm = ({ jobId, onBack, draftTakeoff, stickyHeader = false, mode = "create" }: Props) => {
  const router = useRouter();
  const { data: dbJob, isLoading } = useJobFromDB(jobId);
  const { user } = useAuth();
  const info = dbJob?.projectInfo;

  // Fetch allowed work types from job's SOV entries
  const [allowedWorkTypes, setAllowedWorkTypes] = useState<string[]>([]);
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(true);

  // Fetch allowed work types when jobId is available
  useEffect(() => {
    const fetchAllowedWorkTypes = async () => {
      if (!jobId) return;

      try {
        const response = await fetch(`/api/l/jobs/${jobId}/sov-items`);
        if (response.ok) {
          const data = await response.json();
          const workTypes = [
            ...new Set(
              (data.data || [])
                .map((item: any) => normalizeSovWorkTypeToTakeoffValue(item.work_type))
                .filter((wt): wt is string => Boolean(wt))
            ),
          ] as string[];
          setAllowedWorkTypes(workTypes);
        } else {
          // If no SOV items exist, allow all work types (backward compatibility)
          setAllowedWorkTypes(WORK_TYPES.map(wt => wt.value));
        }
      } catch (error) {
        console.error('Error fetching SOV items for work types:', error);
        // Allow all work types on error
        setAllowedWorkTypes(WORK_TYPES.map(wt => wt.value));
      } finally {
        setLoadingWorkTypes(false);
      }
    };

    fetchAllowedWorkTypes();
  }, [jobId]);

  const [title, setTitle] = useState("");
  const [workType, setWorkType] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [contractedOrAdditional, setContractedOrAdditional] = useState("contracted");
  const [installDate, setInstallDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [neededByDate, setNeededByDate] = useState("");
  const [priority, setPriority] = useState("standard");
  const [mobilizationNumber, setMobilizationNumber] = useState(1);
  const [isMultiDayJob, setIsMultiDayJob] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [crewNotes, setCrewNotes] = useState("");
  const [buildShopNotes, setBuildShopNotes] = useState("");
  const [pmNotes, setPmNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [takeoffSaved, setTakeoffSaved] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [savedTakeoffId, setSavedTakeoffId] = useState<string | null>(null);
  const [workOrderExists, setWorkOrderExists] = useState(false);
  const [showWorkTypeChangeDialog, setShowWorkTypeChangeDialog] = useState(false);
  const [pendingWorkType, setPendingWorkType] = useState<string | null>(null);
  const [workTypeSelectedAt, setWorkTypeSelectedAt] = useState<Date | null>(null);
  const hasCreatedTakeoff = Boolean(savedTakeoffId);
  const isEditMode = mode === "edit";

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [titleEnteredAt, setTitleEnteredAt] = useState<Date | null>(null);
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // MPT Configuration State
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [signRows, setSignRows] = useState<Record<string, MPTSignRow[]>>({});
  const [defaultSignMaterial, setDefaultSignMaterial] = useState<SignMaterial>(DEFAULT_SIGN_MATERIAL);

  // Permanent Signs Configuration State
  const [activePermanentItems, setActivePermanentItems] = useState<string[]>([]);
  const [permanentSignRows, setPermanentSignRows] = useState<Record<string, PermSignRow[]>>({});
  const [permanentEntryRows, setPermanentEntryRows] = useState<Record<string, PermEntryRow[]>>({});
  const [defaultPermanentSignMaterial, setDefaultPermanentSignMaterial] = useState<SignMaterial>("ALUMINUM");

  // Flagging/Lane Closure State
  const [vehicleItems, setVehicleItems] = useState<{ id: string; vehicleType: string; quantity: number }[]>([]);
  const [rollingStockItems, setRollingStockItems] = useState<{ id: string; equipmentId: string; equipmentLabel: string }[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<{
    id: string; equipment_number: string; category: string; equipment_type: string;
    make: string; model: string; status: string; rental_rate: number | null;
    availability: "available" | "soon" | "unavailable";
    availability_note: string;
  }[]>([]);

  // Additional Items State
  const [additionalItems, setAdditionalItems] = useState<{ id: string; name: string; quantity: number; description: string }[]>([]);

  // Debugging refs
  const mptContainerRef = useRef<HTMLDivElement>(null);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!title.trim() || !workType || !dbJob || saving) return;

    setSaveStatus('saving');
    try {
      const response = await fetch('/api/l/takeoffs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          title,
          workType,
          workOrderNumber,
          workOrderId,
          contractedOrAdditional,
          installDate,
          pickupDate,
          neededByDate,
          isMultiDayJob,
          endDate,
          priority,
          notes,
          crewNotes,
          buildShopNotes,
          pmNotes,
          // Include MPT sign data
          activeSections,
          signRows,
          defaultSignMaterial,
          // Include permanent signs data
          activePermanentItems,
          permanentSignRows,
          permanentEntryRows,
          defaultPermanentSignMaterial,
          // Include flagging/lane closure data
          vehicleItems,
          rollingStockItems,
          additionalItems,
          // Include takeoffId for updates
          takeoffId: savedTakeoffId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to auto-save takeoff');
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
      const newTakeoffId = data.takeoff.id as string;
      setSavedTakeoffId(newTakeoffId);
      setHasUnsavedChanges(false);
      if (!savedTakeoffId && newTakeoffId) {
        router.replace(`/l/${jobId}/takeoffs/edit/${newTakeoffId}`);
      }
    } catch (error) {
      console.error("Error auto-saving takeoff:", error);
      setSaveStatus('error');
    }
  }, [
    title, workType, dbJob, saving, jobId, workOrderNumber, workOrderId, contractedOrAdditional,
    installDate, pickupDate, neededByDate, isMultiDayJob, endDate, priority, notes, crewNotes, buildShopNotes, pmNotes,
    activeSections, signRows, defaultSignMaterial, activePermanentItems, permanentSignRows,
    permanentEntryRows, defaultPermanentSignMaterial, vehicleItems, rollingStockItems,
    additionalItems, savedTakeoffId, router
  ]);

  // Debounced auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && title.trim() && workType) {
      const now = Date.now();
      const latestTrigger = Math.max(
        titleEnteredAt?.getTime() ?? 0,
        workTypeSelectedAt?.getTime() ?? 0
      );
      const shouldDelay = !savedTakeoffId && latestTrigger > 0 && now - latestTrigger < 2000;
      const delay = shouldDelay ? 2000 - (now - latestTrigger) : 2000;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, Math.max(0, delay));
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, title, workType, autoSave, savedTakeoffId, titleEnteredAt, workTypeSelectedAt]);

  // Mark as having unsaved changes when form data changes
  useEffect(() => {
    if (title || workType || activeSections.length > 0 || Object.keys(signRows).length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [title, workType, activeSections, signRows, activePermanentItems, permanentSignRows, permanentEntryRows, vehicleItems, rollingStockItems, additionalItems]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Load draft takeoff data when provided
  useEffect(() => {
    if (draftTakeoff) {
      setTitle(draftTakeoff.title || "");
      setWorkType(draftTakeoff.work_type || "");
      setWorkOrderNumber(draftTakeoff.work_order_number || "");
      setWorkOrderId(draftTakeoff.work_order_id || "");
      setContractedOrAdditional(draftTakeoff.contracted_or_additional || "contracted");
      setInstallDate(draftTakeoff.install_date || "");
      setPickupDate(draftTakeoff.pickup_date || "");
      setNeededByDate(draftTakeoff.needed_by_date || "");
      setPriority(draftTakeoff.priority || "standard");
      setNotes(draftTakeoff.notes || "");
      setCrewNotes(draftTakeoff.crew_notes || "");
      setBuildShopNotes(draftTakeoff.build_shop_notes || "");
      setPmNotes(draftTakeoff.pm_notes || "");
      setIsMultiDayJob(Boolean(draftTakeoff.is_multi_day_job));
      setEndDate(draftTakeoff.end_date || "");
      setActiveSections(draftTakeoff.active_sections || []);
      setSignRows(draftTakeoff.sign_rows || {});
      setDefaultSignMaterial(draftTakeoff.default_sign_material || DEFAULT_SIGN_MATERIAL);
      // Load permanent signs data
      setActivePermanentItems(draftTakeoff.active_permanent_items || []);
      setPermanentSignRows(draftTakeoff.permanent_sign_rows || {});
      setPermanentEntryRows(draftTakeoff.permanent_entry_rows || {});
      setDefaultPermanentSignMaterial(draftTakeoff.default_permanent_sign_material || "ALUMINUM");
      setVehicleItems(draftTakeoff.vehicle_items || []);
      setRollingStockItems(draftTakeoff.rolling_stock_items || []);
      setAdditionalItems(draftTakeoff.additional_items || []);
      setSavedTakeoffId(draftTakeoff.id);
      setTakeoffSaved(true);
      setSaveStatus('saved');
      setLastSaved(draftTakeoff.updated_at ? new Date(draftTakeoff.updated_at) : new Date());
    }
  }, [draftTakeoff]);

  // Debugging: Log container dimensions
  useEffect(() => {
    const logDimensions = () => {
      if (mptContainerRef.current) {
        const rect = mptContainerRef.current.getBoundingClientRect();
        console.log('MPT Container Dimensions:', {
          clientWidth: mptContainerRef.current.clientWidth,
          clientHeight: mptContainerRef.current.clientHeight,
          scrollWidth: mptContainerRef.current.scrollWidth,
          scrollHeight: mptContainerRef.current.scrollHeight,
          scrollLeft: mptContainerRef.current.scrollLeft,
          scrollTop: mptContainerRef.current.scrollTop,
          boundingRect: rect,
          overflow: window.getComputedStyle(mptContainerRef.current).overflow,
          overflowX: window.getComputedStyle(mptContainerRef.current).overflowX,
          overflowY: window.getComputedStyle(mptContainerRef.current).overflowY,
        });
      }
    };

    // Log on mount and resize
    logDimensions();
    window.addEventListener('resize', logDimensions);

    return () => window.removeEventListener('resize', logDimensions);
  }, [workType]);

  // Log when sign rows change (add sign clicked)
  useEffect(() => {
    console.log('Sign rows changed:', signRows);
  }, [signRows]);

  // Fetch rental equipment - simplified to show all equipment as available
  useEffect(() => {
    if (workType === "FLAGGING" || workType === "LANE_CLOSURE" || (workType === "DELIVERY" || workType === "RENTAL") && installDate) {
      const fetchEquipment = async () => {
        try {
          console.log('🔍 DEBUG - Starting equipment fetch');
          console.log('🔍 DEBUG - workType:', workType);

          const eqRes = await fetch('/api/l/rental-equipment');
          console.log('📡 API eqRes.status:', eqRes.status, 'ok:', eqRes.ok);

          if (!eqRes.ok) {
            console.error('❌ API Error - rental-equipment:', await eqRes.text());
            return;
          }

          const eqData = await eqRes.json();
          console.log('📦 Raw eqData:', eqData);

          const allEq = eqData.data || [];
          console.log('🔢 allEq.length:', allEq.length);

          if (allEq.length === 0) {
            console.warn('⚠️ No equipment data returned from API');
          }

          console.log('📋 Sample equipment items:', allEq.slice(0, 3));

          // Mark all equipment as available (simplified logic)
          const enriched = allEq.map((eq: any) => {
            console.log(`🔍 Processing equipment ${eq.equipment_number} (${eq.id}):`, {
              status: eq.status,
              category: eq.category,
              equipment_type: eq.equipment_type
            });

            if (eq.status === "damaged") {
              console.log(`💥 Equipment ${eq.equipment_number} is damaged`);
              return { ...eq, availability: "unavailable" as const, availability_note: "Damaged" };
            }

            console.log(`✅ Equipment ${eq.equipment_number} marked as available`);
            return { ...eq, availability: "available" as const, availability_note: "Available" };
          });

          // Sort by category
          enriched.sort((a: any, b: any) => a.category.localeCompare(b.category));

          console.log('🔢 enriched.length:', enriched.length);
          console.log('📋 enriched sample:', enriched.slice(0, 3));

          setAvailableEquipment(enriched);
        } catch (error) {
          console.error("Error fetching equipment:", error);
        }
      };
      fetchEquipment();
    }
  }, [workType, installDate]);

  // MPT Configuration Handlers
  const handleToggleSection = (key: string) => {
    if (activeSections.includes(key)) {
      setActiveSections((prev) => prev.filter((s) => s !== key));
    } else {
      setActiveSections((prev) => [...prev, key]);
      if (!signRows[key] || signRows[key].length === 0) {
        // Auto-add empty sign row
        const emptyRow = {
          id: crypto.randomUUID(),
          isCustom: false,
          signDesignation: '',
          signDescription: '',
          width: 0,
          height: 0,
          dimensionLabel: '',
          signLegend: '',
          sheeting: 'HI',
          structureType: '', // Will be set by user
          bLights: 'none' as const,
          sqft: 0,
          totalSqft: 0,
          quantity: 1,
          needsOrder: false,
          cover: false,
          loadOrder: 1,
          material: defaultSignMaterial,
          secondarySigns: [],
        };
        setSignRows((prev) => ({ ...prev, [key]: [emptyRow] }));
      }
    }
  };

  const handleSignRowsChange = (sectionKey: string, rows: MPTSignRow[]) => {
    setSignRows((prev) => ({ ...prev, [sectionKey]: rows }));
  };

  const handleApplyMaterialToAll = () => {
    const newSignRows = { ...signRows };
    for (const key of Object.keys(newSignRows)) {
      newSignRows[key] = newSignRows[key].map(r => ({ ...r, material: defaultSignMaterial }));
    }
    setSignRows(newSignRows);
    toast.success(`All signs set to ${defaultSignMaterial}`);
  };

  const handleCreateWorkOrder = async () => {
    if (!savedTakeoffId) {
      toast.error("Please save the takeoff first before generating a work order");
      return;
    }

    setSaving(true);
    try {
      // Create work order from the saved takeoff
      const woResponse = await fetch(`/api/workorders/from-takeoff/${savedTakeoffId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user?.email || 'unknown@example.com'
        })
      });

      if (woResponse.ok) {
        const result = await woResponse.json();
        // Update the work order number field
        setWorkOrderNumber(result.workOrder.workOrderNumber);
        toast.success('Work order generated successfully!');
        router.push(`/l/jobs/${jobId}/work-orders/${result.workOrder.id}`);
      } else {
        const err = await woResponse.json();
        toast.error(err.error || 'Failed to generate work order');
      }
    } catch (error) {
      console.error("Error generating work order:", error);
      toast.error("Failed to generate work order");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!savedTakeoffId) {
      toast.error("Please save the takeoff first before downloading PDF");
      return;
    }

    setGeneratingPdf(true);
    try {
      const response = await fetch(`/api/l/takeoffs/${savedTakeoffId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `takeoff-${title || 'untitled'}.pdf`;
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

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!workType) {
      toast.error("Work Type is required");
      return;
    }
    if (!dbJob) {
      toast.error("This contract has not been saved to the database yet. Please create it via the Contract Wizard first.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/l/takeoffs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          title,
          workType,
          workOrderNumber,
          workOrderId,
          contractedOrAdditional,
          installDate,
          pickupDate,
          neededByDate,
          isMultiDayJob,
          endDate,
          priority,
          notes,
          crewNotes,
          buildShopNotes,
          pmNotes,
          // Include MPT sign data
          activeSections,
          signRows,
          defaultSignMaterial,
          // Include permanent signs data
          activePermanentItems,
          permanentSignRows,
          permanentEntryRows,
          defaultPermanentSignMaterial,
          // Include flagging/lane closure data
          vehicleItems,
          rollingStockItems,
          additionalItems,
          // Include takeoffId for updates
          takeoffId: savedTakeoffId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create takeoff');
      }

      toast.success(`Takeoff "${title}" saved successfully`);
      setTakeoffSaved(true);
      setSavedTakeoffId(data.takeoff.id);
      // Navigate to the view page (we'll create this route structure)
      router.push(`/l/${jobId}/takeoffs/view/${data.takeoff.id}`);
    } catch (error) {
      console.error("Error saving takeoff:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save takeoff");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Salesforce Style */}
      <div
        className={
          stickyHeader
            ? "sticky top-[var(--header-height)] z-20 -mx-6 px-6 py-2 border-b bg-[hsl(var(--muted)/0.3)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--muted)/0.3)]/95 flex items-center justify-between"
            : "flex items-center justify-between"
        }
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {isEditMode ? "Edit Material Takeoff" : "New Material Takeoff"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Second iteration of the workflow · 102026001
            </p>
          </div>
          {workType && (
            <span className="ml-2 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700">
              {WORK_TYPES.find(wt => wt.value === workType)?.label || workType}
            </span>
          )}
        </div>
      <div className="flex items-center gap-2 flex-nowrap shrink-0">
        <SaveStatusIndicator
          status={saveStatus}
          lastSavedAt={lastSaved}
          onManualSave={handleSave}
          isSaving={saving}
        />
        {/* Removed Save Draft + Back button from header as per requirement */}
        {/* Only show Generate Work Order + Download PDF when a takeoff ID exists */}
        {!isEditMode && savedTakeoffId && (
          <>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownloadPdf} disabled={generatingPdf}>
              <Download className="h-3.5 w-3.5" />
              {generatingPdf ? "Generating…" : "Download PDF"}
            </Button>
            {workOrderExists ? (
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => router.push(`/l/jobs/${jobId}/work-orders/${workOrderNumber}`)}>
                <ClipboardList className="h-3.5 w-3.5" />
                View Work Order
              </Button>
            ) : (
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleCreateWorkOrder} disabled={saving}>
                <ClipboardList className="h-3.5 w-3.5" />
                {saving ? "Creating…" : "Generate Work Order"}
              </Button>
            )}
          </>
        )}
      </div>
      </div>

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
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Takeoff Title *</Label>
              <Input
                className="text-sm"
                value={title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setTitle(newTitle);
                  // Track when title is first entered for creation delay
                  if (newTitle.trim() && !titleEnteredAt && !savedTakeoffId) {
                    setTitleEnteredAt(new Date());
                  } else if (!newTitle.trim() && titleEnteredAt) {
                    // Reset if title is cleared
                    setTitleEnteredAt(null);
                  }
                }}
                placeholder="e.g. Phase 1 MPT Setup"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Type *</Label>
              <Select value={workType} onValueChange={(newWorkType) => {
                // Check if there's progress made
                const hasProgress = activeSections.length > 0 ||
                  Object.values(signRows).some(rows => rows.length > 0) ||
                  activePermanentItems.length > 0 ||
                  Object.values(permanentSignRows).some(rows => rows.length > 0) ||
                  Object.values(permanentEntryRows).some(rows => rows.length > 0) ||
                  vehicleItems.length > 0 ||
                  rollingStockItems.length > 0 ||
                  additionalItems.length > 0;

                if (hasProgress && newWorkType !== workType) {
                  setPendingWorkType(newWorkType);
                  setShowWorkTypeChangeDialog(true);
                } else {
                  setWorkType(newWorkType);
                  if (newWorkType) {
                    setWorkTypeSelectedAt(new Date());
                  } else {
                    setWorkTypeSelectedAt(null);
                  }
                }
              }}>
                <SelectTrigger className="text-sm mt-0">
                  <SelectValue placeholder="Choose Work Type" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.filter(wt => loadingWorkTypes || allowedWorkTypes.includes(wt.value)).map((wt) => (
                    <SelectItem key={wt.value} value={wt.value}>{wt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Order #</Label>
              {workOrderNumber ? (
                <div
                  className="text-sm text-primary hover:text-primary/80 cursor-pointer underline"
                  onClick={() => router.push(`/l/jobs/${jobId}/work-orders/${workOrderNumber}`)}
                >
                  {workOrderNumber}
                </div>
              ) : (
                <Input
                  className="text-sm"
                  value="Save takeoff first"
                  disabled
                  placeholder="Save takeoff first"
                />
              )}
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Contracted / Additional</Label>
              <Select value={contractedOrAdditional} onValueChange={setContractedOrAdditional}>
                <SelectTrigger className="text-sm mt-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contracted">Contracted Work</SelectItem>
                  <SelectItem value="additional">Additional Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(workType === "FLAGGING" || workType === "LANE_CLOSURE") ? (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Job Start Date</Label>
                <Input
                  type="date"
                  className="text-sm"
                  value={installDate}
                  onChange={(e) => setInstallDate(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Install Date</Label>
                <Input
                  type="date"
                  className="text-sm"
                  value={installDate}
                  onChange={(e) => setInstallDate(e.target.value)}
                />
              </div>
            )}
            {(workType === "FLAGGING" || workType === "LANE_CLOSURE") ? (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Multi-Day Job</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="multiDayJob"
                    checked={isMultiDayJob}
                    onChange={(e) => setIsMultiDayJob(e.target.checked)}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <label htmlFor="multiDayJob" className="text-xs text-muted-foreground">
                    This job spans multiple days
                  </label>
                </div>
                {isMultiDayJob && (
                  <div className="mt-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">End Date</Label>
                    <Input
                      type="date"
                      className="text-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Pick Up Date</Label>
                <Input
                  type="date"
                  className="text-sm"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Needed By Date</Label>
              <Input
                type="date"
                className="text-sm"
                value={neededByDate}
                onChange={(e) => setNeededByDate(e.target.value)}
              />
              <span className="text-[9px] text-muted-foreground mt-1 block">Internal suspense date for build/sign shop prioritization</span>
            </div>
            {workType === "PERMANENT_SIGNS" ? (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Mobilization #</Label>
                <Input
                  type="number"
                  min={1}
                  className="text-sm"
                  value={mobilizationNumber}
                  onChange={(e) => setMobilizationNumber(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            ) : workType ? (
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="text-sm mt-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Work Type Specific Content */}
      {workType === "MPT" && (
        <MPTSignConfiguration
          activeSections={activeSections}
          signRows={signRows}
          defaultSignMaterial={defaultSignMaterial}
          onToggleSection={handleToggleSection}
          onSignRowsChange={handleSignRowsChange}
          onDefaultMaterialChange={setDefaultSignMaterial}
          onApplyMaterialToAll={handleApplyMaterialToAll}
        />
      )}

      {workType === "PERMANENT_SIGNS" && (
        <PermanentSignConfiguration
          activeItems={activePermanentItems}
          signRows={permanentSignRows}
          entryRows={permanentEntryRows}
          defaultSignMaterial={defaultPermanentSignMaterial}
          onToggleItem={(itemNumber) => {
            if (activePermanentItems.includes(itemNumber)) {
              setActivePermanentItems(prev => prev.filter(i => i !== itemNumber));
            } else {
              setActivePermanentItems(prev => [...prev, itemNumber]);
            }
          }}
          onSignRowsChange={(itemNumber, rows) => {
            setPermanentSignRows(prev => ({ ...prev, [itemNumber]: rows }));
          }}
          onEntryRowsChange={(itemNumber, rows) => {
            setPermanentEntryRows(prev => ({ ...prev, [itemNumber]: rows }));
          }}
          onDefaultMaterialChange={setDefaultPermanentSignMaterial}
          onApplyMaterialToAll={() => {
            const newSignRows = { ...permanentSignRows };
            for (const key of Object.keys(newSignRows)) {
              newSignRows[key] = newSignRows[key].map(r => ({ ...r, material: defaultPermanentSignMaterial }));
            }
            setPermanentSignRows(newSignRows);
            toast.success(`All permanent signs set to ${defaultPermanentSignMaterial}`);
          }}
        />
      )}

      {(workType === "FLAGGING" || workType === "LANE_CLOSURE") && (
        <>
          {/* Sign Configuration Section */}
          <div className="rounded-lg border bg-card shadow-sm max-w-[calc(100vw-272px-64px)]">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sign Configuration
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Default Material:
                </span>
                <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
                  {SIGN_MATERIALS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setDefaultSignMaterial(m.value as SignMaterial)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${defaultSignMaterial === m.value ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground border border-transparent"}`}
                    >
                      {m.abbrev}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  onClick={handleApplyMaterialToAll}
                >
                  Apply to All
                </Button>
              </div>
            </div>
            <div className="flex">
              <div className="w-[200px] shrink-0 border-r p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Structure Types
                </h4>
                <div className="space-y-2">
                  {MPT_SECTIONS.map((section) => {
                    const active = activeSections.includes(section.key);
                    return (
                      <label
                        key={section.key}
                        className="flex items-center gap-2 select-none cursor-pointer"
                        onClick={() => handleToggleSection(section.key)}
                      >
                        <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${active ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"}`}>
                          {active && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="text-xs font-medium text-foreground">{section.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 min-w-0 p-4 overflow-x-auto">
                {activeSections.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-12 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Select a structure type</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click a structure type on the left to start building your sign configuration.
                    </p>
                  </div>
                ) : (
                  activeSections.map((sectionKey) => {
                    const section = MPT_SECTIONS.find((s) => s.key === sectionKey)!;
                    const sectionSandbags = (signRows[sectionKey] || []).reduce((total, row) => {
                      return total + getSandbagsForRow(sectionKey, row.structureType, row.quantity);
                    }, 0);
                    return (
                      <div key={sectionKey}>
                        <MPTSignTable
                          sectionTitle={section.label}
                          structureOptions={section.structures}
                          rows={signRows[sectionKey] || []}
                          onRowsChange={(rows) => setSignRows((prev) => ({ ...prev, [sectionKey]: rows }))}
                          orderable={sectionKey === "type_iii"}
                          disabled={false}
                          defaultMaterial={defaultSignMaterial}
                        />
                        {sectionSandbags > 0 && (
                          <div className="mt-1.5 mb-4 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Sand Bags
                            </span>
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

          {/* Vehicles Section */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vehicles</h2>
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
            </div>
            <div className="p-5">
              {vehicleItems.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No vehicles assigned</p>
                  <p className="text-xs text-muted-foreground mt-1">Click Add Vehicle to assign trucks, TMAs, etc.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vehicleItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-md border bg-background max-w-fit">
                      <Select
                        value={item.vehicleType}
                        onValueChange={(v) =>
                          setVehicleItems((prev) =>
                            prev.map((vi) => (vi.id === item.id ? { ...vi, vehicleType: v } : vi))
                          )
                        }
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
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium">Qty</span>
                        <QuantityInput
                          value={item.quantity || 1}
                          min={1}
                          onChange={(value) =>
                            setVehicleItems((prev) =>
                              prev.map((vi) =>
                                vi.id === item.id
                                  ? { ...vi, quantity: Math.max(1, value) }
                                  : vi
                              )
                            )
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-auto"
                        onClick={() => setVehicleItems((prev) => prev.filter((vi) => vi.id !== item.id))}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rolling Stock Section */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rolling Stock</h2>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                disabled
                onClick={() =>
                  setRollingStockItems((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), equipmentId: "", equipmentLabel: "" },
                  ])
                }
              >
                <Plus className="h-3 w-3" /> Add Equipment
              </Button>
            </div>
            <div className="p-5">
              <div className="mb-3 rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Rolling stock is temporarily disabled and read-only.
              </div>
              {rollingStockItems.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No rolling stock selected</p>
                  <p className="text-xs text-muted-foreground mt-1">Rolling stock selection is disabled for now.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rollingStockItems.map((item) => {
                    console.log(`🎯 Rendering rolling stock item ${item.id}:`, {
                      equipmentId: item.equipmentId,
                      equipmentLabel: item.equipmentLabel
                    });

                    // Filter out already-selected equipment (except the current row's selection)
                    const selectedIds = rollingStockItems
                      .filter((rs) => rs.id !== item.id && rs.equipmentId)
                      .map((rs) => rs.equipmentId);

                    console.log(`🚫 Selected IDs to exclude:`, selectedIds);

                    const filteredEquipment = availableEquipment
                      .filter((eq) => !selectedIds.includes(eq.id))
                      .filter((eq) => eq.availability !== "unavailable");

                    console.log(`📋 Available equipment after filtering:`, filteredEquipment.length, 'items');
                    console.log(`📋 Filtered equipment sample:`, filteredEquipment.slice(0, 3));

                    // Group by category
                    const groupedEquipment = filteredEquipment.reduce<Record<string, typeof filteredEquipment>>((acc, eq) => {
                      if (!acc[eq.category]) acc[eq.category] = [];
                      acc[eq.category].push(eq);
                      return acc;
                    }, {});

                    console.log(`📂 Grouped equipment by category:`, Object.keys(groupedEquipment));
                    console.log(`📂 Grouped equipment details:`, Object.entries(groupedEquipment).map(([cat, items]) => `${cat}: ${items.length} items`));

                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-md border bg-background">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled
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
                          <PopoverContent className="w-[520px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search by number, type, make…" className="h-9 text-xs" />
                              <CommandList>
                                <CommandEmpty>
                                  {(() => { console.log('🚨 CommandEmpty rendered - no equipment found'); return null; })()}
                                  No equipment found matching your dates.
                                </CommandEmpty>
                                {Object.entries(groupedEquipment).map(([category, items]) => {
                                  (() => console.log(`🏷️ Rendering category "${category}" with ${items.length} items:`, items.map(eq => eq.equipment_number)))();
                                  return (
                                    <CommandGroup key={category} heading={category}>
                                      {items.map((eq) => {
                                        (() => console.log(`🔧 Rendering equipment ${eq.equipment_number} in category ${category}`))();
                                        const colorClass = eq.availability === "available"
                                          ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                                          : "bg-amber-500/10 hover:bg-amber-500/20";
                                        const dotColor = eq.availability === "available"
                                          ? "bg-emerald-500"
                                          : "bg-amber-500";
                                        return (
                                          <CommandItem
                                            key={eq.id}
                                            value={`${eq.equipment_number} ${eq.equipment_type} ${eq.make} ${eq.model} ${eq.category}`}
                                            onSelect={() => {
                                              const label = `${eq.equipment_number} — ${eq.category} ${eq.equipment_type} (${eq.make} ${eq.model})${eq.rental_rate ? ` · $${eq.rental_rate.toLocaleString()}/mo` : ""}`;
                                              setRollingStockItems((prev) =>
                                                prev.map((rs) =>
                                                  rs.id === item.id ? { ...rs, equipmentId: eq.id, equipmentLabel: label } : rs
                                                )
                                              );
                                            }}
                                            className={`text-xs ${colorClass}`}
                                          >
                                            <Check
                                              className={`mr-2 h-3 w-3 ${item.equipmentId === eq.id ? "opacity-100" : "opacity-0"}`}
                                            />
                                            <div className={`w-2 h-2 rounded-full mr-2 shrink-0 ${dotColor}`} />
                                            <span className="font-mono">{eq.equipment_number}</span>
                                            <span className="text-muted-foreground ml-2">
                                              {eq.equipment_type} · {eq.make} {eq.model}
                                            </span>
                                            {eq.rental_rate ? (
                                              <span className="ml-auto text-[10px] font-semibold text-foreground">${eq.rental_rate.toLocaleString()}/mo</span>
                                            ) : null}
                                            <span className={`ml-2 text-[9px] font-medium ${eq.availability === "available" ? "text-emerald-600" : "text-amber-600"}`}>
                                              {eq.availability_note}
                                            </span>
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  );
                                })}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                          className="h-8 w-8"
                          onClick={() => setRollingStockItems((prev) => prev.filter((rs) => rs.id !== item.id))}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {workType === "RENTAL" && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rolling Stock</h2>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" disabled>
              <Plus className="h-3 w-3" /> Add Equipment
            </Button>
          </div>
          <div className="p-5">
            <div className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Rolling stock is temporarily disabled and read-only.
            </div>
          </div>
        </div>
      )}



      {/* Additional Items */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/30 px-5 py-3 flex items-center justify-between border-b">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Additional Items</h2>
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setAdditionalItems((prev) => [
            ...prev,
            { id: crypto.randomUUID(), name: "", quantity: 1, description: "" },
          ])}>
            <Plus className="h-3 w-3" /> Add Item
          </Button>
        </div>

        {additionalItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">No additional items.</div>
        ) : (
          <div className="divide-y">
            {additionalItems.map((item) => (
              <div key={item.id} className="px-5 py-2.5 flex items-start gap-3 flex-wrap">
                <Select value={item.name} onValueChange={(v) => setAdditionalItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name: v } : i)))}>
                  <SelectTrigger className="h-8 text-xs w-[220px]"><SelectValue placeholder="Select item…" /></SelectTrigger>
                  <SelectContent>
                    {(workType === "PERMANENT_SIGNS" ? [] : MPT_ADDITIONAL_ITEM_OPTIONS).map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                    <SelectItem value="__custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {item.name === "__custom" && (
                  <Input className="h-8 text-xs w-[140px]" value={item.description} onChange={(e) => setAdditionalItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, description: e.target.value } : i)))} placeholder="Custom item name" />
                )}
                {workType === "SERVICE" ? (
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Qty</span>
                    <QuantityInput
                      value={item.quantity || 1}
                      min={1}
                      onChange={(value) =>
                        setAdditionalItems((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, quantity: Math.max(1, value) } : i))
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Qty</span>
                    <QuantityInput
                      value={item.quantity || 1}
                      min={1}
                      onChange={(value) =>
                        setAdditionalItems((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, quantity: Math.max(1, value) } : i))
                        )
                      }
                    />
                  </div>
                )}
                {item.name !== "__custom" && (
                  <Input className="h-8 text-xs w-[280px]" value={item.description} onChange={(e) => setAdditionalItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, description: e.target.value } : i)))} placeholder="Notes (optional)" />
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAdditionalItems((prev) => prev.filter((i) => i.id !== item.id))}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Crew Notes</Label>
            <Textarea
              className="text-sm"
              value={crewNotes}
              onChange={(e) => setCrewNotes(e.target.value)}
              placeholder="Notes for the road crew…"
              rows={2}
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">Visible to road crew on dispatches</span>
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Build Shop Notes</Label>
            <Textarea
              className="text-sm"
              value={buildShopNotes}
              onChange={(e) => setBuildShopNotes(e.target.value)}
              placeholder="Internal notes for the build shop…"
              rows={2}
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">Sent with the build request submission</span>
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">PM Notes</Label>
            <Textarea
              className="text-sm"
              value={pmNotes}
              onChange={(e) => setPmNotes(e.target.value)}
              placeholder="Personal notes (PM only)…"
              rows={2}
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">Private notes for your reference only</span>
          </div>
        </div>
      </div>

      {/* Work Type Change Confirmation Dialog */}
      <Dialog open={showWorkTypeChangeDialog} onOpenChange={setShowWorkTypeChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Change Work Type?
            </DialogTitle>
            <DialogDescription>
              You have items entered for the current work type. Switching will clear all sign rows and additional items. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWorkTypeChangeDialog(false);
              setPendingWorkType(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingWorkType) {
                  setWorkType(pendingWorkType);
                  // Clear all progress
                  setActiveSections([]);
                  setSignRows({});
                  setActivePermanentItems([]);
                  setPermanentSignRows({});
                  setPermanentEntryRows({});
                  setVehicleItems([]);
                  setRollingStockItems([]);
                  setAdditionalItems([]);
                }
                setShowWorkTypeChangeDialog(false);
                setPendingWorkType(null);
              }}
            >
              Change Work Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
