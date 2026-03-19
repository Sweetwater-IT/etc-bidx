'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { useTakeoffFromDB } from "@/hooks/useTakeoffFromDB";
import { generateBillingPacketPdf } from "@/utils/generateBillingPacketPdf";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
import {
  Home,
  ChevronRight,
  ClipboardList,
  Package,
  Hammer,
  Send,
  CalendarDays,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Loader2,
  Save,
  FileText,
  Trash2,
  FileDown,
  DollarSign,
  ChevronsUpDown,
  Check,
  Upload,
  File,
  X,
  ExternalLink,
  Lock,
  Paperclip,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Status config ─── */

const WO_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { value: "ready", label: "Ready", color: "bg-emerald-500/15 text-emerald-700" },
  { value: "scheduled", label: "Scheduled", color: "bg-indigo-500/15 text-indigo-700" },
  { value: "completed", label: "Complete", color: "bg-emerald-600/15 text-emerald-800" },
];

const TAKEOFF_STATUSES: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  sent_to_build_shop: { label: "Sent to Build Shop", color: "bg-blue-500/15 text-blue-700" },
  building: { label: "Building", color: "bg-amber-500/15 text-amber-700" },
  ordered: { label: "Signs Ordered", color: "bg-orange-500/15 text-orange-700" },
  complete: { label: "Job Ready", color: "bg-emerald-500/15 text-emerald-700" },
};

interface TakeoffSummary {
  id: string;
  title: string;
  status: string;
  work_type: string;
  install_date: string | null;
  pickup_date: string | null;
  item_count: number;
}

interface WOItem {
  id: string;
  item_number: string;
  description: string | null;
  contract_quantity: number;
  work_order_quantity: number;
  uom: string | null;
  sort_order: number;
  sov_item_id?: string | null;
}

interface JobInfo {
  id: string;
  project_name: string;
  etc_job_number: string | null;
  etc_branch: string | null;
  customer_name: string | null;
  customer_job_number: string | null;
  customer_pm: string | null;
  project_owner: string | null;
  county: string | null;
  etc_project_manager: string | null;
  contract_number: string | null;
}

interface WODocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

/* ─── Helper ─── */
const AdminField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="min-h-[2.5rem]">
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 leading-tight">{label}</span>
    <span className={`text-sm text-foreground leading-snug ${mono ? "font-mono" : ""}`}>{value}</span>
  </div>
);

const formatWorkOrderNumber = (workOrderNumber?: string | number | null) => {
  if (workOrderNumber === null || workOrderNumber === undefined) return "—";
  const asString = String(workOrderNumber).trim();
  if (!asString) return "—";
  return asString.padStart(3, "0");
};

const WorkOrderDetail = ({
  workOrderId,
  takeoffId,
  mode = "edit",
  onSaveStateChange,
  onSaveActionReady,
}: {
  workOrderId: string;
  takeoffId?: string;
  mode?: "view" | "edit";
  onSaveStateChange?: (state: { isSaving: boolean; lastSavedAt: Date | null; firstSave: boolean }) => void;
  onSaveActionReady?: (saveAction: () => Promise<void>) => void;
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = !!user;
  const isPM = !!user; // Assume PM if authenticated for now
  const canCreateTakeoffs = !!user; // Assume can create if authenticated

  // Check if this is a new work order (preview mode)
  const isNewWorkOrder = workOrderId === "new" && !!takeoffId;

  // Local state for work order data
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isNewWorkOrder);
  const [buildRequests, setBuildRequests] = useState<any[]>([]);
  const [dispatch, setDispatch] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [takeoffs, setTakeoffs] = useState<TakeoffSummary[]>([]);
  const [woItems, setWoItems] = useState<WOItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [pickupWO, setPickupWO] = useState<{ id: string; wo_number: string | null; status: string } | null>(null);

  // Get job data using the hook
  const { data: dbJob, isLoading: jobLoading } = useJobFromDB(workOrder?.job_id);

  // Get takeoff data using the hook when takeoffId is provided
  const { data: dbTakeoff, isLoading: takeoffLoading } = useTakeoffFromDB(takeoffId);

  // Documents state
  const [documents, setDocuments] = useState<WODocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [combining, setCombining] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editContractedOrAdditional, setEditContractedOrAdditional] = useState("");
  const [editCustomerPocPhone, setEditCustomerPocPhone] = useState("");
  const [editInstallDate, setEditInstallDate] = useState("");
  const [editPickupDate, setEditPickupDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveHandlerRef = useRef<() => Promise<void>>(async () => {});
  const performSaveRef = useRef<(redirectOnSuccess: boolean) => Promise<void>>(async () => {});
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editSnapshotRef = useRef("");
  const editStateInitializedRef = useRef(false);

  // SOV picklist state
  const [sovItems, setSovItems] = useState<{ id: string; item_number: string; description: string; quantity: number; uom: string }[]>([]);
  const [sovItemsFull, setSovItemsFull] = useState<{ id: string; itemNumber: string; description: string; uom: string; quantity: number; unitPrice: number; extendedPrice: number; retainageType: 'percent' | 'dollar'; retainageValue: number; retainageAmount: number; notes?: string | null }[]>([]);
  const [openItemPickerRow, setOpenItemPickerRow] = useState<string | null>(null);
  const [itemPickerSearch, setItemPickerSearch] = useState("");

  // Fetch SOV items for the job
  useEffect(() => {
    const fetchSovItems = async () => {
      if (!workOrder?.job_id) {
        console.log('[WorkOrderDetail] No job_id available for SOV items fetch');
        return;
      }
      console.log('[WorkOrderDetail] Fetching SOV items for job:', workOrder.job_id);
      try {
        const response = await fetch(`/api/l/jobs/${workOrder.job_id}/sov-items`);
        console.log('[WorkOrderDetail] SOV items API response:', response.status, response.statusText);
        if (response.ok) {
          const data = await response.json();
          console.log('[WorkOrderDetail] SOV items data received:', data.data?.length || 0, 'items');
          console.log('[WorkOrderDetail] SOV items sample:', data.data?.slice(0, 3));
          setSovItems(data.data || []);
        } else {
          console.error('[WorkOrderDetail] Failed to fetch SOV items:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('[WorkOrderDetail] Error fetching SOV items:', err);
      }
    };
    fetchSovItems();
  }, [workOrder?.job_id]);

  const selectedItemNumbers = useMemo(
    () => new Set(woItems.map((i) => i.item_number).filter(Boolean)),
    [woItems]
  );

  const filteredSOVItems = useMemo(
    () =>
      sovItems.filter(
        (s) =>
          (s.item_number || "").toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
          (s.description || "").toLowerCase().includes(itemPickerSearch.toLowerCase())
      ),
    [sovItems, itemPickerSearch]
  );

  // Blocking modal
  const [blockingModalOpen, setBlockingModalOpen] = useState(false);
  const [blockingModalType, setBlockingModalType] = useState<"takeoff" | "items">("takeoff");
  const [pendingStatusTransition, setPendingStatusTransition] = useState<string | null>(null);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Custom line item state
  const [showCustomItemDialog, setShowCustomItemDialog] = useState(false);
  const [customItemRowId, setCustomItemRowId] = useState<string | null>(null);
  const [customItemNumber, setCustomItemNumber] = useState("");
  const [customItemDescription, setCustomItemDescription] = useState("");
  const [customItemUom, setCustomItemUom] = useState("EA");
  const [customItemQty, setCustomItemQty] = useState(1);
  const [showChangeOrderConfirm, setShowChangeOrderConfirm] = useState(false);
  const [pendingCustomItem, setPendingCustomItem] = useState<{ rowId: string; itemNumber: string; description: string; uom: string; qty: number } | null>(null);

  // Link Takeoff modal state
  const [showLinkTakeoffModal, setShowLinkTakeoffModal] = useState(false);
  const [availableTakeoffs, setAvailableTakeoffs] = useState<TakeoffSummary[]>([]);
  const [loadingTakeoffs, setLoadingTakeoffs] = useState(false);

  const hasTakeoff = takeoffs.length > 0;
  const hasWoItems = woItems.length > 0;

  // Build readiness derived state
  const latestBuildRequest = buildRequests.length > 0 ? buildRequests[0] : null;
  const buildComplete = latestBuildRequest
    ? (latestBuildRequest.status === "completed" || !(latestBuildRequest as any).build_required)
    : true;

  // Combined readiness
  const readyToSchedule = hasTakeoff && hasWoItems && buildComplete;

  const getEditSnapshot = useCallback(
    () =>
      JSON.stringify({
        editTitle,
        editDescription,
        editNotes,
        editScheduledDate,
        editAssignedTo,
        editContractedOrAdditional,
        editCustomerPocPhone,
        editInstallDate,
        editPickupDate,
      }),
    [
      editAssignedTo,
      editContractedOrAdditional,
      editCustomerPocPhone,
      editDescription,
      editInstallDate,
      editNotes,
      editPickupDate,
      editScheduledDate,
      editTitle,
    ]
  );

  useEffect(() => {
    onSaveStateChange?.({
      isSaving: saving,
      lastSavedAt,
      firstSave: Boolean(lastSavedAt),
    });
  }, [lastSavedAt, onSaveStateChange, saving]);

  // Fetch work order data (skip for new work orders)
  useEffect(() => {
    const fetchWorkOrder = async () => {
      if (!workOrderId || isNewWorkOrder) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/workorders/${workOrderId}`);
        if (response.ok) {
          const data = await response.json();
          setWorkOrder(data);
        } else {
          console.error('Failed to fetch work order');
        }
      } catch (error) {
        console.error('Error fetching work order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkOrder();
  }, [workOrderId, isNewWorkOrder]);

  // Fetch build requests
  useEffect(() => {
    const fetchBuildRequests = async () => {
      if (!workOrderId) return;
      try {
        const response = await fetch(`/api/workorders/${workOrderId}/build-requests`);
        if (response.ok) {
          const data = await response.json();
          setBuildRequests(data);
        } else {
          console.error('Failed to fetch build requests');
        }
      } catch (error) {
        console.error('Error fetching build requests:', error);
      }
    };

    fetchBuildRequests();
  }, [workOrderId]);



  // Fetch related data from API
  const fetchRelated = useCallback(async () => {
    if (!workOrderId) return;
    setLoadingRelated(true);
    try {
      const response = await fetch(`/api/workorders/${workOrderId}/detail`);
      if (!response.ok) {
        throw new Error('Failed to fetch work order details');
      }
      const data = await response.json();
      console.log('fetchRelated data:', data); // Debug log

      // Job data is now fetched via useJobFromDB hook
      setTakeoffs(data.takeoffs || []);
      setWoItems(data.woItems || []);
      setSovItems(data.sovItems || []);
      setSovItemsFull(data.sovItemsFull || []);
      setDocuments(data.documents || []);
      setPickupWO(data.pickupWO || null);
    } catch (err) {
      console.error("Failed to fetch related data", err);
    } finally {
      setLoadingRelated(false);
    }
  }, [workOrderId]);

  useEffect(() => { fetchRelated(); }, [fetchRelated]);

  // Include takeoff from hook if provided
  useEffect(() => {
    if (dbTakeoff && !takeoffLoading) {
      const takeoffSummary: TakeoffSummary = {
        id: dbTakeoff.id,
        title: dbTakeoff.title,
        status: dbTakeoff.status,
        work_type: dbTakeoff.work_type,
        install_date: dbTakeoff.install_date,
        pickup_date: dbTakeoff.pickup_date,
        item_count: 0, // We'll need to fetch this separately or estimate
      };
      setTakeoffs(prev => {
        // Check if this takeoff is already in the list
        const exists = prev.some(t => t.id === dbTakeoff.id);
        if (!exists) {
          return [...prev, takeoffSummary];
        }
        return prev;
      });

      // For new work orders, populate work order items from takeoff data
      if (isNewWorkOrder && !takeoffLoading) {
                        // Fetch takeoff data with sign rows
        fetch(`/api/l/takeoffs/${takeoffId}/data`)
          .then(response => response.json())
          .then(data => {
            if (data.takeoff?.sign_rows) {
              const signRowsData = data.takeoff.sign_rows || {};
              const workOrderItems: WOItem[] = [];

              // Flatten all sign rows from all sections
              let itemNumber = 1;
              for (const sectionName of Object.keys(signRowsData)) {
                const sectionRows = signRowsData[sectionName] || [];
                for (const row of sectionRows) {
                  const description = [
                    row.signDesignation || 'Custom Sign',
                    row.signDescription || '',
                    row.dimensionLabel ? `(${row.dimensionLabel})` : '',
                    row.signLegend ? `- ${row.signLegend}` : ''
                  ].filter(Boolean).join(' ').trim();

                  const quantity = row.quantity || 1;
                  const uom = row.sqft > 0 ? 'sqft' : 'each';

                  workOrderItems.push({
                    id: `temp-${Date.now()}-${itemNumber}`,
                    item_number: itemNumber.toString(),
                    description,
                    contract_quantity: quantity,
                    work_order_quantity: quantity,
                    uom,
                    sort_order: itemNumber - 1,
                  });
                  itemNumber++;
                }
              }

              // Only set items if we have any (don't overwrite if already populated)
              if (workOrderItems.length > 0 && woItems.length === 0) {
                setWoItems(workOrderItems);
              }
            }
          })
          .catch(err => {
            console.error('Failed to fetch takeoff data for work order items:', err);
          });
      }
    }
  }, [dbTakeoff, takeoffLoading, isNewWorkOrder, woItems.length]);

  // Sync editing fields
  useEffect(() => {
    if (workOrder) {
      setEditTitle(workOrder.title || "");
      setEditDescription(workOrder.description || "");
      setEditNotes(workOrder.notes || "");
      setEditScheduledDate(workOrder.scheduled_date || "");
      setEditAssignedTo(workOrder.assigned_to || "");
      setEditContractedOrAdditional(workOrder?.contracted_or_additional || "contracted");
      setEditCustomerPocPhone(workOrder.customer_poc_phone || "");
    }
  }, [workOrder]);

  // Sync install/pickup dates from takeoff
  useEffect(() => {
    if (takeoffs.length > 0) {
      setEditInstallDate(takeoffs[0].install_date || "");
      setEditPickupDate(takeoffs[0].pickup_date || "");
    }
  }, [takeoffs]);

  useEffect(() => {
    if (!workOrder || (takeoffs.length === 0 && !isNewWorkOrder)) return;
    editSnapshotRef.current = getEditSnapshot();
    editStateInitializedRef.current = true;
  }, [getEditSnapshot, isNewWorkOrder, takeoffs, workOrder]);

  const handleSave = async ({ redirectOnSuccess = mode === "edit" }: { redirectOnSuccess?: boolean } = {}) => {
    if (!workOrderId) return;
    setSaving(true);
    try {
      if (isNewWorkOrder) {
        // Create new work order
        const response = await fetch(`/api/workorders/from-takeoff/${takeoffId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user?.email,
            title: editTitle,
            description: editDescription,
            notes: editNotes,
            scheduled_date: editScheduledDate || null,
            assigned_to: editAssignedTo,
            contracted_or_additional: editContractedOrAdditional,
            customer_poc_phone: editCustomerPocPhone,
            install_date: editInstallDate || null,
            pickup_date: editPickupDate || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create work order');
        }

        const result = await response.json();
        toast.success(`Work order "${editTitle}" created successfully`);
        // Navigate to edit (to preserve the "generate → edit first" flow) with takeoffId to enable immediate loading
        router.push(`/l/jobs/${dbJob?.id}/work-orders/${result.workOrder.id}/edit?takeoffId=${takeoffId}`);
      } else {
        // Update existing work order
        const response = await fetch(`/api/workorders/${workOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
            notes: editNotes,
            scheduled_date: editScheduledDate || null,
            assigned_to: editAssignedTo,
            contracted_or_additional: editContractedOrAdditional,
            customer_poc_phone: editCustomerPocPhone,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update work order');
        }

        // Also sync install/pickup dates to linked takeoff(s)
        if (takeoffs.length > 0) {
          const takeoffId = takeoffs[0].id;
          try {
            const isPickupWO = (workOrder as any).is_pickup;
            // For PU work orders, only sync pickup date; for normal WOs, sync both
            const datePatch: Record<string, string | null> = isPickupWO
              ? { pickupDate: editPickupDate || null }
              : { installDate: editInstallDate || null, pickupDate: editPickupDate || null };

            // Use API call to update takeoff dates
            await fetch(`/api/takeoffs/${takeoffId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(datePatch),
            });

            // For PU work orders, also update pickup date on ALL takeoffs for this job
            if (isPickupWO && editPickupDate && workOrder?.job_id) {
              // This would need a separate API endpoint to update all takeoffs for a job
              // For now, we'll skip this complex operation
              console.log("Note: Pickup date sync to all job takeoffs not implemented via API yet");
            }
          } catch (e) {
            console.error("Failed to sync dates to takeoff:", e);
          }
        }
        setLastSavedAt(new Date());
        // Refetch work order data
        const workOrderResponse = await fetch(`/api/workorders/${workOrderId}`);
        if (workOrderResponse.ok) {
          const data = await workOrderResponse.json();
          setWorkOrder(data);
        }
        fetchRelated();
        editSnapshotRef.current = getEditSnapshot();

        // When saving from the edit page, send the user back to the read-only view
        if (redirectOnSuccess && mode === "edit" && workOrder?.job_id) {
          const qs = takeoffId ? `?takeoffId=${encodeURIComponent(takeoffId)}` : "";
          router.push(`/l/jobs/${workOrder.job_id}/work-orders/${workOrderId}/view${qs}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save work order');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    saveHandlerRef.current = () => handleSave({ redirectOnSuccess: true });
    performSaveRef.current = (redirectOnSuccess: boolean) => handleSave({ redirectOnSuccess });
  });

  useEffect(() => {
    if (!onSaveActionReady) return;
    onSaveActionReady(() => saveHandlerRef.current());
  }, [onSaveActionReady]);

  useEffect(() => {
    if (mode !== "edit" || isNewWorkOrder || !editStateInitializedRef.current) return;

    const currentSnapshot = getEditSnapshot();
    if (currentSnapshot === editSnapshotRef.current) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      void performSaveRef.current(false);
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [getEditSnapshot, isNewWorkOrder, mode]);

  const handleStatusChange = async (newStatus: string) => {
    if (!workOrderId || !workOrder) return;

    if (newStatus !== "draft" && newStatus !== workOrder.status && !hasTakeoff) {
      setPendingStatusTransition(newStatus);
      setBlockingModalType("takeoff");
      setBlockingModalOpen(true);
      return;
    }

    const schedulingStatuses = ["scheduled", "completed"];
    if (schedulingStatuses.includes(newStatus) && newStatus !== workOrder.status && !hasWoItems) {
      setPendingStatusTransition(newStatus);
      setBlockingModalType("items");
      setBlockingModalOpen(true);
      return;
    }

    if (schedulingStatuses.includes(newStatus) && newStatus !== workOrder.status && !buildComplete) {
      toast.error("Build Shop must complete the build before scheduling.");
      return;
    }

    try {
      const response = await fetch(`/api/workorders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      // Refetch work order data
      const workOrderResponse = await fetch(`/api/workorders/${workOrderId}`);
      if (workOrderResponse.ok) {
        const data = await workOrderResponse.json();
        setWorkOrder(data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Document upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !workOrderId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`/api/workorders/${workOrderId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      toast.success(`Uploaded ${result.uploaded} document(s)`);
      fetchRelated();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  };

  const isCombinable = (doc: WODocument) => {
    const name = doc.file_name.toLowerCase();
    const type = doc.file_type || "";
    return type.includes("pdf") || name.endsWith(".pdf") ||
           type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(name);
  };

  const toggleAllDocs = () => {
    const combinableDocs = documents.filter(isCombinable);
    if (selectedDocIds.size === combinableDocs.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(combinableDocs.map(d => d.id)));
    }
  };

  const handleCombineWithWO = async () => {
    if (!workOrder || selectedDocIds.size === 0) return;
    setCombining(true);
    try {
      // 1. Generate the WO PDF as bytes
      const woBytes = await generateBillingPacketPdf({
        woNumber: workOrder.wo_number || "",
        woTitle: workOrder.title || "",
        woDescription: workOrder.description || "",
        woNotes: workOrder.notes || "",
        etcAssignedTo: workOrder.assigned_to || "",
        contractedOrAdditional: (workOrder as any).contracted_or_additional || "contracted",
        customerPocPhone: workOrder.customer_poc_phone || "",
                      projectName: dbJob?.projectInfo?.projectName || "",
                      etcJobNumber: String(dbJob?.projectInfo?.etcJobNumber || ""),
                      customerName: dbJob?.projectInfo?.customerName || "",
                      customerJobNumber: dbJob?.projectInfo?.customerJobNumber || "",
                      customerPM: dbJob?.projectInfo?.customerPM || "",
                      projectOwner: dbJob?.projectInfo?.projectOwner || "",
                      county: dbJob?.projectInfo?.county || "",
                      etcBranch: dbJob?.etc_branch || "",
                      etcProjectManager: dbJob?.etc_project_manager || "",
        installDate: takeoffs[0]?.install_date || "",
        pickupDate: takeoffs[0]?.pickup_date || "",
        items: woItems.map(i => ({
          item_number: i.item_number,
          description: i.description || "",
          uom: i.uom || "EA",
          contract_quantity: i.contract_quantity,
          work_order_quantity: i.work_order_quantity,
        })),
        crewNotes: (dispatch as any)?.crew_notes || "",
        customerNotOnSite: (dispatch as any)?.customer_not_on_site || false,
        customerSignatureName: (dispatch as any)?.customer_signature_name || "",
        signedAt: (dispatch as any)?.signed_at || "",
        returnBytes: true,
      });

      if (!woBytes) {
        toast.error("Failed to generate work order PDF");
        return;
      }

      // 2. Create merged PDF starting with WO
      const mergedPdf = await PDFDocument.create();
      const woPdf = await PDFDocument.load(woBytes);
      const woPages = await mergedPdf.copyPages(woPdf, woPdf.getPageIndices());
      woPages.forEach(p => mergedPdf.addPage(p));

      // 3. Fetch and append each selected document (PDFs and images)
      for (const doc of documents.filter(d => selectedDocIds.has(d.id))) {
        try {
          // Get signed URL for the document
          const urlResponse = await fetch(`/api/documents/${doc.id}/signed-url`);
          if (!urlResponse.ok) continue;
          const urlData = await urlResponse.json();
          if (!urlData.signedUrl) continue;

          const response = await fetch(urlData.signedUrl);
          const fileBytes = await response.arrayBuffer();
          const fileUint8 = new Uint8Array(fileBytes);

          const isPdf = doc.file_type?.includes("pdf") || doc.file_name.toLowerCase().endsWith(".pdf");
          const isImage = doc.file_type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(doc.file_name.toLowerCase());

          if (isPdf) {
            const attachedPdf = await PDFDocument.load(fileBytes);
            const attachedPages = await mergedPdf.copyPages(attachedPdf, attachedPdf.getPageIndices());
            attachedPages.forEach(p => mergedPdf.addPage(p));
          } else if (isImage) {
            // Embed image as a full page in the PDF
            let img;
            const name = doc.file_name.toLowerCase();
            if (name.endsWith(".png")) {
              img = await mergedPdf.embedPng(fileUint8);
            } else {
              // Treat everything else as JPEG (jpg, jpeg, etc.)
              img = await mergedPdf.embedJpg(fileUint8);
            }
            const { width, height } = img.scaleToFit(612, 792); // Letter size
            const page = mergedPdf.addPage([612, 792]);
            page.drawImage(img, {
              x: (612 - width) / 2,
              y: (792 - height) / 2,
              width,
              height,
            });
          }
        } catch (err) {
          console.warn(`Skipping document ${doc.file_name}:`, err);
        }
      }

      // 4. Save merged PDF
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CombinedWO_${workOrder.wo_number || "WO"}_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Combined PDF downloaded");
    } catch (err: any) {
      console.error("Combine failed:", err);
      toast.error(`Failed to combine documents: ${err.message}`);
    } finally {
      setCombining(false);
    }
  };

  const handleDeleteDocument = async (doc: WODocument) => {
    if (!workOrderId) return;
    try {
      const response = await fetch(`/api/workorders/${workOrderId}/documents?documentId=${doc.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Document deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    }
  };

  const handleViewDocument = async (doc: WODocument) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/signed-url`);
      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }
      const data = await response.json();
      if (data.signedUrl) {
        window.open(data.signedUrl, "_blank");
      } else {
        toast.error("Failed to generate download link");
      }
    } catch (err) {
      toast.error("Failed to generate download link");
    }
  };

  const applyCustomItem = async (rowId: string, itemNumber: string, description: string, uom: string, qty: number) => {
    if (!workOrderId) return;
    const updated = {
      item_number: itemNumber,
      description: description,
      contract_quantity: qty,
      work_order_quantity: qty,
      uom: uom,
      sov_item_id: null,
    };
    setWoItems((prev) => prev.map((i) => i.id === rowId ? { ...i, ...updated } : i));
    const response = await fetch(`/api/workorders/${workOrderId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        itemData: { itemId: rowId, updates: updated },
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      toast.error(error.error || 'Failed to update item');
      // Revert the change
      setWoItems((prev) => prev.map((i) => i.id === rowId ? { ...i, item_number: "", description: "", contract_quantity: 1, work_order_quantity: 1, uom: "EA", sov_item_id: null } : i));
    }
  };

  const getStatusConfig = (status: string) =>
    WO_STATUSES.find((s) => s.value === status) || WO_STATUSES[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workOrder && !isNewWorkOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Work order not found</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(workOrder?.status || "draft");
  const isViewMode = mode === "view";
  const canEdit = (isAdmin || isPM) && !isViewMode;
  const isDraft = workOrder?.status === "draft" || isNewWorkOrder;

  return (
    <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col overflow-x-hidden">
      <div className="w-full px-6 pt-6 pb-6 flex-1 space-y-6 overflow-x-hidden">


        {/* Takeoff Required Alert - only show if no takeoff is linked */}
        {!hasTakeoff && !loadingRelated && (
          <div className="rounded-lg border px-4 py-3 flex items-center justify-between text-sm bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span><strong>Takeoff Required.</strong> This work order cannot proceed beyond draft until a takeoff is attached.</span>
            </div>
            {canCreateTakeoffs && dbJob && (
              <Button size="sm" className="text-xs gap-1.5 shrink-0" onClick={() => router.push(`/l/${dbJob.id}/takeoffs/create`)}>
                <Plus className="h-3.5 w-3.5" /> Create or Attach Takeoff
              </Button>
            )}
          </div>
        )}

        {/* Backlink to linked takeoff (when present) */}
        {!!workOrder?.takeoff_id && !!workOrder?.job_id && (
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground shrink-0">Linked takeoff</span>
              <span className="text-xs font-mono truncate">{workOrder.takeoff_id}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 shrink-0"
              onClick={() => router.push(`/l/${workOrder.job_id}/takeoffs/view/${workOrder.takeoff_id}`)}
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Takeoff
            </Button>
          </div>
        )}

        {/* ─── Project Information Card — matching takeoff ─── */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Information</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-xs">
              <AdminField label="Branch" value={dbJob?.etc_branch || "—"} />
              <AdminField label="ETC Project Manager" value={dbJob?.etc_project_manager || "—"} />
              <AdminField label="ETC Job #" value={String(dbJob?.projectInfo?.etcJobNumber || "—")} mono />
              <AdminField label="County" value={dbJob?.projectInfo?.county || "—"} />
              <AdminField label="Customer" value={dbJob?.projectInfo?.customerName || "—"} />
              <AdminField label="Customer PM / POC" value={dbJob?.projectInfo?.customerPM || "—"} />
              <AdminField label="Customer Job #" value={dbJob?.projectInfo?.customerJobNumber || "—"} />
              <AdminField label="Owner" value={dbJob?.projectInfo?.projectOwner || "—"} />
              <AdminField label="Owner Contract #" value={dbJob?.projectInfo?.contractNumber || "—"} />
            </div>
          </div>
        </div>

        {/* ─── Work Order Details Card — matching takeoff details format ─── */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Work Order Details</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Title</label>
                {canEdit ? (
                  <Input className="h-9 text-sm" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Work order title" />
                ) : (
                  <span className="text-sm text-foreground">{workOrder?.title || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">WO Number</label>
                <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground font-mono">
                  {formatWorkOrderNumber(workOrder?.wo_number)}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Status</label>
                {canEdit ? (
                  <Select value={workOrder?.status || "draft"} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WO_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`${statusConfig.color}`}>{statusConfig.label}</Badge>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Contracted / Additional</label>
                {canEdit ? (
                  <Select value={editContractedOrAdditional} onValueChange={setEditContractedOrAdditional}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contracted">Contracted Work</SelectItem>
                      <SelectItem value="additional">Additional Work</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm text-foreground">{editContractedOrAdditional === "additional" ? "Additional Work" : "Contracted Work"}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-xs mt-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Assigned To</label>
                {canEdit ? (
                  <Input className="h-9 text-sm" value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} placeholder="Name or team" />
                ) : (
                  <span className="text-sm text-foreground">{workOrder?.assigned_to || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer POC Phone</label>
                {canEdit ? (
                  <Input className="h-9 text-sm" value={editCustomerPocPhone} onChange={(e) => setEditCustomerPocPhone(e.target.value)} placeholder="(555) 123-4567" />
                ) : (
                  <span className="text-sm text-foreground">{workOrder?.customer_poc_phone || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Install Date</label>
                {canEdit && !workOrder?.is_pickup ? (
                  <Input type="date" className="h-9 text-sm" value={editInstallDate} onChange={(e) => setEditInstallDate(e.target.value)} />
                ) : (
                  <span className="text-sm text-foreground">{editInstallDate || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Pickup Date</label>
                {canEdit ? (
                  <Input type="date" className="h-9 text-sm" value={editPickupDate} onChange={(e) => setEditPickupDate(e.target.value)} />
                ) : (
                  <span className="text-sm text-foreground">{editPickupDate || "—"}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs mt-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Description of Work</label>
                {canEdit ? (
                  <Textarea rows={2} className="text-sm" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Describe the work that will be performed by the crew..." />
                ) : (
                  <span className="text-sm text-foreground">{workOrder?.description || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Internal Notes</label>
                {canEdit ? (
                  <Textarea rows={2} className="text-sm" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes..." />
                ) : (
                  <span className="text-sm text-muted-foreground">{workOrder?.notes || "—"}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Execution Readiness ─── */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Execution Readiness</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-xs">
                {hasTakeoff ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                <span className={hasTakeoff ? "text-emerald-700" : "text-amber-700"}>
                  {hasTakeoff ? `${takeoffs.length} takeoff(s) attached` : "No takeoff attached"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {hasWoItems ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                <span className={hasWoItems ? "text-emerald-700" : "text-amber-700"}>
                  Items: {woItems.length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {buildComplete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Hammer className="h-3.5 w-3.5 text-amber-500" />}
                <span className={buildComplete ? "text-emerald-700" : "text-amber-700"}>
                  {!latestBuildRequest ? "Build: N/A" : buildComplete ? "Build complete" : `Build: ${latestBuildRequest.status.replace(/_/g, " ")}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {(workOrder?.status === "completed") ? <Truck className="h-3.5 w-3.5 text-emerald-600" /> : <Truck className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className={workOrder?.status === "completed" ? "text-emerald-700" : "text-muted-foreground"}>
                  {workOrder?.status === "completed" ? "Complete" : "Not complete"}
                </span>
              </div>
            </div>
            {/* Quick actions row */}
            {canEdit && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {workOrder.status === "ready" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    onClick={() => setShowScheduleDialog(true)}
                    disabled={!readyToSchedule || !!dispatch}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {dispatch ? "Dispatch Scheduled" : "Schedule Dispatch"}
                  </Button>
                )}
                {dispatch && (
                  <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => router.push(`/dispatch/${dispatch.id}`)}>
                    <Truck className="h-3.5 w-3.5" /> View Dispatch
                  </Button>
                )}
                {dispatch?.status === "completed" && workOrder.status !== "sent_to_billing" && (
                  <Button
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/workorders/${workOrderId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: "completed" }),
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to update status');
                        }

                        toast.success("Marked as sent to billing");
                        // Refetch work order data
                        const workOrderResponse = await fetch(`/api/workorders/${workOrderId}`);
                        if (workOrderResponse.ok) {
                          const data = await workOrderResponse.json();
                          setWorkOrder(data);
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to send to billing');
                      }
                    }}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Send to Billing
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Linked Takeoffs Card ─── */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Linked Takeoffs
              </h2>
              <Badge variant="secondary" className="text-[10px] ml-1">{takeoffs.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {takeoffs.length === 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-7"
                    onClick={() => fetchRelated()}
                    disabled={loadingRelated}
                  >
                    {loadingRelated ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                    {loadingRelated ? "Fetching…" : "Fetch Takeoff"}
                  </Button>
                  {canCreateTakeoffs && dbJob && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 h-7"
                        onClick={() => {
                          setLoadingTakeoffs(true);
                          setShowLinkTakeoffModal(true);
                          // Fetch available takeoffs for this job
                          fetch(`/api/l/jobs/${dbJob.id}/takeoffs`)
                            .then(res => res.json())
                            .then(data => {
                              setAvailableTakeoffs(data);
                            })
                            .catch(err => {
                              console.error('Failed to fetch takeoffs:', err);
                              toast.error('Failed to load takeoffs');
                            })
                            .finally(() => setLoadingTakeoffs(false));
                        }}
                      >
                        <Package className="h-3 w-3" /> Link Takeoff
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7" onClick={() => router.push(`/l/${dbJob.id}/takeoffs/create`)}>
                        <Plus className="h-3 w-3" /> New Takeoff
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="p-5 overflow-x-auto">
            {loadingRelated || (takeoffId && takeoffLoading) ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : takeoffs.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No takeoffs linked</p>
                <p className="text-xs text-muted-foreground mt-1">Create a takeoff and link it to this work order.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-center">Items</TableHead>
                    <TableHead className="text-xs">Install Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {takeoffs.map((t) => {
                    const ts = TAKEOFF_STATUSES[t.status] || { label: t.status, color: "bg-muted text-muted-foreground" };
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-medium">{t.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.work_type}</TableCell>
                        <TableCell className="text-xs text-center font-mono">{woItems.length}</TableCell>
                        <TableCell className="text-xs">{t.install_date || "—"}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${ts.color}`}>{ts.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => router.push(`/l/${dbJob?.id}/takeoffs/view/${t.id}`)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* ─── Work Order Items Card — SOV items automatically populated ─── */}
        <div className="rounded-xl border bg-card p-4 overflow-x-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Work Order Items
            </h2>
            <Badge variant="secondary" className="text-[10px]">{woItems.filter(item => item.sov_item_id).length} SOV items</Badge>
          </div>

          {loadingRelated ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : woItems.filter(item => item.sov_item_id).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No SOV items found. Work order items will be automatically populated from the Schedule of Values when a takeoff is linked.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] text-xs">Item Number</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="w-[80px] text-xs">UOM</TableHead>
                    <TableHead className="w-[70px] text-xs text-right">Qty</TableHead>
                    <TableHead className="w-[100px] text-xs text-right">WO Qty</TableHead>
                    {canEdit && <TableHead className="w-[40px]" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {woItems.filter(item => item.sov_item_id).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-1.5">
                        {canEdit ? (
                          <Popover
                            open={openItemPickerRow === item.id}
                            onOpenChange={(open) => {
                              setOpenItemPickerRow(open ? item.id : null);
                              if (!open) setItemPickerSearch("");
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between h-7 text-xs font-normal"
                              >
                                {item.item_number || "Select item…"}
                                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[360px] p-0 z-50 bg-popover" align="start">
                              <Command>
                                <CommandInput placeholder="Search by # or description…" value={itemPickerSearch} onValueChange={setItemPickerSearch} />
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty className="py-2 px-3 text-xs text-muted-foreground">No matching items found.</CommandEmpty>
                                  <CommandGroup heading="Contract Items">
                                    {filteredSOVItems.slice(0, 50).map((sov) => {
                                      const alreadyUsed = selectedItemNumbers.has(sov.item_number) && item.item_number !== sov.item_number;
                                      return (
                                        <CommandItem
                                          key={sov.id}
                                          value={`${sov.item_number} ${sov.description}`}
                                          onSelect={async () => {
                                            if (alreadyUsed) {
                                              toast.warning(`Item ${sov.item_number} is already on this work order.`);
                                              return;
                                            }
                                            const updated = {
                                              item_number: sov.item_number,
                                              description: sov.description,
                                              contract_quantity: sov.quantity,
                                              uom: sov.uom,
                                              sov_item_id: sov.id,
                                            };
                                            setWoItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
                                            const response = await fetch(`/api/workorders/${workOrderId}/items`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                action: 'update',
                                                itemData: { itemId: item.id, updates: updated },
                                              }),
                                            });
                                            if (!response.ok) {
                                              const error = await response.json();
                                              toast.error(error.error || 'Failed to update item');
                                              // Revert the change
                                              setWoItems((prev) => prev.map((i) => i.id === item.id ? item : i));
                                            }
                                            setOpenItemPickerRow(null);
                                            setItemPickerSearch("");
                                          }}
                                          className={cn("text-xs", alreadyUsed && "opacity-50")}
                                        >
                                          <Check className={cn("mr-1.5 h-3 w-3", item.item_number === sov.item_number ? "opacity-100" : "opacity-0")} />
                                          <span className="font-mono mr-2 text-muted-foreground">{sov.item_number}</span>
                                          <span className="truncate">{sov.description}</span>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                  {!(workOrder as any).is_pickup && (
                                  <CommandGroup heading="Additional">
                                    {[
                                      { key: "DELIVERY", label: "Delivery", desc: "Job Site Delivery" },
                                      { key: "SERVICE", label: "Service", desc: "Job Site Service" },
                                    ].filter(opt =>
                                      opt.label.toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
                                      opt.desc.toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
                                      opt.key.toLowerCase().includes(itemPickerSearch.toLowerCase())
                                    ).map((opt) => {
                                      const alreadyUsed = selectedItemNumbers.has(opt.key) && item.item_number !== opt.key;
                                      return (
                                        <CommandItem
                                          key={opt.key}
                                          value={`${opt.key} ${opt.label} ${opt.desc}`}
                                          onSelect={async () => {
                                            if (alreadyUsed) {
                                              toast.warning(`${opt.label} is already on this work order.`);
                                              return;
                                            }
                                            const updated = {
                                              item_number: opt.key,
                                              description: opt.desc,
                                              contract_quantity: item.contract_quantity, // Keep existing quantity
                                              uom: "EA",
                                              sov_item_id: null,
                                            };
                                            setWoItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
                                            const response = await fetch(`/api/workorders/${workOrderId}/items`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                action: 'update',
                                                itemData: { itemId: item.id, updates: updated },
                                              }),
                                            });
                                            if (!response.ok) {
                                              const error = await response.json();
                                              toast.error(error.error || 'Failed to update item');
                                              // Revert the change
                                              setWoItems((prev) => prev.map((i) => i.id === item.id ? item : i));
                                            }
                                            setOpenItemPickerRow(null);
                                            setItemPickerSearch("");
                                          }}
                                          className={cn("text-xs", alreadyUsed && "opacity-50")}
                                        >
                                          <Check className={cn("mr-1.5 h-3 w-3", item.item_number === opt.key ? "opacity-100" : "opacity-0")} />
                                          <span className="font-mono mr-2 text-muted-foreground">{opt.key}</span>
                                          <span className="truncate">{opt.desc}</span>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                  )}
                                  <CommandGroup heading="Custom">
                                    <CommandItem
                                      value="__custom_item__"
                                      onSelect={() => {
                                        setCustomItemRowId(item.id);
                                        setCustomItemNumber("");
                                        setCustomItemDescription("");
                                        setCustomItemUom("EA");
                                        setCustomItemQty(1);
                                        setShowCustomItemDialog(true);
                                        setOpenItemPickerRow(null);
                                        setItemPickerSearch("");
                                      }}
                                      className="text-xs"
                                    >
                                      <Plus className="mr-1.5 h-3 w-3" />
                                      <span>Enter custom item…</span>
                                    </CommandItem>
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-xs font-mono truncate block px-1">{item.item_number}</span>
                        )}
                      </TableCell>
                      <TableCell className="p-1.5">
                        <span className="text-xs px-1 truncate block">{item.description || "—"}</span>
                      </TableCell>
                      <TableCell className="p-1.5">
                        <span className="text-xs px-1">{item.uom || "EA"}</span>
                      </TableCell>
                      <TableCell className="p-1.5">
                        <span className="text-xs text-right block">{item.contract_quantity}</span>
                      </TableCell>
                      <TableCell className="p-1.5">
                        {canEdit ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                const newQty = Math.max(0, (item.work_order_quantity || 0) - 1);
                                setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: newQty } : i));
                              }}
                              disabled={(item.work_order_quantity || 0) <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              className="h-7 text-xs text-center w-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.work_order_quantity || ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw.replace(/\D/g, '');
                                const num = cleaned === '' ? 0 : Math.max(0, parseInt(cleaned, 10));
                                setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: num } : i));
                              }}
                              onBlur={async () => {
                                const response = await fetch(`/api/workorders/${workOrderId}/items`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: 'update',
                                    itemData: { itemId: item.id, updates: { work_order_quantity: item.work_order_quantity } },
                                  }),
                                });
                                if (!response.ok) {
                                  const error = await response.json();
                                  toast.error(error.error || 'Failed to update quantity');
                                  // Revert the change
                                  setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: item.work_order_quantity } : i));
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                const newQty = (item.work_order_quantity || 0) + 1;
                                setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: newQty } : i));
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-right block">{item.work_order_quantity}</span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteItemConfirm(item.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* ─── Additional Items Card — Custom items added manually ─── */}
        <div className="rounded-xl border bg-card p-4 overflow-x-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              Additional Items
            </h2>
            <Badge variant="secondary" className="text-[10px]">{woItems.filter(item => !item.sov_item_id).length} custom items</Badge>
          </div>

          {loadingRelated ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : woItems.filter(item => !item.sov_item_id).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No additional items. Custom items added manually will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] text-xs">Item Number</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="w-[80px] text-xs">UOM</TableHead>
                    <TableHead className="w-[70px] text-xs text-right">Qty</TableHead>
                    <TableHead className="w-[100px] text-xs text-right">WO Qty</TableHead>
                    {canEdit && <TableHead className="w-[40px]" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {woItems.filter(item => !item.sov_item_id).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-1.5">
                        {canEdit ? (
                          <Popover
                            open={openItemPickerRow === item.id}
                            onOpenChange={(open) => {
                              setOpenItemPickerRow(open ? item.id : null);
                              if (!open) setItemPickerSearch("");
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between h-7 text-xs font-normal"
                              >
                                {item.item_number || "Select item…"}
                                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[360px] p-0 z-50 bg-popover" align="start">
                              <Command>
                                <CommandInput placeholder="Search by # or description…" value={itemPickerSearch} onValueChange={setItemPickerSearch} />
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty className="py-2 px-3 text-xs text-muted-foreground">No matching items found.</CommandEmpty>
                                  <CommandGroup heading="Contract Items">
                                    {filteredSOVItems.slice(0, 50).map((sov) => {
                                      const alreadyUsed = selectedItemNumbers.has(sov.item_number) && item.item_number !== sov.item_number;
                                      return (
                                        <CommandItem
                                          key={sov.id}
                                          value={`${sov.item_number} ${sov.description}`}
                                          onSelect={async () => {
                                            if (alreadyUsed) {
                                              toast.warning(`Item ${sov.item_number} is already on this work order.`);
                                              return;
                                            }
                                            const updated = {
                                              item_number: sov.item_number,
                                              description: sov.description,
                                              contract_quantity: sov.quantity,
                                              uom: sov.uom,
                                              sov_item_id: sov.id,
                                            };
                                            setWoItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
                                            const response = await fetch(`/api/workorders/${workOrderId}/items`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                action: 'update',
                                                itemData: { itemId: item.id, updates: updated },
                                              }),
                                            });
                                            if (!response.ok) {
                                              const error = await response.json();
                                              toast.error(error.error || 'Failed to update item');
                                              // Revert the change
                                              setWoItems((prev) => prev.map((i) => i.id === item.id ? item : i));
                                            }
                                            setOpenItemPickerRow(null);
                                            setItemPickerSearch("");
                                          }}
                                          className={cn("text-xs", alreadyUsed && "opacity-50")}
                                        >
                                          <Check className={cn("mr-1.5 h-3 w-3", item.item_number === sov.item_number ? "opacity-100" : "opacity-0")} />
                                          <span className="font-mono mr-2 text-muted-foreground">{sov.item_number}</span>
                                          <span className="truncate">{sov.description}</span>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                  {!(workOrder as any).is_pickup && (
                                  <CommandGroup heading="Additional">
                                    {[
                                      { key: "DELIVERY", label: "Delivery", desc: "Job Site Delivery" },
                                      { key: "SERVICE", label: "Service", desc: "Job Site Service" },
                                    ].filter(opt =>
                                      opt.label.toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
                                      opt.desc.toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
                                      opt.key.toLowerCase().includes(itemPickerSearch.toLowerCase())
                                    ).map((opt) => {
                                      const alreadyUsed = selectedItemNumbers.has(opt.key) && item.item_number !== opt.key;
                                      return (
                                        <CommandItem
                                          key={opt.key}
                                          value={`${opt.key} ${opt.label} ${opt.desc}`}
                                          onSelect={async () => {
                                            if (alreadyUsed) {
                                              toast.warning(`${opt.label} is already on this work order.`);
                                              return;
                                            }
                                            const updated = {
                                              item_number: opt.key,
                                              description: opt.desc,
                                              contract_quantity: item.contract_quantity, // Keep existing quantity
                                              uom: "EA",
                                              sov_item_id: null,
                                            };
                                            setWoItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
                                            const response = await fetch(`/api/workorders/${workOrderId}/items`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                action: 'update',
                                                itemData: { itemId: item.id, updates: updated },
                                              }),
                                            });
                                            if (!response.ok) {
                                              const error = await response.json();
                                              toast.error(error.error || 'Failed to update item');
                                              // Revert the change
                                              setWoItems((prev) => prev.map((i) => i.id === item.id ? item : i));
                                            }
                                            setOpenItemPickerRow(null);
                                            setItemPickerSearch("");
                                          }}
                                          className={cn("text-xs", alreadyUsed && "opacity-50")}
                                        >
                                          <Check className={cn("mr-1.5 h-3 w-3", item.item_number === opt.key ? "opacity-100" : "opacity-0")} />
                                          <span className="font-mono mr-2 text-muted-foreground">{opt.key}</span>
                                          <span className="truncate">{opt.desc}</span>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                  )}
                                  <CommandGroup heading="Custom">
                                    <CommandItem
                                      value="__custom_item__"
                                      onSelect={() => {
                                        setCustomItemRowId(item.id);
                                        setCustomItemNumber("");
                                        setCustomItemDescription("");
                                        setCustomItemUom("EA");
                                        setCustomItemQty(1);
                                        setShowCustomItemDialog(true);
                                        setOpenItemPickerRow(null);
                                        setItemPickerSearch("");
                                      }}
                                      className="text-xs"
                                    >
                                      <Plus className="mr-1.5 h-3 w-3" />
                                      <span>Enter custom item…</span>
                                    </CommandItem>
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-xs font-mono truncate block px-1">{item.item_number}</span>
                        )}
                      </TableCell>
                      <TableCell className="p-1.5">
                        <span className="text-xs px-1 truncate block">{item.description || "—"}</span>
                      </TableCell>
                      <TableCell className="p-1.5">
                        <span className="text-xs px-1">{item.uom || "EA"}</span>
                      </TableCell>
                      <TableCell className="p-1.5">
                        <span className="text-xs text-right block">{item.contract_quantity}</span>
                      </TableCell>
                      <TableCell className="p-1.5">
                        {canEdit ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                const newQty = Math.max(0, (item.work_order_quantity || 0) - 1);
                                setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: newQty } : i));
                              }}
                              disabled={(item.work_order_quantity || 0) <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              className="h-7 text-xs text-center w-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.work_order_quantity || ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw.replace(/\D/g, '');
                                const num = cleaned === '' ? 0 : Math.max(0, parseInt(cleaned, 10));
                                setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: num } : i));
                              }}
                              onBlur={async () => {
                                const response = await fetch(`/api/workorders/${workOrderId}/items`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: 'update',
                                    itemData: { itemId: item.id, updates: { work_order_quantity: item.work_order_quantity } },
                                  }),
                                });
                                if (!response.ok) {
                                  const error = await response.json();
                                  toast.error(error.error || 'Failed to update quantity');
                                  // Revert the change
                                  setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: item.work_order_quantity } : i));
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                const newQty = (item.work_order_quantity || 0) + 1;
                                setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: newQty } : i));
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-right block">{item.work_order_quantity}</span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteItemConfirm(item.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* ─── Documents Card ─── */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Attach Documents
              </h2>
              <Badge variant="secondary" className="text-[10px] ml-1">{documents.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {documents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-7"
                  onClick={handleCombineWithWO}
                  disabled={combining || selectedDocIds.size === 0}
                >
                  {combining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                  {combining ? "Combining…" : `Combine (${selectedDocIds.size}) with Work Order`}
                </Button>
              )}
              {canEdit && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="*/*"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-7"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="p-5">
            {documents.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No documents attached</p>
                <p className="text-xs text-muted-foreground mt-1">Upload files related to this work order.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.length > 1 && (
                  <div className="flex items-center gap-2 pb-1">
                    <Checkbox
                      checked={selectedDocIds.size > 0 && selectedDocIds.size === documents.filter(isCombinable).length}
                      onCheckedChange={toggleAllDocs}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[10px] text-muted-foreground">Select all combinable files</span>
                  </div>
                )}
                {documents.map((doc) => {
                  const combinable = isCombinable(doc);
                  return (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-md border bg-background">
                    {combinable && (
                      <Checkbox
                        checked={selectedDocIds.has(doc.id)}
                        onCheckedChange={() => toggleDocSelection(doc.id)}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                    )}
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <button onClick={() => handleViewDocument(doc)} className="text-xs font-medium text-primary hover:underline truncate block">
                        {doc.file_name}
                      </button>
                      <p className="text-[10px] text-muted-foreground">
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : "—"} · {new Date(doc.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDeleteDocument(doc)}>
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        {workOrder && (
          <div className="flex items-center gap-6 text-xs text-muted-foreground px-1">
            <span>Created: {new Date(workOrder.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span>Updated: {new Date(workOrder.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        )}
      </div>

      {/* ─── Dialogs ─── */}

      {/* Blocking Modal */}
      <Dialog open={blockingModalOpen} onOpenChange={setBlockingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {blockingModalType === "takeoff" ? "Takeoff Required" : "Work Order Items Required"}
            </DialogTitle>
            <DialogDescription>
              {blockingModalType === "takeoff"
                ? "A takeoff is required before this work order can proceed beyond draft status."
                : "At least one item must be selected on the Work Order before scheduling."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setBlockingModalOpen(false); setPendingStatusTransition(null); }}>
              Cancel
            </Button>
            {blockingModalType === "takeoff" && canCreateTakeoffs && dbJob && (
              <Button className="gap-1.5" onClick={() => { setBlockingModalOpen(false); setPendingStatusTransition(null); router.push(`/l/${dbJob.id}/takeoffs/create`); }}>
                <Plus className="h-3.5 w-3.5" /> Create Takeoff
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirm */}
      <Dialog open={!!deleteItemConfirm} onOpenChange={(open) => !open && setDeleteItemConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item</DialogTitle>
            <DialogDescription>This will remove this line item from the work order.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteItemConfirm || !workOrderId) return;
                const response = await fetch(`/api/workorders/${workOrderId}/items`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'delete',
                    itemData: { itemId: deleteItemConfirm },
                  }),
                });
                if (!response.ok) {
                  const error = await response.json();
                  toast.error(error.error || 'Failed to remove item');
                } else {
                  setWoItems((prev) => prev.filter(i => i.id !== deleteItemConfirm));
                }
                setDeleteItemConfirm(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dispatch Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Schedule Dispatch
            </DialogTitle>
            <DialogDescription>Pick a date to schedule this work order for dispatch.</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Scheduled Date</label>
            <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button
              disabled={!scheduleDate}
              onClick={async () => {
                if (!workOrderId || !scheduleDate || !workOrder?.job_id) return;
                try {
                  const response = await fetch(`/api/l/jobs/${workOrder.job_id}/work-orders/${workOrderId}/dispatch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scheduledDate: scheduleDate }),
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to schedule dispatch');
                  }

                  setShowScheduleDialog(false);

                } catch (err: any) {
                  toast.error(err.message || 'Failed to schedule dispatch');
                }
              }}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Custom Item Dialog */}
      <Dialog open={showCustomItemDialog} onOpenChange={setShowCustomItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Add Custom Line Item
            </DialogTitle>
            <DialogDescription>
              Enter item details manually. If this item is not in the Schedule of Values, you will be asked to confirm a change order has been submitted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Item Number</label>
              <Input className="text-sm" value={customItemNumber} onChange={(e) => setCustomItemNumber(e.target.value)} placeholder="e.g. 501, DELIVERY" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
              <Input className="text-sm" value={customItemDescription} onChange={(e) => setCustomItemDescription(e.target.value)} placeholder="Describe the item or service" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">UOM</label>
                <Input className="text-sm" value={customItemUom} onChange={(e) => setCustomItemUom(e.target.value)} placeholder="EA" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Quantity</label>
                <Input className="text-sm" type="number" min="1" value={customItemQty} onChange={(e) => setCustomItemQty(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomItemDialog(false)}>Cancel</Button>
            <Button
              disabled={!customItemNumber.trim() && !customItemDescription.trim()}
              onClick={() => {
                if (!customItemRowId) return;
                const itemNum = customItemNumber.trim().toUpperCase();
                const isInSOV = sovItems.some(s => s.item_number.toUpperCase() === itemNum);
                const isBuiltIn = ["DELIVERY", "SERVICE"].includes(itemNum);

                if (!isInSOV && !isBuiltIn && itemNum !== "") {
                  // Not in SOV — prompt change order confirmation
                  setPendingCustomItem({
                    rowId: customItemRowId,
                    itemNumber: customItemNumber.trim(),
                    description: customItemDescription.trim(),
                    uom: customItemUom.trim() || "EA",
                    qty: customItemQty,
                  });
                  setShowCustomItemDialog(false);
                  setShowChangeOrderConfirm(true);
                } else {
                  // In SOV or built-in — apply directly
                  applyCustomItem(customItemRowId, customItemNumber.trim(), customItemDescription.trim(), customItemUom.trim() || "EA", customItemQty);
                  setShowCustomItemDialog(false);
                }
              }}
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Order Confirmation Dialog */}
      <Dialog open={showChangeOrderConfirm} onOpenChange={(open) => { if (!open) { setShowChangeOrderConfirm(false); setPendingCustomItem(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Change Order Required
            </DialogTitle>
            <DialogDescription>
              This item ({pendingCustomItem?.itemNumber}) is not in the contract Schedule of Values.
              By adding it, you are confirming that a change order has been submitted or will be submitted for this additional work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowChangeOrderConfirm(false); setPendingCustomItem(null); }}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!pendingCustomItem) return;
                applyCustomItem(
                  pendingCustomItem.rowId,
                  pendingCustomItem.itemNumber,
                  pendingCustomItem.description,
                  pendingCustomItem.uom,
                  pendingCustomItem.qty,
                );
                setShowChangeOrderConfirm(false);
                setPendingCustomItem(null);
              }}
            >
              Confirm — Change Order Submitted
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Draft Work Order Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Work Order
            </DialogTitle>
            <DialogDescription>
              This will permanently delete this draft work order and all its line items. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!workOrderId) return;
                try {
                  const response = await fetch(`/api/workorders/${workOrderId}`, {
                    method: 'DELETE',
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete work order');
                  }

                  const result = await response.json();
                  toast.success("Work order deleted");
                  router.push(result.jobId ? `/l/${result.jobId}` : "/");
                } catch (err: any) {
                  toast.error(err.message || 'Failed to delete work order');
                }
                setShowDeleteDialog(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Takeoff Modal */}
      <Dialog open={showLinkTakeoffModal} onOpenChange={setShowLinkTakeoffModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Link Takeoff to Work Order
            </DialogTitle>
            <DialogDescription>
              Select a takeoff to link to this work order. This will add the takeoff to the linked list and populate work order items with items from the takeoff.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {loadingTakeoffs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                Loading takeoffs...
              </div>
            ) : availableTakeoffs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No takeoffs available for this job.</p>
                <p className="text-sm mt-1">Create a takeoff first to link it to this work order.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTakeoffs.map((takeoff) => {
                  const isAlreadyLinked = takeoffs.some(t => t.id === takeoff.id);
                  const ts = TAKEOFF_STATUSES[takeoff.status] || { label: takeoff.status, color: "bg-muted text-muted-foreground" };
                  return (
                    <div
                      key={takeoff.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                        isAlreadyLinked && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={async () => {
                        if (isAlreadyLinked) return;

                        try {
                          // For new work orders, we need to handle this differently
                          if (isNewWorkOrder) {
                            // For new work orders, we just add the takeoff to the list and populate items
                            // This will be handled when the work order is created
                            setTakeoffs(prev => [...prev, takeoff]);
                            toast.success(`Takeoff "${takeoff.title}" linked successfully`);
                            setShowLinkTakeoffModal(false);

                            // Fetch takeoff items and add them to work order items
                            const response = await fetch(`/api/l/takeoffs/${takeoff.id}/data`);
                            if (response.ok) {
                              const data = await response.json();
                              if (data.takeoff?.items) {
                                const newItems = data.takeoff.items.map((item: any, index: number) => ({
                                  id: `temp-${Date.now()}-${index}`,
                                  item_number: item.item_number || "",
                                  description: item.description || "",
                                  contract_quantity: item.quantity || 1,
                                  work_order_quantity: item.quantity || 1,
                                  uom: item.uom || "EA",
                                  sort_order: woItems.length + index,
                                }));
                                setWoItems(prev => [...prev, ...newItems]);
                              }
                            }
                          } else {
                            // For existing work orders, link the takeoff via API
                            console.log('Linking takeoff:', takeoff.id, 'to work order:', workOrderId);
                            const response = await fetch(`/api/workorders/${workOrderId}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ takeoff_id: takeoff.id }),
                            });

                            if (!response.ok) {
                              const error = await response.json();
                              console.error('Failed to link takeoff:', error);
                              throw new Error(error.error || 'Failed to link takeoff');
                            }

                            const result = await response.json();
                            console.log('PATCH result:', result);

                            // Optimistic update: immediately add takeoff to state
                            setTakeoffs(prev => {
                              // Avoid duplicates
                              if (prev.some(t => t.id === takeoff.id)) return prev;
                              return [...prev, {
                                id: takeoff.id,
                                title: takeoff.title,
                                status: takeoff.status,
                                work_type: takeoff.work_type,
                                install_date: takeoff.install_date,
                                pickup_date: takeoff.pickup_date,
                                item_count: takeoff.item_count || 0, // Use available data
                              }];
                            });

                            // After successfully linking the takeoff, update SOV work order quantities based on sign counts
                            const takeoffDataResponse = await fetch(`/api/l/takeoffs/${takeoff.id}/data`);
                            if (takeoffDataResponse.ok) {
                              const takeoffData = await takeoffDataResponse.json();
                              if (takeoffData.takeoff?.sign_rows) {
                                const signRowsData = takeoffData.takeoff.sign_rows || {};

                                // Count total signs by work type category
                                const signCounts: Record<string, number> = {};
                                for (const sectionName of Object.keys(signRowsData)) {
                                  const sectionRows = signRowsData[sectionName] || [];
                                  for (const row of sectionRows) {
                                    const quantity = row.quantity || 1;
                                    // Extract work type category from takeoff work_type (e.g., "MPT" from "MPT:trailblazers")
                                    const workTypeCategory = takeoff.work_type?.split(':')[0] || 'UNKNOWN';
                                    signCounts[workTypeCategory] = (signCounts[workTypeCategory] || 0) + quantity;
                                  }
                                }

                                // Update SOV work order items with sign counts
                                for (const [workType, signCount] of Object.entries(signCounts)) {
                                  // Find matching SOV work order item
                                  const matchingSovItem = woItems.find(item =>
                                    item.sov_item_id && // Must be a SOV item
                                    sovItemsFull.some(sov =>
                                      sov.id === item.sov_item_id &&
                                      // Match work type (handle both "permanent_sign" and "PERMANENT_SIGNS")
                                      (sov.itemNumber?.startsWith(workType === 'PERMANENT_SIGNS' ? '0937' : workType === 'MPT' ? '0901' : workType) ||
                                       sov.description?.toLowerCase().includes(workType.toLowerCase().replace('_', ' ')))
                                    )
                                  );

                                  if (matchingSovItem) {
                                    // Update the work_order_quantity for this SOV item
                                    const response = await fetch(`/api/workorders/${workOrderId}/items`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'update',
                                        itemData: {
                                          itemId: matchingSovItem.id,
                                          updates: { work_order_quantity: signCount }
                                        },
                                      }),
                                    });

                                    if (response.ok) {
                                      // Update local state
                                      setWoItems(prev => prev.map(item =>
                                        item.id === matchingSovItem.id
                                          ? { ...item, work_order_quantity: signCount }
                                          : item
                                      ));
                                    }
                                  }
                                }
                              }
                            }

                            toast.success(`Takeoff "${takeoff.title}" linked successfully`);
                            setShowLinkTakeoffModal(false);

                            // Background refresh to ensure data consistency
                            fetchRelated();
                          }
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to link takeoff');
                        }
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{takeoff.title}</span>
                          <Badge className={`text-[10px] ${ts.color}`}>{ts.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Type: {takeoff.work_type}</span>
                          <span>Items: {takeoff.item_count}</span>
                          {takeoff.install_date && <span>Install: {new Date(takeoff.install_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      {isAlreadyLinked && (
                        <span className="text-xs text-muted-foreground">Already linked</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkTakeoffModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrderDetail;
