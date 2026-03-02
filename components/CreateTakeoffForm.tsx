import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ClipboardList, Save, Download, Send, ArrowLeft } from "lucide-react";
import { MPTSignConfiguration, type MPTSignRow } from "@/components/MPTSignConfiguration";
import { SignMaterial, DEFAULT_SIGN_MATERIAL } from "@/utils/signMaterial";

interface Props {
  jobId: string;
  onBack: () => void;
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

export const CreateTakeoffForm = ({ jobId, onBack }: Props) => {
  const router = useRouter();
  const { data: dbJob, isLoading } = useJobFromDB(jobId);
  const info = dbJob?.projectInfo;

  const [title, setTitle] = useState("");
  const [workType, setWorkType] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [contractedOrAdditional, setContractedOrAdditional] = useState("contracted");
  const [installDate, setInstallDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [neededByDate, setNeededByDate] = useState("");
  const [priority, setPriority] = useState("standard");
  const [notes, setNotes] = useState("");
  const [crewNotes, setCrewNotes] = useState("");
  const [buildShopNotes, setBuildShopNotes] = useState("");
  const [pmNotes, setPmNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // MPT Configuration State
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [signRows, setSignRows] = useState<Record<string, MPTSignRow[]>>({});
  const [defaultSignMaterial, setDefaultSignMaterial] = useState<SignMaterial>(DEFAULT_SIGN_MATERIAL);

  // MPT Configuration Handlers
  const handleToggleSection = (key: string) => {
    if (activeSections.includes(key)) {
      setActiveSections((prev) => prev.filter((s) => s !== key));
    } else {
      setActiveSections((prev) => [...prev, key]);
      if (!signRows[key]) {
        setSignRows((prev) => ({ ...prev, [key]: [] }));
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
      const response = await fetch('/api/takeoffs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          title,
          workType,
          workOrderNumber,
          contractedOrAdditional,
          installDate,
          pickupDate,
          neededByDate,
          priority,
          notes,
          crewNotes,
          buildShopNotes,
          pmNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create takeoff');
      }

      toast.success(`Takeoff "${title}" created successfully`);
      router.push(`/l/${jobId}`);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              New Material Takeoff
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
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Save Draft
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
          <Button size="sm" variant="secondary" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Send to Build Shop
          </Button>
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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Phase 1 MPT Setup"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Type *</Label>
              <Select value={workType} onValueChange={setWorkType}>
                <SelectTrigger className="text-sm mt-0">
                  <SelectValue placeholder="Choose Work Type" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((wt) => (
                    <SelectItem key={wt.value} value={wt.value}>{wt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Work Order #</Label>
              <Input
                className="text-sm"
                value={workOrderNumber || "Save takeoff first"}
                disabled
                placeholder="Save takeoff first"
              />
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
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Install Date</Label>
              <Input
                type="date"
                className="text-sm"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Pick Up Date</Label>
              <Input
                type="date"
                className="text-sm"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>
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
          </div>
        </div>
      </div>

      {/* Work Type Specific Content */}
      {workType && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {WORK_TYPES.find(wt => wt.value === workType)?.label} Configuration
            </h2>
          </div>
          <div className="p-5">
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
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Select signs from the MUTCD database or choose from pre-configured kits.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Individual Signs</h3>
                    <p className="text-xs text-muted-foreground">Choose specific signs with custom dimensions and quantities.</p>
                    <div className="border border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Sign selection will be integrated here</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Sign Kits</h3>
                    <p className="text-xs text-muted-foreground">Select pre-configured kits with multiple signs.</p>
                    <div className="border border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Kit selection will be integrated here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(workType === "FLAGGING" || workType === "LANE_CLOSURE") && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Configure vehicles and rolling stock for {workType === "FLAGGING" ? "flagging operations" : "lane closure operations"}.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Vehicles</h3>
                    <p className="text-xs text-muted-foreground">Select trucks and vehicles for the operation.</p>
                    <div className="border border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Vehicle selection will be added here</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Rolling Stock</h3>
                    <p className="text-xs text-muted-foreground">Choose cones, barrels, signs, and other equipment.</p>
                    <div className="border border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Equipment selection will be added here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(workType === "SERVICE" || workType === "DELIVERY" || workType === "RENTAL") && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Configure additional items for {workType.toLowerCase()} work.</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Additional Items</h3>
                  <p className="text-xs text-muted-foreground">Select equipment, materials, or services needed for this work type.</p>
                  <div className="border border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Item selection will be added here</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Items */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Additional Items</h2>
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
            <ClipboardList className="h-3 w-3" /> Add Item
          </Button>
        </div>
        <div className="p-5">
          <div className="text-center text-xs text-muted-foreground">No additional items.</div>
        </div>
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


    </div>
  );
};
