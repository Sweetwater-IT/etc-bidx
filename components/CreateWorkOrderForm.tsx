import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  ChevronRight,
  ClipboardList,
  Loader2,
  ArrowLeft,
  Save,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface TakeoffData {
  id: string;
  title: string;
  work_type: string;
  job_id: string;
  status: string;
  install_date: string | null;
  pickup_date: string | null;
}

interface JobData {
  id: string;
  project_name: string;
  etc_job_number: string | null;
  etc_branch: string | null;
  customer_name: string | null;
  customer_pm: string | null;
  customer_pm_phone: string | null;
  customer_job_number: string | null;
  county: string | null;
  contract_number: string | null;
  project_owner: string | null;
  etc_project_manager: string | null;
}

const WORK_TYPE_COLORS: Record<string, string> = {
  MPT: "bg-blue-500/15 text-blue-700",
  PERMANENT_SIGNS: "bg-purple-500/15 text-purple-700",
  FLAGGING: "bg-amber-500/15 text-amber-700",
  LANE_CLOSURE: "bg-amber-500/15 text-amber-700",
  DELIVERY: "bg-emerald-500/15 text-emerald-700",
  SERVICE: "bg-indigo-500/15 text-indigo-700",
  RENTAL: "bg-red-500/15 text-red-700",
};

const AdminField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
    <p className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
  </div>
);

interface Props {
  jobId: string;
  takeoffId: string;
  onBack: () => void;
}

export const CreateWorkOrderForm = ({ jobId, takeoffId, onBack }: Props) => {
  const router = useRouter();

  const [takeoff, setTakeoff] = useState<TakeoffData | null>(null);
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [woNumber, setWoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [contractedOrAdditional, setContractedOrAdditional] = useState("contracted");
  const [customerPocPhone, setCustomerPocPhone] = useState("");

  useEffect(() => {
    if (!takeoffId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/takeoffs/${takeoffId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch takeoff data');
        }

        const data = await response.json();
        const { takeoff: t, job: j } = data;

        if (!t) {
          toast.error("Takeoff not found");
          setLoading(false);
          return;
        }

        setTakeoff(t as TakeoffData);
        setTitle(`WO — ${t.title || "Untitled"}`);

        if (j) setJob(j as JobData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load takeoff data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [takeoffId]);

  const handleCreate = async () => {
    if (!takeoffId) {
      toast.error("No takeoff specified");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          takeoff_id: takeoffId,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          wo_number: woNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          contracted_or_additional: contractedOrAdditional,
          customer_poc_phone: customerPocPhone.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create work order');
      }

      const data = await response.json();

      toast.success("Work order created successfully");
      router.push(`/work-order/${data.id}`);
    } catch (error) {
      console.error("Error creating work order:", error);
      toast.error("Failed to create work order");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!takeoffId || !takeoff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">A valid takeoff is required to create a work order.</p>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isRental = takeoff.work_type.toLowerCase() === "rental";

  return (
    <div className="space-y-6">
      {/* Page Header - Salesforce Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Create Work Order</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              From takeoff: {takeoff.title}
              <Badge className={`ml-2 text-[10px] ${WORK_TYPE_COLORS[takeoff.work_type] || "bg-muted"}`}>
                {takeoff.work_type}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {creating ? "Creating…" : "Create Work Order"}
          </Button>
        </div>
      </div>

      {/* Rental message */}
      {isRental && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Rental work orders coming next — this feature is not yet available.
          </p>
        </div>
      )}

      {/* Project Information */}
      {job && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Information</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-xs">
              <AdminField label="Branch" value={job.etc_branch || "—"} />
              <AdminField label="ETC Project Manager" value={job.etc_project_manager || "—"} />
              <AdminField label="ETC Job #" value={job.etc_job_number || "—"} mono />
              <AdminField label="County" value={job.county || "—"} />
              <AdminField label="Customer" value={job.customer_name || "—"} />
              <AdminField label="Customer PM / POC" value={job.customer_pm || "—"} />
              <AdminField label="Customer Job #" value={job.customer_job_number || "—"} />
              <AdminField label="Owner" value={job.project_owner || "—"} />
              <AdminField label="Owner Contract #" value={job.contract_number || "—"} />
            </div>
          </div>
        </div>
      )}

      {/* Work Order Details */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Work Order Details</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Title</label>
              <Input className="h-9 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Work Order Title" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">WO Number</label>
              <Input className="h-9 text-sm" value={woNumber} onChange={(e) => setWoNumber(e.target.value)} placeholder="e.g. WO-001" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Contracted / Additional</label>
              <Select value={contractedOrAdditional} onValueChange={setContractedOrAdditional}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contracted">Contracted Work</SelectItem>
                  <SelectItem value="additional">Additional Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-xs mt-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer POC Phone</label>
              <Input className="h-9 text-sm" value={customerPocPhone} onChange={(e) => setCustomerPocPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Description</label>
              <Textarea className="text-sm" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Work order description..." rows={2} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
              <Textarea className="text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." rows={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Takeoff Summary */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Linked Takeoff</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-xs">
            <AdminField label="Takeoff Title" value={takeoff.title || "—"} />
            <AdminField label="Work Type" value={takeoff.work_type || "—"} />
            <AdminField label="Status" value={takeoff.status || "—"} />
            <AdminField label="Install Date" value={takeoff.install_date || "—"} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Items will be auto-populated based on takeoff work type and selected materials.
          </p>
        </div>
      </div>
    </div>
  );
};