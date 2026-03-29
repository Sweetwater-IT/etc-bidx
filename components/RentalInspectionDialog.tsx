import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";

interface Equipment {
  id: string;
  equipment_number: string;
  make: string;
  model: string;
  year?: number;
  equipment_type: string;
  is_driveable?: boolean;
  branch_location?: string;
  rental_rate?: number;
}

interface Reservation {
  id: string;
  equipment_id: string;
  customer_name: string;
  start_date: string;
  end_date: string | null;
  job_id: string;
  status: string;
  customer_poc_name?: string;
  customer_poc_phone?: string;
  customer_poc_email?: string;
  mileage_out?: number;
}

interface RentalInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "pickup" | "return";
  equipment: Equipment;
  reservation: Reservation;
  onComplete: () => void;
}

export const RentalInspectionDialog = ({
  open,
  onOpenChange,
  mode,
  equipment,
  reservation,
  onComplete,
}: RentalInspectionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [mileage, setMileage] = useState(reservation.mileage_out?.toString() || "");
  const [notes, setNotes] = useState("");
  const [isDriveable, setIsDriveable] = useState(equipment.is_driveable ?? true);
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");

  const handleSubmit = async () => {
    if (mode === "pickup" && !mileage.trim()) {
      toast.error("Mileage out is required");
      return;
    }

    if (hasDamage && !damageDescription.trim()) {
      toast.error("Damage description is required when damage is reported");
      return;
    }

    setLoading(true);
    try {
      const inspectionData = {
        reservation_id: reservation.id,
        equipment_id: equipment.id,
        mode,
        mileage_out: mode === "pickup" ? parseInt(mileage) : undefined,
        mileage_in: mode === "return" ? parseInt(mileage) : undefined,
        is_driveable: isDriveable,
        has_damage: hasDamage,
        damage_description: hasDamage ? damageDescription : undefined,
        notes: notes.trim() || undefined,
        inspected_by: "current_user", // This would come from auth context
        inspected_at: new Date().toISOString(),
      };

      const response = await fetch("/api/l/rental-inspections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inspectionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit inspection");
      }

      toast.success(`${mode === "pickup" ? "Pickup" : "Return"} inspection completed`);
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Inspection submission error:", error);
      toast.error(error.message || "Failed to submit inspection");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "pickup" ? "Equipment Pickup Inspection" : "Equipment Return Inspection";
  const description = mode === "pickup"
    ? "Complete the pickup inspection for this rental equipment."
    : "Complete the return inspection for this rental equipment.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogHeader>
            <div className="text-sm text-muted-foreground space-y-1">
              <div><strong>Equipment:</strong> {equipment.equipment_number}</div>
              <div><strong>Make/Model:</strong> {equipment.make} {equipment.model}</div>
              <div><strong>Customer:</strong> {reservation.customer_name}</div>
            </div>
          </DialogHeader>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="mileage">
              {mode === "pickup" ? "Mileage Out" : "Mileage In"} *
            </Label>
            <Input
              id="mileage"
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="Enter mileage"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="driveable"
              checked={isDriveable}
              onCheckedChange={(checked) => setIsDriveable(!!checked)}
            />
            <Label htmlFor="driveable" className="text-sm">
              Equipment is driveable
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="damage"
              checked={hasDamage}
              onCheckedChange={(checked) => setHasDamage(!!checked)}
            />
            <Label htmlFor="damage" className="text-sm">
              Report damage
            </Label>
          </div>

          {hasDamage && (
            <div>
              <Label htmlFor="damage-description">Damage Description *</Label>
              <Textarea
                id="damage-description"
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                placeholder="Describe the damage..."
                rows={3}
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Complete Inspection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};