import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
          notes,
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">New Material Takeoff</h1>
        <Button variant="outline" onClick={onBack}>Back</Button>
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
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Takeoff Title *</Label>
            <Input
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phase 1 MPT Setup"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Work Type *</Label>
            <Select value={workType} onValueChange={setWorkType}>
              <SelectTrigger className="mt-1">
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
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</Label>
            <Textarea
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Work Type Specific Content */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {workType ? WORK_TYPES.find(wt => wt.value === workType)?.label : "Select Work Type Above"}
          </h2>
        </div>
        <div className="p-5">
          {workType === "MPT" && (
            <p className="text-sm text-muted-foreground">MPT configuration will be added here. Signs will be selected from the signs_all database.</p>
          )}
          {workType === "PERMANENT_SIGNS" && (
            <p className="text-sm text-muted-foreground">Permanent signs configuration will be added here. Signs will be selected from the signs_all database.</p>
          )}
          {workType === "FLAGGING" && (
            <p className="text-sm text-muted-foreground">Flagging configuration will be added here with vehicles and rolling stock.</p>
          )}
          {workType === "LANE_CLOSURE" && (
            <p className="text-sm text-muted-foreground">Lane closure configuration will be added here with vehicles and rolling stock.</p>
          )}
          {(workType === "SERVICE" || workType === "DELIVERY" || workType === "RENTAL") && (
            <p className="text-sm text-muted-foreground">Additional items configuration will be added here.</p>
          )}
          {!workType && (
            <p className="text-sm text-muted-foreground">Select a work type above to see configuration options.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Takeoff"}
        </Button>
      </div>
    </div>
  );
};
