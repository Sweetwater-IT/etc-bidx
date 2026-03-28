"use client";

import { useState, useEffect } from "react";
import type { ScheduleOfValuesItem, JobFromDB } from "@/types/job";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { SOVTable } from "@/components/SOVTable";
import { EquipmentSummary } from "@/app/l/components/EquipmentSummary";
import { QuoteNotes, type Note } from "@/components/pages/quote-form/QuoteNotes";
import { DocumentsFormsStep } from "@/app/l/components/DocumentsFormsStep";
import type { ContractDocument, DocumentCategory } from "@/types/document";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Package,
  FileText,
  CalendarDays,
  Truck,
  ClipboardCheck,
  Phone,
  Mail,
  Building2,
  User,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Plus,
  Users,
  ShoppingCart,
  Bell,
  Camera,
  StickyNote,
  DollarSign,
  Layers,
  Factory,
  MapPin,
  Calendar,
  TrendingUp,
  ChevronRight,
  PanelRightOpen,
  Timer,
  Wrench,
  FileCheck,
  ClipboardList,
  Loader2,
  Maximize2,
  Trash2,
} from "lucide-react";

type Job360Tab =
  | "bid-items"
  | "takeoffs"
  | "equipment"
  | "customer-admin"
  | "labor"
  | "manufacturing"
  | "dispatch"
  | "notes"
  | "documents"
  | "purchase-orders";

const formatWorkType = (workType: string) => {
  const workTypeMap: Record<string, string> = {
    MPT: "MPT",
    PERMANENT_SIGNS: "Permanent Signs",
    FLAGGING: "Flagging",
    LANE_CLOSURE: "Lane Closure",
    SERVICE: "Service",
    DELIVERY: "Delivery",
    RENTAL: "Rental",
    permanent_sign: "Permanent Sign",
    permanent_signs: "Permanent Sign",
    lane_closure: "Lane Closure",
    flagging: "Flagging",
    mpt: "MPT",
  };
  return workTypeMap[workType] || workType;
};

const TAKEOFF_WORK_TYPE_COLORS: Record<string, string> = {
  MPT: "bg-blue-500/15 text-blue-700",
  PERMANENT_SIGNS: "bg-purple-500/15 text-purple-700",
  FLAGGING: "bg-amber-500/15 text-amber-700",
  LANE_CLOSURE: "bg-amber-500/15 text-amber-700",
  DELIVERY: "bg-emerald-500/15 text-emerald-700",
  SERVICE: "bg-indigo-500/15 text-indigo-700",
  RENTAL: "bg-red-500/15 text-red-700",
};

const TAKEOFF_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent_to_build_shop: "bg-blue-500/15 text-blue-700",
  sent_to_sign_shop: "bg-purple-500/15 text-purple-700",
  submitted: "bg-blue-500/15 text-blue-700",
  in_progress: "bg-amber-500/15 text-amber-700",
  ready: "bg-emerald-500/15 text-emerald-700",
  complete: "bg-emerald-500/15 text-emerald-700",
  completed: "bg-emerald-500/15 text-emerald-700",
  canceled: "bg-destructive/15 text-destructive",
  cancelled: "bg-destructive/15 text-destructive",
};

const formatTakeoffStatus = (status: string) => status.replace(/_/g, " ");

const formatWorkOrderNumber = (workOrderNumber?: string | number | null) => {
  if (workOrderNumber === null || workOrderNumber === undefined) return "—";
  const asString = String(workOrderNumber).trim();
  if (!asString) return "—";
  return asString.padStart(3, "0");
};

const ProjectDetail = () => {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { user } = useAuth();
  const [dbJob, setDbJob] = useState<JobFromDB | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Job360Tab>("bid-items");
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  const [signOrderCounts, setSignOrderCounts] = useState({ submitted: 0, in_production: 0, complete: 0, closed: 0 });
  const [projectNotes, setProjectNotes] = useState<Note[]>([]);
  const [projectNotesLoading, setProjectNotesLoading] = useState(true);
  const [woDialogOpen, setWoDialogOpen] = useState(false);
  const [editJobOpen, setEditJobOpen] = useState(false);
  const [editCustomerPM, setEditCustomerPM] = useState("");
  const [editCustomerPMEmail, setEditCustomerPMEmail] = useState("");
  const [editCustomerPMPhone, setEditCustomerPMPhone] = useState("");
  const [editExtensionDate, setEditExtensionDate] = useState("");
  const [editJobSaving, setEditJobSaving] = useState(false);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [takeoffsCount, setTakeoffsCount] = useState(0);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  // Fetch job data on mount
  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/l/jobs/${id}`);
        if (response.ok) {
          const jobData = await response.json();
          setDbJob(jobData);
        } else {
          console.error('Failed to fetch job');
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setJobLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchCounts = async () => {
      try {
        const response = await fetch(`/api/l/sign-orders/job/${id}/counts`);
        if (response.ok) {
          const counts = await response.json();
          setSignOrderCounts(counts);
        } else {
          console.error('Failed to fetch sign order counts');
        }
      } catch (error) {
        console.error('Error fetching sign order counts:', error);
      }
    };

    fetchCounts();
    // Removed realtime subscription for now
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchWorkOrders = async () => {
      try {
        const response = await fetch(`/api/l/jobs/${id}/work-orders`);
        if (response.ok) {
          const workOrdersData = await response.json();
          setWorkOrders(workOrdersData);
        } else {
          console.error('Failed to fetch work orders');
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
      }
    };

    fetchWorkOrders();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchTakeoffsCount = async () => {
      try {
        const response = await fetch(`/api/l/jobs/${id}/takeoffs`);
        if (response.ok) {
          const takeoffsData = await response.json();
          setTakeoffsCount(takeoffsData.length);
        } else {
          console.error('Failed to fetch takeoffs count');
        }
      } catch (error) {
        console.error('Error fetching takeoffs count:', error);
      }
    };

    fetchTakeoffsCount();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchDocuments = async () => {
      setDocumentsLoading(true);
      try {
        const response = await fetch(`/api/l/jobs/${id}/documents`);
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        const data = await response.json();
        const mapped: ContractDocument[] = (data || []).map((doc: any) => ({
          id: doc.id,
          name: doc.file_name || "Document",
          size: Number(doc.file_size || 0),
          type: doc.mime_type || doc.file_type || "application/octet-stream",
          category: (doc.file_type || "other") as DocumentCategory,
          uploadedAt: doc.uploaded_at || doc.created_at || new Date().toISOString(),
          filePath: doc.file_path || undefined,
        }));
        setDocuments(mapped);
      } catch (error) {
        console.error("Error fetching documents:", error);
        setDocuments([]);
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchProjectNotes = async () => {
      setProjectNotesLoading(true);
      try {
        const response = await fetch(`/api/l/jobs/${id}/notes`);
        if (response.ok) {
          const notes = await response.json();
          setProjectNotes(Array.isArray(notes) ? notes : []);
        } else {
          console.error("Failed to fetch project notes");
          setProjectNotes([]);
        }
      } catch (error) {
        console.error("Error fetching project notes:", error);
        setProjectNotes([]);
      } finally {
        setProjectNotesLoading(false);
      }
    };

    fetchProjectNotes();
  }, [id]);

  const handleAddProjectNote = async (note: Note) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/l/jobs/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: {
            ...note,
            user_email: user?.email || note.user_email,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      const savedNote = await response.json();
      setProjectNotes((prev) => [...prev, savedNote]);
      toast.success("Note added");
    } catch (error) {
      console.error("Error adding project note:", error);
      toast.error("Failed to add note");
    }
  };

  const handleEditProjectNote = async (index: number, updatedNote: Note) => {
    if (!id || !projectNotes[index]?.id) return;
    try {
      const response = await fetch(`/api/l/jobs/${id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectNotes[index].id,
          text: updatedNote.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      const savedNote = await response.json();
      setProjectNotes((prev) => prev.map((note, noteIndex) => (noteIndex === index ? savedNote : note)));
      toast.success("Note updated");
    } catch (error) {
      console.error("Error updating project note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleDeleteProjectNote = async (index: number) => {
    if (!id || !projectNotes[index]?.id) return;
    try {
      const response = await fetch(`/api/l/jobs/${id}/notes?id=${encodeURIComponent(String(projectNotes[index].id))}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setProjectNotes((prev) => prev.filter((_, noteIndex) => noteIndex !== index));
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting project note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleAddDocuments = async (
    files: File[],
    associatedItemId?: string,
    _associatedItemLabel?: string,
    category?: DocumentCategory
  ) => {
    if (!id) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("associatedItemId", associatedItemId || "");
    formData.append("category", category || "other");

    try {
      const response = await fetch(`/api/l/jobs/${id}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload documents");
      }

      const result = await response.json();
      setDocuments((prev) => [...result.documents, ...prev]);
      toast.success(`${files.length} document(s) uploaded`);
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Failed to upload documents");
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!id) return;

    try {
      const response = await fetch(`/api/l/jobs/${id}/documents?documentId=${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleUpdateDocumentCategory = async (documentId: string, category: DocumentCategory) => {
    if (!id) return;

    try {
      const response = await fetch(`/api/l/jobs/${id}/documents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, category }),
      });

      if (!response.ok) {
        throw new Error("Failed to update document type");
      }

      setDocuments((prev) => prev.map((doc) => (doc.id === documentId ? { ...doc, category } : doc)));
    } catch (error) {
      console.error("Error updating document category:", error);
      toast.error("Failed to update document type");
    }
  };

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dbJob) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Job not found. It may not have been saved to the database yet.</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Job List
          </Button>
        </div>
      </div>
    );
  }

  const info = dbJob.projectInfo;
  const job = dbJob;

  // Status calculations
  const startDate = info.projectStartDate ? new Date(info.projectStartDate) : null;
  const endDate = info.projectEndDate ? new Date(info.projectEndDate) : null;
  const today = new Date();
  const totalDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) : 0;
  const elapsedDays = startDate ? Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86400000)) : 0;
  const remainingDays = startDate && endDate ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000)) : 0;

  const jobStatus = job.project_status === "COMPLETE"
    ? "Completed"
    : remainingDays < 0
    ? "Overdue"
    : job.project_status === "IN PROGRESS"
    ? "Active"
    : "Planned";

  const statusColor = {
    Planned: "bg-muted text-muted-foreground",
    Active: "bg-blue-500/15 text-blue-700",
    Completed: "bg-success/15 text-success",
    Overdue: "bg-destructive/15 text-destructive",
  }[jobStatus];

  const notesEmptyState = (
    <div className="text-xs italic text-muted-foreground">
      No notes yet. Use &quot;Add Note&quot; to get started.
    </div>
  );

  const notesButtonClassName = "h-7 bg-[#16335A] px-2.5 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-[#122947]";

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 pt-0 pb-4 md:gap-6 md:pt-0 md:pb-6">
          {/* ─── TOP HEADER BAR ─── */}
          <header className="border-b bg-card shrink-0">
        <div className="w-full px-4 pt-2 pb-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/l/jobs")}
                className="shrink-0 h-7 w-7"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3 text-xs min-w-0">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Job Name</span>
                  <span className="text-xs font-bold text-foreground truncate block">{info.projectName || "Untitled"}</span>
                </div>
                {info.etcJobNumber && (
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">ETC Job #</span>
                    <span className="text-xs font-mono font-bold text-primary truncate block">{info.etcJobNumber}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Customer</span>
                  <span className="text-xs text-foreground truncate block">{info.customerName || "—"}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Customer Job #</span>
                  <span className="text-xs font-mono text-foreground truncate block">{info.customerJobNumber || "—"}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Customer PM</span>
                  <span className="text-xs text-foreground truncate block">{info.customerPM || "—"}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Project Owner</span>
                  <span className="text-xs text-foreground truncate block">{info.projectOwner || "—"}</span>
                </div>
                {info.contractNumber && (
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Contract #</span>
                    <span className="text-xs font-mono text-foreground truncate block">{info.contractNumber}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">County</span>
                  <span className="text-xs text-foreground truncate block">{info.county || "—"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <AlertTriangle className="h-3 w-3" /> Overdays Notice
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => {
                  setEditCustomerPM(info.customerPM || "");
                  setEditCustomerPMEmail(info.customerPMEmail || "");
                  setEditCustomerPMPhone(info.customerPMPhone || "");
                  setEditExtensionDate(info.extensionDate || "");
                  setEditJobOpen(true);
                }}
              >
                <Edit className="h-3 w-3" /> Edit Job
              </Button>
              <Sheet open={alertsPanelOpen} onOpenChange={setAlertsPanelOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-7 w-7 relative">
                    <Bell className="h-3 w-3" />
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-destructive text-destructive-foreground rounded-full text-[8px] font-bold flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[320px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Bell className="h-4 w-4" /> Alerts & Reminders
                    </SheetTitle>
                  </SheetHeader>
                  <AlertsPanel />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* ─── QUICK ACTIONS ─── */}
      <div className="w-full px-4 pt-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Quick Actions</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={() => router.push(`/l/${id}/takeoffs/create`)}
          >
            <ClipboardList className="h-3 w-3" /> Create Takeoff
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={async () => {
              try {
                // Fetch takeoffs for this job
                const response = await fetch(`/api/l/jobs/${id}/takeoffs`);
                if (response.ok) {
                  const takeoffs = await response.json();
                  if (takeoffs.length > 0) {
                    // Create work order from first takeoff
                    const woResponse = await fetch(`/api/workorders/from-takeoff/${takeoffs[0].id}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userEmail: user?.email || 'unknown@example.com' })
                    });
                    if (woResponse.ok) {
                      const result = await woResponse.json();
                      router.push(`/l/jobs/${id}/work-orders/${result.workOrder.id}`);
                    } else {
                      toast.error('Failed to create work order');
                    }
                  } else {
                    toast.error('No takeoffs found. Create a takeoff first.');
                    setActiveTab("takeoffs");
                  }
                }
              } catch (error) {
                toast.error('Error creating work order');
              }
            }}
          >
            <Wrench className="h-3 w-3" /> Create Work Order
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <Truck className="h-3 w-3" /> Schedule Rental
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <FileText className="h-3 w-3" /> Create Quote
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <ShoppingCart className="h-3 w-3" /> Create PO
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <Users className="h-3 w-3" /> Schedule Crew
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={() => setActiveTab("notes")}
          >
            <StickyNote className="h-3 w-3" /> Add Note
          </Button>
        </div>
      </div>

      {/* ─── MAP + SIDE CARDS ─── */}
      <div className="w-full px-4 pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 rounded-lg border bg-card overflow-hidden" style={{ height: 500 }}>
            <iframe
              title="Job Location"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                [info.county ? `${info.county} County` : "", "Pennsylvania"].filter(Boolean).join(", ")
              )}&t=&z=10&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
            />
          </div>
          <div className="space-y-3">
            {/* Project Timeline Card */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-blue-500/10">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project Timeline</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Start Date</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    {info.projectStartDate ? new Date(info.projectStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">End Date</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    {info.projectEndDate ? new Date(info.projectEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </span>
                </div>
                {info.extensionDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Extension Date</span>
                    <span className="text-xs font-semibold tabular-nums text-primary">
                      {new Date(info.extensionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Days Remaining</span>
                  <span className={`text-xs font-semibold tabular-nums ${remainingDays <= 7 && remainingDays >= 0 ? "text-destructive" : "text-foreground"}`}>
                    {endDate ? `${remainingDays} days` : "—"}
                  </span>
                </div>
                {totalDays > 0 && (
                  <div className="pt-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (elapsedDays / totalDays) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">{Math.min(100, Math.round((elapsedDays / totalDays) * 100))}% elapsed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sign Shop Orders Card */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-amber-500/10">
                  <Factory className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sign Shop Orders</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Pending / Submitted</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{signOrderCounts.submitted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">In Production</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{signOrderCounts.in_production}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Complete</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{signOrderCounts.complete}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Closed</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{signOrderCounts.closed}</span>
                </div>
              </div>
            </div>

            {/* Work Orders Card */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Wrench className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Work Orders</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">{workOrders.length}</Badge>
                </div>
              </div>
              {workOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No work orders yet.</p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {workOrders.slice(0, 3).map((wo) => (
                    <button
                      key={wo.id}
                      type="button"
                      className="group flex w-full items-center justify-between rounded border border-transparent bg-muted/30 p-2 text-left transition-colors hover:border-[#16335A]/20 hover:bg-[#16335A]/5"
                      onClick={() => router.push(`/l/jobs/${id}/work-orders/view/${wo.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-medium transition-colors group-hover:text-[#16335A]">
                          {formatWorkOrderNumber(wo.workOrderNumber ?? wo.wo_number)}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize">{wo.status?.toLowerCase().replace('_', ' ')}</div>
                      </div>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors group-hover:bg-[#16335A]/10">
                        <ChevronRight className="h-3 w-3 transition-colors group-hover:text-[#16335A]" />
                      </span>
                    </button>
                  ))}
                  {workOrders.length > 3 && (
                    <div className="text-center pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setActiveTab("takeoffs")}
                      >
                        View all {workOrders.length} work orders
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <QuoteNotes
              title="Project Notes"
              notes={projectNotes}
              loading={projectNotesLoading}
              onSave={handleAddProjectNote}
              onEdit={handleEditProjectNote}
              onDelete={handleDeleteProjectNote}
              emptyState={notesEmptyState}
              addButtonClassName={notesButtonClassName}
              submitButtonClassName={notesButtonClassName}
              containerClassName="bg-card"
              addButtonInHeader
              headerContent={
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-violet-500/10 p-1.5">
                      <StickyNote className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Project Notes
                    </span>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* ─── SECTION B: TABBED CONTENT ─── */}
      <div className="w-full px-6 py-6 flex-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Job360Tab)}>
          <div className="border-b bg-card rounded-t-lg overflow-x-auto">
            <TabsList className="bg-transparent h-9 gap-0 min-w-max">
              <TabBtn value="bid-items" icon={Layers} label="Bid Items / SOV" />
              <TabBtn value="takeoffs" icon={ClipboardList} label="Takeoffs" count={takeoffsCount} />
              <TabBtn value="equipment" icon={Package} label="Equipment" />
              <TabBtn value="customer-admin" icon={Users} label="Customer Admin" />
              <TabBtn value="labor" icon={Timer} label="Labor & Time" />
              <TabBtn value="manufacturing" icon={Factory} label="Manufacturing" />
              <TabBtn value="dispatch" icon={Truck} label="Dispatch & Schedule" />
              <TabBtn value="notes" icon={StickyNote} label="Notes & Photos" />
              <TabBtn value="documents" icon={FileText} label="Documents" />
              <TabBtn value="purchase-orders" icon={ShoppingCart} label="Purchase Orders" />
            </TabsList>
          </div>

          <div className="bg-card rounded-b-lg border border-t-0 min-h-[400px]">
            <TabsContent value="bid-items" className="m-0 p-4">
              {(() => {
                console.log('[ProjectDetail] Rendering SOV table with jobId:', id);
                console.log('[ProjectDetail] Job data:', dbJob);
                return <SOVTable jobId={id || ""} readOnly={true} />;
              })()}
            </TabsContent>

            <TabsContent value="takeoffs" className="m-0 p-4">
              <TakeoffsList jobId={id || ""} userEmail={user?.email} />
            </TabsContent>

            <TabsContent value="equipment" className="m-0 p-4">
              <EquipmentSummary jobId={id || ""} />
            </TabsContent>

            <TabsContent value="customer-admin" className="m-0 p-4">
              <TabPlaceholder
                icon={Users}
                title="Customer Admin"
                description="Customer contact information and administrative details."
                columns={["Contact", "Role", "Email", "Phone"]}
              />
            </TabsContent>

            <TabsContent value="labor" className="m-0 p-4">
              <TabPlaceholder
                icon={Timer}
                title="Labor & Time"
                description="Log employee hours, approve or reject time entries, and track total labor costs per job."
                columns={["Employee", "Date", "Task", "Hours", "Status", "Notes"]}
              />
            </TabsContent>

            <TabsContent value="manufacturing" className="m-0 p-4">
              <ManufacturingStatusPanel jobId={id || ""} signOrderCounts={signOrderCounts} />
            </TabsContent>

            <TabsContent value="dispatch" className="m-0 p-4">
              <TabPlaceholder
                icon={Truck}
                title="Dispatch & Schedule"
                description="Field crew scheduling and dispatch management."
                columns={["Date", "Crew", "Task", "Status", "Notes"]}
              />
            </TabsContent>

            <TabsContent value="notes" className="m-0 p-4">
              <QuoteNotes
                title="Notes & Photos"
                notes={projectNotes}
                loading={projectNotesLoading}
                onSave={handleAddProjectNote}
                onEdit={handleEditProjectNote}
                onDelete={handleDeleteProjectNote}
                emptyState={notesEmptyState}
                addButtonClassName={notesButtonClassName}
                submitButtonClassName={notesButtonClassName}
              />
            </TabsContent>

            <TabsContent value="documents" className="m-0 p-4">
              {documentsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <DocumentsFormsStep
                  documents={documents}
                  projectInfo={dbJob.projectInfo}
                  jobId={id || ""}
                  onAddDocuments={handleAddDocuments}
                  onRemoveDocument={handleRemoveDocument}
                  onUpdateCategory={handleUpdateDocumentCategory}
                />
              )}
            </TabsContent>

            <TabsContent value="purchase-orders" className="m-0 p-4">
              <TabPlaceholder
                icon={ShoppingCart}
                title="Purchase Orders"
                description="Track vendor purchase orders, amounts, delivery status, and expected delivery dates."
                columns={["Vendor", "PO Number", "Amount", "Status", "Expected Delivery"]}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Manufacturing Status Panel (read-only for PMs) ─── */
const ManufacturingStatusPanel = ({
  jobId,
  signOrderCounts,
}: {
  jobId: string;
  signOrderCounts: { submitted: number; in_production: number; complete: number; closed: number };
}) => {
  const [orders, setOrders] = useState<{ id: string; order_number: string; status: string; item_count: number; submitted_date: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/l/sign-orders/job/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          console.error('Failed to fetch sign orders');
        }
      } catch (error) {
        console.error('Error fetching sign orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [jobId]);

  const totalOrders = signOrderCounts.submitted + signOrderCounts.in_production + signOrderCounts.complete + signOrderCounts.closed;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">Manufacturing Status</h3>
        </div>
        <Badge variant="outline" className="text-xs">{totalOrders} order(s)</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Manufacturing is initiated from the Build Shop. This panel shows the current status of all sign orders for this contract.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{signOrderCounts.submitted}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pending / Draft</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-amber-600">{signOrderCounts.in_production}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">In Production</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-emerald-600">{signOrderCounts.complete}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Complete</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-muted-foreground">{signOrderCounts.closed}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Closed</p>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <Factory className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No manufacturing orders yet</p>
          <p className="text-xs text-muted-foreground mt-1">Orders will appear here once the Build Shop initiates manufacturing.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Order #</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono font-bold">{o.order_number}</td>
                  <td className="px-4 py-2.5 text-center font-mono">{o.item_count}</td>
                  <td className="px-4 py-2.5">
                    {o.submitted_date
                      ? new Date(o.submitted_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className="text-[10px]">{o.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─── Tab Button ─── */
const TabBtn = ({
  value,
  icon: Icon,
  label,
  count,
}: {
  value: string;
  icon: React.ElementType;
  label: string;
  count?: number;
}) => (
  <TabsTrigger
    value={value}
    className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
    {count !== undefined && count > 0 && (
      <Badge variant="secondary" className="text-[9px] ml-1 h-4 px-1">
        {count}
      </Badge>
    )}
  </TabsTrigger>
);

interface TakeoffSummary {
  id: string;
  title: string;
  work_type: string;
  status: string;
  is_pickup?: boolean | null;
  created_at: string;
  install_date: string | null;
  pickup_date: string | null;
  needed_by_date: string | null;
  work_order_number: string | null;
  items_count?: number;
}

const TakeoffsList = ({ jobId, userEmail }: { jobId: string; userEmail?: string }) => {
  const router = useRouter();
  const [takeoffs, setTakeoffs] = useState<TakeoffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [takeoffToDelete, setTakeoffToDelete] = useState<TakeoffSummary | null>(null);

  useEffect(() => {
    const fetchTakeoffs = async () => {
      try {
        const response = await fetch(`/api/l/jobs/${jobId}/takeoffs`);
        if (response.ok) {
          const data = await response.json();
          setTakeoffs(data);
        }
      } catch (error) {
        console.error('Error fetching takeoffs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchTakeoffs();
    }
  }, [jobId]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin mr-2" />Loading takeoffs...</div>;
  }

  if (takeoffs.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground mb-2">No takeoffs yet</p>
        <p className="text-sm text-muted-foreground mb-6">Create your first takeoff to get started.</p>
        <Button onClick={() => router.push(`/l/${jobId}/takeoffs/create`)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Takeoff
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Takeoffs ({takeoffs.length})
        </h3>
        <Button variant="outline" size="sm" onClick={() => router.push(`/l/${jobId}/takeoffs/create`)}>
          <Plus className="h-3 w-3 mr-1.5" />
          New Takeoff
        </Button>
      </div>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Title
                </th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Work Order
                </th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Work Type
                </th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Need By
                </th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-3 py-2 text-center text-[9px] font-bold uppercase tracking-wider text-muted-foreground w-[50px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {takeoffs.map((takeoff) => (
                <tr
                  key={takeoff.id}
                  className="cursor-pointer hover:bg-muted/20"
                  onClick={() => router.push(`/l/${jobId}/takeoffs/view/${takeoff.id}`)}
                >
                  <td className="px-3 py-1.5 font-medium">{takeoff.title}</td>
                  <td className="px-3 py-1.5 font-mono">
                    {takeoff.work_order_number ? (
                      formatWorkOrderNumber(takeoff.work_order_number)
                    ) : (
                      <span className="italic text-muted-foreground">unassigned</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${TAKEOFF_WORK_TYPE_COLORS[takeoff.work_type] || "bg-muted text-muted-foreground"}`}>
                        {formatWorkType(takeoff.work_type)}
                      </span>
                      {takeoff.is_pickup && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700">
                          Pickup
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    {takeoff.needed_by_date
                      ? new Date(takeoff.needed_by_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${TAKEOFF_STATUS_COLORS[takeoff.status] || "bg-muted text-muted-foreground"}`}>
                      {formatTakeoffStatus(takeoff.status)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    {new Date(takeoff.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setTakeoffToDelete(takeoff);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Takeoff</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the takeoff {takeoffToDelete?.title}? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!takeoffToDelete) return;

                try {
                  const response = await fetch(`/api/takeoffs/${takeoffToDelete.id}`, {
                    method: 'DELETE',
                  });

                  if (response.ok) {
                    toast.success('Takeoff deleted successfully');
                    setTakeoffs(takeoffs.filter(t => t.id !== takeoffToDelete.id));
                  } else {
                    toast.error('Failed to delete takeoff');
                  }
                } catch (error) {
                  toast.error('Error deleting takeoff');
                } finally {
                  setDeleteDialogOpen(false);
                  setTakeoffToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Tab Placeholder ─── */
const TabPlaceholder = ({
  icon: Icon,
  title,
  description,
  columns,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  columns: string[];
}) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-bold text-foreground">{title}</h3>
      </div>
      <Button size="sm" className="gap-1.5 text-xs">
        <Plus className="h-3 w-3" /> Add
      </Button>
    </div>
    <p className="text-sm text-muted-foreground mb-6">{description}</p>
    {/* Empty table header */}
    <div className="rounded-md border overflow-hidden">
      <div className="bg-muted/30 px-4 py-2.5 flex items-center gap-4">
        {columns.map((col) => (
          <span
            key={col}
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex-1"
          >
            {col}
          </span>
        ))}
      </div>
      <div className="p-12 text-center">
        <Icon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">No data yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click Add to create your first entry.
        </p>
      </div>
    </div>
  </div>
);



/* ─── Alerts Panel ─── */
const AlertsPanel = () => (
  <div className="mt-6 space-y-4">
    <AlertItem
      type="warning"
      title="Rental Overdays"
      description="No rental items currently overdue"
    />
    <AlertItem
      type="info"
      title="Pending Time Approvals"
      description="No time entries awaiting approval"
    />
    <AlertItem
      type="info"
      title="Manufacturing Delays"
      description="No manufacturing delays reported"
    />
    <AlertItem
      type="info"
      title="Customer Billing"
      description="No pending billing reminders"
    />
  </div>
);

const AlertItem = ({
  type,
  title,
  description,
}: {
  type: "warning" | "info" | "error";
  title: string;
  description: string;
}) => {
  const styles = {
    warning: "border-warning/30 bg-warning/5",
    info: "border-border bg-muted/20",
    error: "border-destructive/30 bg-destructive/5",
  }[type];
  const iconColor = {
    warning: "text-warning",
    info: "text-muted-foreground",
    error: "text-destructive",
  }[type];

  return (
    <div className={`rounded-lg border p-3 ${styles}`}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor}`} />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
