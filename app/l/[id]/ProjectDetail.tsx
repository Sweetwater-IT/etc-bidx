"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import type { ScheduleOfValuesItem } from "@/types/job";
import type { ContractDocumentMeta } from "@/types/document";
import { FORWARDED_CATEGORIES } from "@/types/document";
import { BRANCHES } from "@/data/branches";
import { useParams, useNavigate } from "react-router-dom";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MaterialTakeoff } from "@/components/MaterialTakeoff";
import { DispatchSchedule } from "@/components/DispatchSchedule";
import { CustomerAdminInfo } from "@/components/CustomerAdminInfo";
import { toast } from "sonner";

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
  X,
  Save,
  Loader2,
  Maximize2,
} from "lucide-react";

type Job360Tab =
  | "bid-items"
  | "takeoffs"
  | "customer-admin"
  | "labor"
  | "manufacturing"
  | "dispatch"
  | "notes"
  | "documents"
  | "purchase-orders";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: dbJob, isLoading: jobLoading } = useJobFromDB(id);
  const [activeTab, setActiveTab] = useState<Job360Tab>("bid-items");
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  const [signOrderCounts, setSignOrderCounts] = useState({ submitted: 0, in_production: 0, complete: 0, closed: 0 });
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [woDialogOpen, setWoDialogOpen] = useState(false);
  const [editJobOpen, setEditJobOpen] = useState(false);
  const [editCustomerPM, setEditCustomerPM] = useState("");
  const [editCustomerPMEmail, setEditCustomerPMEmail] = useState("");
  const [editCustomerPMPhone, setEditCustomerPMPhone] = useState("");
  const [editExtensionDate, setEditExtensionDate] = useState("");
  const [editJobSaving, setEditJobSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("sign_orders")
        .select("status")
        .eq("job_id", id);
      if (data) {
        const counts = { submitted: 0, in_production: 0, complete: 0, closed: 0 };
        data.forEach((o: any) => {
          if (o.status === "submitted" || o.status === "draft") counts.submitted++;
          else if (o.status === "in_production" || o.status === "partial_complete") counts.in_production++;
          else if (o.status === "complete") counts.complete++;
          else if (o.status === "closed") counts.closed++;
        });
        setSignOrderCounts(counts);
      }
    };
    fetchCounts();

    const channel = supabase
      .channel(`sign-orders-job-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sign_orders", filter: `job_id=eq.${id}` }, () => fetchCounts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

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
          <Button variant="outline" onClick={() => navigate("/")}>
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

  return (
    <div className="min-h-screen bg-[hsl(var(--muted)/0.3)] flex flex-col">
      {/* ─── TOP HEADER BAR ─── */}
      <header className="border-b bg-card shrink-0">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="shrink-0 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-8 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Job Name</span>
                  <span className="text-sm font-bold text-foreground">{info.projectName || "Untitled"}</span>
                </div>
                {info.etcJobNumber && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">ETC Job #</span>
                    <span className="text-sm font-mono font-bold text-primary">{info.etcJobNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Customer</span>
                  <span className="text-sm text-foreground">{info.customerName || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Customer Job #</span>
                  <span className="text-sm font-mono text-foreground">{info.customerJobNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Customer PM</span>
                  <span className="text-sm text-foreground">{info.customerPM || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Project Owner</span>
                  <span className="text-sm text-foreground">{info.projectOwner || "—"}</span>
                </div>
                {info.contractNumber && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Contract #</span>
                    <span className="text-sm font-mono text-foreground">{info.contractNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">County</span>
                  <span className="text-sm text-foreground">{info.county || "—"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <AlertTriangle className="h-3 w-3" /> Overdays Notice
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
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
                  <Button variant="outline" size="icon" className="h-8 w-8 relative">
                    <Bell className="h-3.5 w-3.5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[380px]">
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
      <div className="max-w-[1800px] mx-auto w-full px-6 pt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Quick Actions</span>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <ClipboardList className="h-3 w-3" /> Create Takeoff
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
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
            onClick={() => {
              setNotesValue(info.otherNotes || "");
              setEditingNotes(true);
            }}
          >
            <StickyNote className="h-3 w-3" /> Add Note
          </Button>
        </div>
      </div>

      {/* ─── MAP + SIDE CARDS ─── */}
      <div className="max-w-[1800px] mx-auto w-full px-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border bg-card overflow-hidden" style={{ height: 500 }}>
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
                    <Progress value={Math.min(100, (elapsedDays / totalDays) * 100)} className="h-1.5" />
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
                  <Badge variant="secondary" className="text-[10px]">0</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">No work orders yet.</p>
            </div>

            <div className={`rounded-lg border bg-card p-4 flex flex-col ${editingNotes ? "" : "max-h-[200px]"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-violet-500/10">
                    <StickyNote className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project Notes</span>
                </div>
                {editingNotes && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setEditingNotes(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-6 w-6"
                      onClick={async () => {
                        if (id) {
                          const { error } = await supabase
                            .from("jobs_l")
                            .update({ additional_notes: notesValue })
                            .eq("id", id);
                          if (error) {
                            toast.error("Failed to save notes");
                          } else {
                            toast.success("Notes saved");
                          }
                        }
                        setEditingNotes(false);
                      }}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {editingNotes ? (
                <Textarea
                  className="flex-1 text-sm min-h-[120px] resize-none"
                  placeholder="Add project notes, scope details, special instructions..."
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  autoFocus
                />
              ) : (
                <div className="flex-1 overflow-y-auto text-sm text-foreground whitespace-pre-wrap">
                  {info.otherNotes ? info.otherNotes : <span className="text-muted-foreground italic text-xs">No notes yet. Use "Add Note" to get started.</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION B: TABBED CONTENT ─── */}
      <div className="max-w-[1800px] mx-auto w-full px-6 py-6 flex-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Job360Tab)}>
          <div className="border-b bg-card rounded-t-lg px-1">
            <TabsList className="bg-transparent h-11 gap-0">
              <TabBtn value="bid-items" icon={Layers} label="Bid Items / SOV" />
              <TabBtn value="takeoffs" icon={ClipboardList} label="Takeoffs" />
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
            <TabsContent value="bid-items" className="m-0 p-6">
              <BidItemsSOV items={[]} />
            </TabsContent>

            <TabsContent value="takeoffs" className="m-0 p-6">
              <TabPlaceholder
                icon={ClipboardList}
                title="Takeoffs"
                description="Material takeoffs and quantity calculations for this project."
                columns={["Material", "Quantity", "Unit", "Unit Price", "Total"]}
              />
            </TabsContent>

            <TabsContent value="customer-admin" className="m-0 p-6">
              <TabPlaceholder
                icon={Users}
                title="Customer Admin"
                description="Customer contact information and administrative details."
                columns={["Contact", "Role", "Email", "Phone"]}
              />
            </TabsContent>

            <TabsContent value="labor" className="m-0 p-6">
              <TabPlaceholder
                icon={Timer}
                title="Labor & Time"
                description="Log employee hours, approve or reject time entries, and track total labor costs per job."
                columns={["Employee", "Date", "Task", "Hours", "Status", "Notes"]}
              />
            </TabsContent>

            <TabsContent value="manufacturing" className="m-0 p-6">
              <ManufacturingStatusPanel jobId={id || ""} signOrderCounts={signOrderCounts} />
            </TabsContent>

            <TabsContent value="dispatch" className="m-0 p-6">
              <TabPlaceholder
                icon={Truck}
                title="Dispatch & Schedule"
                description="Field crew scheduling and dispatch management."
                columns={["Date", "Crew", "Task", "Status", "Notes"]}
              />
            </TabsContent>

            <TabsContent value="notes" className="m-0 p-6">
              <TabPlaceholder
                icon={StickyNote}
                title="Notes & Photos"
                description="Chronological feed of field notes, photos, and attachments from technicians and project managers."
                columns={["Date", "Author", "Type", "Content"]}
              />
            </TabsContent>

            <TabsContent value="documents" className="m-0 p-6">
              <TabPlaceholder
                icon={FileText}
                title="Documents"
                description="Project documents, contracts, and supporting files."
                columns={["Document", "Type", "Uploaded", "Size"]}
              />
            </TabsContent>

            <TabsContent value="purchase-orders" className="m-0 p-6">
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
      const { data } = await supabase
        .from("sign_orders")
        .select("id, order_number, status, submitted_date")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (data) {
        const ids = data.map((o: any) => o.id);
        const countMap = new Map<string, number>();
        if (ids.length > 0) {
          const { data: items } = await supabase
            .from("sign_order_items")
            .select("sign_order_id")
            .in("sign_order_id", ids);
          (items || []).forEach((i: any) => {
            countMap.set(i.sign_order_id, (countMap.get(i.sign_order_id) || 0) + 1);
          });
        }
        setOrders(data.map((o: any) => ({ ...o, item_count: countMap.get(o.id) || 0 })));
      }
      setLoading(false);
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
}: {
  value: string;
  icon: React.ElementType;
  label: string;
}) => (
  <TabsTrigger
    value={value}
    className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
  </TabsTrigger>
);

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
          Click "Add" to create your first entry.
        </p>
      </div>
    </div>
  </div>
);

/* ─── Bid Items / SOV (read-only) ─── */
const BidItemsSOV = ({ items }: { items: ScheduleOfValuesItem[] }) => {
  const totalExtended = items.reduce((sum, i) => sum + i.extendedPrice, 0);
  const totalRetainage = items.reduce((sum, i) => sum + i.retainageAmount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">Bid Items / Schedule of Values</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border overflow-hidden">
          <div className="p-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No bid items configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bid items are set up during the contract stage.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Item #</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">UOM</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qty</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Extended</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Retainage</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scope Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{item.itemNumber || "—"}</td>
                    <td className="px-4 py-2 text-xs">{item.description || "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{item.uom || "—"}</td>
                    <td className="px-4 py-2 text-xs text-right tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-2 text-xs text-right tabular-nums">${item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-xs text-right tabular-nums font-medium">${item.extendedPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-xs text-right tabular-nums text-primary">${item.retainageAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px]">
                      {item.notes ? (
                        <span className="whitespace-pre-wrap">{item.notes}</span>
                      ) : (
                        <span className="italic text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-muted/30 font-semibold">
                  <td colSpan={5} className="px-4 py-2 text-xs text-right">Total</td>
                  <td className="px-4 py-2 text-xs text-right tabular-nums">${totalExtended.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-xs text-right tabular-nums text-primary">${totalRetainage.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

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