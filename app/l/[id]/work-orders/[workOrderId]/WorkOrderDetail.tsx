'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder } from "@/hooks/useWorkOrders";
import { useCreateBuildRequest, useBuildRequestsByWorkOrder } from "@/hooks/useWorkOrders";
import { useCreatePickupWorkOrder } from "@/hooks/useWorkOrders";
import { useAuth } from "@/contexts/auth-context";
import { useDispatchByWorkOrder, useCreateDispatch } from "@/hooks/useWorkOrders";
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

const WorkOrderDetail = ({ workOrderId }: { workOrderId: string }) => {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = !!user;
  const isPM = !!user; // Assume PM if authenticated for now
  const canCreateTakeoffs = !!user; // Assume can create if authenticated
  const { data: workOrder, isLoading, refetch } = useWorkOrder(workOrderId);
  const updateWO = useUpdateWorkOrder();
  const createBuildRequest = useCreateBuildRequest();
  const { data: buildRequests = [] } = useBuildRequestsByWorkOrder(workOrderId);
  const { data: dispatch } = useDispatchByWorkOrder(workOrderId);
  const createDispatch = useCreateDispatch();
  const createPickupWO = useCreatePickupWorkOrder();
  const { deleteWorkOrder, deleting: deletingWO } = useDeleteWorkOrder();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [takeoffs, setTakeoffs] = useState<TakeoffSummary[]>([]);
  const [woItems, setWoItems] = useState<WOItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [pickupWO, setPickupWO] = useState<{ id: string; wo_number: string | null; status: string } | null>(null);

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

  // SOV picklist state
  const [sovItems, setSovItems] = useState<{ id: string; item_number: string; description: string; quantity: number; uom: string }[]>([]);
  const [openItemPickerRow, setOpenItemPickerRow] = useState<string | null>(null);
  const [itemPickerSearch, setItemPickerSearch] = useState("");

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

  const hasTakeoff = takeoffs.length > 0;
  const hasWoItems = woItems.length > 0;

  // Build readiness derived state
  const latestBuildRequest = buildRequests.length > 0 ? buildRequests[0] : null;
  const buildComplete = latestBuildRequest
    ? (latestBuildRequest.status === "completed" || !(latestBuildRequest as any).build_required)
    : true;

  // Combined readiness
  const readyToSchedule = hasTakeoff && hasWoItems && buildComplete;

  // Fetch related data
  const fetchRelated = useCallback(async () => {
    if (!workOrder) return;
    setLoadingRelated(true);
    try {
      const [jobRes, takeoffRes] = await Promise.all([
        supabase.from("jobs").select("id, project_name, etc_job_number, etc_branch, customer_name, customer_job_number, customer_pm, project_owner, county, etc_project_manager, contract_number").eq("id", workOrder.job_id).single(),
        supabase.from("takeoffs").select("id, title, status, work_type, install_date, pickup_date").eq("work_order_id", workOrder.id).order("created_at", { ascending: true }),
      ]);

      if (jobRes.data) setJob(jobRes.data as JobInfo);

      const takeoffList: TakeoffSummary[] = [];
      if (takeoffRes.data) {
        const takeoffIds = takeoffRes.data.map((t: any) => t.id);
        let itemCounts = new Map<string, number>();
        if (takeoffIds.length > 0) {
          const { data: items } = await supabase
            .from("takeoff_items")
            .select("takeoff_id")
            .in("takeoff_id", takeoffIds);
          (items || []).forEach((i: any) => {
            itemCounts.set(i.takeoff_id, (itemCounts.get(i.takeoff_id) || 0) + 1);
          });
        }
        takeoffRes.data.forEach((t: any) => {
          takeoffList.push({ ...t, item_count: itemCounts.get(t.id) || 0 });
        });
      }
      setTakeoffs(takeoffList);

      // Fetch work order items
      const { data: woItemsData } = await supabase
        .from("work_order_items")
        .select("*")
        .eq("work_order_id", workOrder.id)
        .order("sort_order", { ascending: true });
      setWoItems((woItemsData || []) as WOItem[]);

      // Fetch SOV items for picklist — try dedicated table first, fall back to JSONB column
      const { data: sovData } = await supabase
        .from("sov_items")
        .select("id, item_number, description, quantity, uom")
        .eq("job_id", workOrder.job_id)
        .order("sort_order", { ascending: true });

      let sovList: { id: string; item_number: string; description: string; quantity: number; uom: string }[] = [];
      if (sovData && sovData.length > 0) {
        sovList = sovData.map((s: any) => ({
          id: s.id,
          item_number: s.item_number || "",
          description: s.description || "",
          quantity: Number(s.quantity) || 0,
          uom: s.uom || "EA",
        }));
      } else if (jobRes.data) {
        // Fallback: read from JSONB sov_items column on jobs table
        const { data: jobFull } = await supabase
          .from("jobs")
          .select("sov_items")
          .eq("id", workOrder.job_id)
          .single();
        const jsonItems = (jobFull?.sov_items as any[]) || [];
        sovList = jsonItems.map((s: any) => ({
          id: s.id || crypto.randomUUID(),
          item_number: s.itemNumber || s.item_number || "",
          description: s.description || "",
          quantity: Number(s.quantity) || 0,
          uom: s.uom || "EA",
        }));
      }
      setSovItems(sovList);

      // Fetch documents linked to this work order (via job + checklist)
      const { data: docs } = await supabase
        .from("documents")
        .select("id, file_name, file_path, file_type, file_size, uploaded_at")
        .eq("job_id", workOrder.job_id)
        .like("file_path", `%work-orders/${workOrder.id}%`)
        .order("uploaded_at", { ascending: false });
      setDocuments((docs || []) as WODocument[]);

      // Fetch pickup work order if this is a parent
      if (!(workOrder as any).is_pickup) {
        const { data: puData } = await supabase
          .from("work_orders")
          .select("id, wo_number, status")
          .eq("parent_work_order_id", workOrder.id)
          .eq("is_pickup", true)
          .limit(1);
        setPickupWO(puData && puData.length > 0 ? puData[0] as any : null);
      }
    } catch (err) {
      console.error("Failed to fetch related data", err);
    } finally {
      setLoadingRelated(false);
    }
  }, [workOrder]);

  useEffect(() => { fetchRelated(); }, [fetchRelated]);

  // Sync editing fields
  useEffect(() => {
    if (workOrder) {
      setEditTitle(workOrder.title || "");
      setEditDescription(workOrder.description || "");
      setEditNotes(workOrder.notes || "");
      setEditScheduledDate(workOrder.scheduled_date || "");
      setEditAssignedTo(workOrder.assigned_to || "");
      setEditContractedOrAdditional((workOrder as any).contracted_or_additional || "contracted");
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

  const handleSave = async () => {
    if (!workOrderId) return;
    setSaving(true);
    try {
      await updateWO.mutateAsync({
        workOrderId,
        patch: {
          title: editTitle,
          description: editDescription,
          notes: editNotes,
          scheduledDate: editScheduledDate || null,
          assignedTo: editAssignedTo,
          contractedOrAdditional: editContractedOrAdditional,
          customerPocPhone: editCustomerPocPhone,
        },
      });
      // Also sync install/pickup dates to linked takeoff(s)
      if (takeoffs.length > 0) {
        const takeoffId = takeoffs[0].id;
        try {
          const isPickupWO = (workOrder as any).is_pickup;
          // For PU work orders, only sync pickup date; for normal WOs, sync both
          const datePatch: Record<string, string | null> = isPickupWO
            ? { pickupDate: editPickupDate || null }
            : { installDate: editInstallDate || null, pickupDate: editPickupDate || null };

          await supabase.functions.invoke("upsert-takeoff", {
            body: { takeoffId, patch: datePatch },
          });

          // For PU work orders, also update pickup date on ALL takeoffs for this job
          if (isPickupWO && editPickupDate) {
            const { data: allJobTakeoffs } = await supabase
              .from("takeoffs")
              .select("id")
              .eq("job_id", workOrder.job_id);
            if (allJobTakeoffs) {
              for (const t of allJobTakeoffs) {
                if (t.id === takeoffId) continue;
                await supabase.functions.invoke("upsert-takeoff", {
                  body: { takeoffId: t.id, patch: { pickupDate: editPickupDate } },
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to sync dates to takeoff:", e);
        }
      }
      setLastSavedAt(new Date());
      refetch();
      fetchRelated();
    } catch (err: any) {
      // toast already shown by hook
    } finally {
      setSaving(false);
    }
  };

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
      await updateWO.mutateAsync({
        workOrderId,
        patch: { status: newStatus },
      });
      refetch();
    } catch {
      // toast shown by hook
    }
  };

  // Document upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !workOrder) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const filePath = `${workOrder.job_id}/work-orders/${workOrder.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("contract-documents")
          .upload(filePath, file);
        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        const { error: insertError } = await supabase.from("documents").insert({
          job_id: workOrder.job_id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || null,
          file_size: file.size,
        });
        if (insertError) {
          toast.error(`Failed to save record for ${file.name}`);
        }
      }
      toast.success("Document(s) uploaded");
      fetchRelated();
    } catch (err) {
      toast.error("Upload failed");
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
        projectName: job?.project_name || "",
        etcJobNumber: job?.etc_job_number || "",
        customerName: job?.customer_name || "",
        customerJobNumber: job?.customer_job_number || "",
        customerPM: job?.customer_pm || "",
        projectOwner: job?.project_owner || "",
        county: job?.county || "",
        etcBranch: job?.etc_branch || "",
        etcProjectManager: job?.etc_project_manager || "",
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
          const { data: urlData } = await supabase.storage
            .from("contract-documents")
            .createSignedUrl(doc.file_path, 300);
          if (!urlData?.signedUrl) continue;

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
    const { error: storageErr } = await supabase.storage
      .from("contract-documents")
      .remove([doc.file_path]);
    if (storageErr) {
      toast.error("Failed to delete file from storage");
      return;
    }
    const { error: dbErr } = await supabase.from("documents").delete().eq("id", doc.id);
    if (dbErr) {
      toast.error("Failed to delete document record");
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    toast.success("Document deleted");
  };

  const handleViewDocument = async (doc: WODocument) => {
    const { data } = await supabase.storage
      .from("contract-documents")
      .createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Failed to generate download link");
    }
  };

  const applyCustomItem = async (rowId: string, itemNumber: string, description: string, uom: string, qty: number) => {
    const updated = {
      item_number: itemNumber,
      description: description,
      contract_quantity: qty,
      work_order_quantity: qty,
      uom: uom,
      sov_item_id: null,
    };
    setWoItems((prev) => prev.map((i) => i.id === rowId ? { ...i, ...updated } : i));
    await supabase.from("work_order_items").update(updated).eq("id", rowId);
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

  if (!workOrder) {
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

  const statusConfig = getStatusConfig(workOrder.status);
  const canEdit = isAdmin || isPM;
  const isDraft = workOrder.status === "draft";

  return (
    <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
      <div className="w-full px-6 py-6 flex-1">
        {/* ─── Page Title Bar — matches Takeoff style ─── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {(workOrder as any).is_pickup ? "Pickup Work Order" : "Work Order"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {job?.project_name || "Untitled Project"} · {job?.etc_job_number || "—"}
                {workOrder.wo_number && <span className="ml-2 font-semibold">· {workOrder.wo_number}</span>}
              </p>
            </div>
            <Badge className={`ml-2 text-[10px] font-bold ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
            {(workOrder as any).is_pickup && (
              <Badge className="ml-1 text-[10px] font-bold bg-orange-500/15 text-orange-700">Pickup</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            {lastSavedAt && (
              <span className="text-[10px] text-muted-foreground mr-2">
                Last saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => job ? router.push(`/l/${job.id}`) : router.back()}>Back</Button>
            {canEdit && (
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving…" : "Save"}
              </Button>
            )}
            {/* Download Work Order PDF */}
            {hasWoItems && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={async () => {
                  await generateBillingPacketPdf({
                    woNumber: workOrder.wo_number || "",
                    woTitle: workOrder.title || "",
                    woDescription: workOrder.description || "",
                    woNotes: workOrder.notes || "",
                    etcAssignedTo: workOrder.assigned_to || "",
                    contractedOrAdditional: (workOrder as any).contracted_or_additional || "contracted",
                    customerPocPhone: workOrder.customer_poc_phone || "",
                    projectName: job?.project_name || "",
                    etcJobNumber: job?.etc_job_number || "",
                    customerName: job?.customer_name || "",
                    customerJobNumber: job?.customer_job_number || "",
                    customerPM: job?.customer_pm || "",
                    projectOwner: job?.project_owner || "",
                    county: job?.county || "",
                    etcBranch: job?.etc_branch || "",
                    etcProjectManager: job?.etc_project_manager || "",
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
                  });
                }}
              >
                <FileDown className="h-3.5 w-3.5" /> WO PDF
              </Button>
            )}
            {/* Download Takeoff PDF */}
            {hasTakeoff && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={async () => {
                  try {
                    const takeoffId = workOrder.takeoff_id;
                    if (!takeoffId) return;
                    const [tRes, tiRes] = await Promise.all([
                      supabase.from("takeoffs").select("*").eq("id", takeoffId).single(),
                      supabase.from("takeoff_items").select("*").eq("takeoff_id", takeoffId).order("created_at"),
                    ]);
                    if (!tRes.data) { toast.error("Takeoff not found"); return; }
                    const { generateTakeoffPdf } = await import("@/utils/generateTakeoffPdf");
                    generateTakeoffPdf(takeoffId);
                  } catch (err) {
                    toast.error("Failed to generate takeoff PDF");
                  }
                }}
              >
                <FileDown className="h-3.5 w-3.5" /> Takeoff PDF
              </Button>
            )}
            {/* Combine WO + Takeoff into one document */}
            {hasTakeoff && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={async () => {
                  try {
                    const takeoffId = workOrder.takeoff_id;
                    if (!takeoffId) return;

                    // Generate WO PDF as bytes
                    const woBytes = await generateBillingPacketPdf({
                      woNumber: workOrder.wo_number || "",
                      woTitle: workOrder.title || "",
                      woDescription: workOrder.description || "",
                      woNotes: workOrder.notes || "",
                      etcAssignedTo: workOrder.assigned_to || "",
                      contractedOrAdditional: (workOrder as any).contracted_or_additional || "contracted",
                      customerPocPhone: workOrder.customer_poc_phone || "",
                      projectName: job?.project_name || "",
                      etcJobNumber: job?.etc_job_number || "",
                      customerName: job?.customer_name || "",
                      customerJobNumber: job?.customer_job_number || "",
                      customerPM: job?.customer_pm || "",
                      projectOwner: job?.project_owner || "",
                      county: job?.county || "",
                      etcBranch: job?.etc_branch || "",
                      etcProjectManager: job?.etc_project_manager || "",
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
                    if (!woBytes) { toast.error("Failed to generate work order PDF"); return; }

                    // Fetch takeoff data and generate takeoff PDF as bytes
                    const [tRes, tiRes] = await Promise.all([
                      supabase.from("takeoffs").select("*").eq("id", takeoffId).single(),
                      supabase.from("takeoff_items").select("*").eq("takeoff_id", takeoffId).order("created_at"),
                    ]);
                    if (!tRes.data) { toast.error("Takeoff not found"); return; }

                    const { generateTakeoffPdf } = await import("@/utils/generateTakeoffPdf");
                    const takeoffBytes = await generateTakeoffPdf(takeoffId);
                    if (!takeoffBytes) { toast.error("Failed to generate takeoff PDF"); return; }

                    // Merge both PDFs
                    const mergedPdf = await PDFDocument.create();
                    const woPdf = await PDFDocument.load(woBytes);
                    const woPages = await mergedPdf.copyPages(woPdf, woPdf.getPageIndices());
                    woPages.forEach(p => mergedPdf.addPage(p));

                    const takeoffPdf = await PDFDocument.load(takeoffBytes);
                    const takeoffPages = await mergedPdf.copyPages(takeoffPdf, takeoffPdf.getPageIndices());
                    takeoffPages.forEach(p => mergedPdf.addPage(p));

                    const mergedBytes = await mergedPdf.save();
                    const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `WO_Takeoff_${workOrder.wo_number || "WO"}_${new Date().toISOString().split("T")[0]}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Combined WO + Takeoff PDF downloaded");
                  } catch (err: any) {
                    console.error("Combine WO+Takeoff failed:", err);
                    toast.error("Failed to combine documents");
                  }
                }}
              >
                <Paperclip className="h-3.5 w-3.5" /> WO + Takeoff PDF
              </Button>
            )}
            {/* Quick action: Mark Ready */}
            {canEdit && isDraft && hasTakeoff && (
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => handleStatusChange("ready")}>
                <Send className="h-3.5 w-3.5" /> Mark Ready
              </Button>
            )}
            {/* Delete Draft Work Order */}
            {canEdit && isDraft && (
              <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setShowDeleteDialog(true)} disabled={deletingWO}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
            {/* Create Pickup WO — only for MPT/Rental parent WOs */}
            {canEdit && !(workOrder as any).is_pickup && hasTakeoff && !pickupWO && takeoffs.some(t => ["MPT", "RENTAL"].includes(t.work_type)) && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                disabled={createPickupWO.isPending}
                onClick={async () => {
                  if (!workOrderId) return;
                  const result = await createPickupWO.mutateAsync(workOrderId);
                  router.push(`/work-order/${result.workOrder.id}`);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {createPickupWO.isPending ? "Creating…" : "Create Pickup WO"}
              </Button>
            )}
            {/* Link to existing Pickup WO */}
            {pickupWO && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push(`/work-order/${pickupWO.id}`)}>
                <RotateCcw className="h-3.5 w-3.5" /> View Pickup WO {pickupWO.wo_number ? `(${pickupWO.wo_number})` : ""}
              </Button>
            )}
          </div>
        </div>

        {/* Takeoff Required Alert */}
        {!hasTakeoff && !loadingRelated && (
          <div className="rounded-lg border px-4 py-3 flex items-center justify-between text-sm bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span><strong>Takeoff Required.</strong> This work order cannot proceed beyond draft until a takeoff is attached.</span>
            </div>
            {canCreateTakeoffs && job && (
              <Button size="sm" className="text-xs gap-1.5 shrink-0" onClick={() => router.push(`/l/${job.id}/takeoffs/create`)}>
                <Plus className="h-3.5 w-3.5" /> Create Takeoff
              </Button>
            )}
          </div>
        )}

        {/* ─── Project Information Card — matching takeoff ─── */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Information</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-xs">
              <AdminField label="Branch" value={job?.etc_branch || "—"} />
              <AdminField label="ETC Project Manager" value={job?.etc_project_manager || "—"} />
              <AdminField label="ETC Job #" value={job?.etc_job_number || "—"} mono />
              <AdminField label="County" value={job?.county || "—"} />
              <AdminField label="Customer" value={job?.customer_name || "—"} />
              <AdminField label="Customer PM / POC" value={job?.customer_pm || "—"} />
              <AdminField label="Customer Job #" value={job?.customer_job_number || "—"} />
              <AdminField label="Owner" value={job?.project_owner || "—"} />
              <AdminField label="Owner Contract #" value={job?.contract_number || "—"} />
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
                  <span className="text-sm text-foreground">{workOrder.title || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">WO Number</label>
                <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground font-mono">
                  {workOrder.wo_number || "—"}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Status</label>
                {canEdit ? (
                  <Select value={workOrder.status} onValueChange={handleStatusChange}>
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
                  <span className="text-sm text-foreground">{workOrder.assigned_to || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer POC Phone</label>
                {canEdit ? (
                  <Input className="h-9 text-sm" value={editCustomerPocPhone} onChange={(e) => setEditCustomerPocPhone(e.target.value)} placeholder="(555) 123-4567" />
                ) : (
                  <span className="text-sm text-foreground">{workOrder.customer_poc_phone || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Install Date</label>
                {canEdit && !(workOrder as any).is_pickup ? (
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
                  <span className="text-sm text-foreground">{workOrder.description || "—"}</span>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Internal Notes</label>
                {canEdit ? (
                  <Textarea rows={2} className="text-sm" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes..." />
                ) : (
                  <span className="text-sm text-muted-foreground">{workOrder.notes || "—"}</span>
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
                {workOrder.status === "completed" ? <Truck className="h-3.5 w-3.5 text-emerald-600" /> : <Truck className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className={workOrder.status === "completed" ? "text-emerald-700" : "text-muted-foreground"}>
                  {workOrder.status === "completed" ? "Complete" : "Not complete"}
                </span>
              </div>
            </div>
            {/* Quick actions row */}
            {canEdit && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {isDraft && !hasTakeoff && canCreateTakeoffs && job && null}
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
                        await updateWO.mutateAsync({ workOrderId: workOrderId!, patch: { status: "completed" } });
                        toast.success("Marked as sent to billing");
                        refetch();
                      } catch {}
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
            {canCreateTakeoffs && job && (
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7" onClick={() => router.push(`/l/${job.id}/takeoffs/create`)}>
                <Plus className="h-3 w-3" /> New Takeoff
              </Button>
            )}
          </div>
          <div className="p-5">
            {loadingRelated ? (
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
                        <TableCell className="text-xs text-center font-mono">{t.item_count}</TableCell>
                        <TableCell className="text-xs">{t.install_date || "—"}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${ts.color}`}>{ts.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => router.push(`/l/${job?.id}/takeoff/${t.id}`)}>
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

        {/* ─── Work Order Items Card — matches SOV table style ─── */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Work Order Items
            </h2>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={async () => {
                  if (!workOrderId) return;
                  const nextSort = woItems.length > 0 ? Math.max(...woItems.map(i => i.sort_order)) + 1 : 0;
                  const { data, error } = await supabase
                    .from("work_order_items")
                    .insert({
                      work_order_id: workOrderId,
                      item_number: "",
                      description: "",
                      contract_quantity: 1,
                      work_order_quantity: 1,
                      uom: "EA",
                      sort_order: nextSort,
                    })
                    .select("*")
                    .single();
                  if (error) {
                    toast.error("Failed to add item");
                  } else if (data) {
                    setWoItems((prev) => [...prev, data as WOItem]);
                  }
                }}
              >
                <Plus className="h-3 w-3" /> Add Line Item
              </Button>
            )}
          </div>

          {loadingRelated ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : woItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No line items yet. Click "Add Line Item" to begin.
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
                  {woItems.map((item) => (
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
                                            await supabase.from("work_order_items").update(updated).eq("id", item.id);
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
                                              contract_quantity: 1,
                                              uom: "EA",
                                              sov_item_id: null,
                                            };
                                            setWoItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...updated } : i));
                                            await supabase.from("work_order_items").update(updated).eq("id", item.id);
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
                          <Input
                            className="h-7 text-xs text-right w-[100px]"
                            type="number"
                            step="1"
                            min="0"
                            value={item.work_order_quantity || ""}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setWoItems((prev) => prev.map(i => i.id === item.id ? { ...i, work_order_quantity: val } : i));
                            }}
                            onBlur={async () => {
                              await supabase.from("work_order_items").update({ work_order_quantity: item.work_order_quantity }).eq("id", item.id);
                            }}
                          />
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
        <div className="flex items-center gap-6 text-xs text-muted-foreground px-1">
          <span>Created: {new Date(workOrder.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          <span>Updated: {new Date(workOrder.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
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
            {blockingModalType === "takeoff" && canCreateTakeoffs && job && (
              <Button className="gap-1.5" onClick={() => { setBlockingModalOpen(false); setPendingStatusTransition(null); router.push(`/l/${job.id}/takeoffs/create`); }}>
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
                if (!deleteItemConfirm) return;
                const { error } = await supabase.from("work_order_items").delete().eq("id", deleteItemConfirm);
                if (error) {
                  toast.error("Failed to remove item");
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
              disabled={!scheduleDate || createDispatch.isPending}
              onClick={async () => {
                if (!workOrderId || !scheduleDate) return;
                try {
                  await createDispatch.mutateAsync({ workOrderId, scheduledDate: scheduleDate });
                  setShowScheduleDialog(false);
                  refetch();
                } catch {}
              }}
            >
              {createDispatch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
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
              This item ({pendingCustomItem?.itemNumber}) is not in the contract's Schedule of Values.
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
            <Button variant="outline" disabled={deletingWO} onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deletingWO}
              onClick={async () => {
                if (!workOrderId) return;
                const result = await deleteWorkOrder(workOrderId);
                if (result.success) {
                  toast.success("Work order deleted");
                  router.push(result.jobId ? `/l/${result.jobId}` : "/");
                }
                setShowDeleteDialog(false);
              }}
            >
              {deletingWO ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              {deletingWO ? "Deleting…" : "Delete Work Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrderDetail;