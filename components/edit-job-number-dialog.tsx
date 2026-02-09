import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EditJobNumberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentSequential: string;
  year: string;
  onSave: (newSequential: string) => Promise<boolean>;
}

export function EditJobNumberDialog({
  isOpen,
  onClose,
  currentSequential,
  year,
  onSave,
}: EditJobNumberDialogProps) {
  const [newSequential, setNewSequential] = useState(currentSequential);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    // Validate input
    if (!newSequential) {
      setError("Please enter a sequential number");
      return;
    }

    const sequentialNumber = parseInt(newSequential, 10);
    if (isNaN(sequentialNumber) || sequentialNumber < 1 || sequentialNumber > 999) {
      setError("Please enter a valid number between 1 and 999");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await onSave(newSequential.padStart(3, "0"));
      if (success) {
        toast.success("Job number updated successfully");
        onClose();
      }
    } catch (error) {
      console.error("Error updating job number:", error);
      setError("Failed to update job number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Next Job Number</DialogTitle>
          <DialogDescription>
            Change the sequential number for the next job. The current format is {year}XXX.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jobNumber" className="text-right">
              {year}
            </Label>
            <Input
              id="jobNumber"
              value={newSequential}
              onChange={(e) => setNewSequential(e.target.value)}
              className="col-span-3"
              placeholder="Enter sequential number (1-999)"
              maxLength={3}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
