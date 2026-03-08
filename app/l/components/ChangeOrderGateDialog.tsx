import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, User } from "lucide-react";

interface ChangeOrderGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onApproved: (method: "document" | "admin_approval", details: {
    coNumber?: string;
    description?: string;
    amount?: number;
    documentFile?: File;
    approverUserId?: string;
    approverName?: string;
  }) => void;
  onCancel: () => void;
}

export const ChangeOrderGateDialog = ({
  open,
  onOpenChange,
  jobId,
  onApproved,
  onCancel
}: ChangeOrderGateDialogProps) => {
  const [method, setMethod] = useState<"document" | "admin_approval">("document");
  const [coNumber, setCoNumber] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [approverUserId, setApproverUserId] = useState("");
  const [approverName, setApproverName] = useState("");

  const handleSubmit = () => {
    const details = {
      coNumber: coNumber || undefined,
      description: description || undefined,
      amount: amount ? parseFloat(amount) : undefined,
      documentFile: method === "document" ? documentFile || undefined : undefined,
      approverUserId: method === "admin_approval" ? approverUserId || undefined : undefined,
      approverName: method === "admin_approval" ? approverName || undefined : undefined,
    };

    onApproved(method, details);
    handleClose();
  };

  const handleClose = () => {
    setMethod("document");
    setCoNumber("");
    setDescription("");
    setAmount("");
    setDocumentFile(null);
    setApproverUserId("");
    setApproverName("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    handleClose();
  };

  const isValid = () => {
    if (method === "document") {
      return coNumber.trim() && description.trim() && documentFile;
    } else {
      return coNumber.trim() && description.trim() && approverName.trim();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Change Order Required
          </DialogTitle>
          <DialogDescription>
            This contract is signed. To modify the Schedule of Values, you need to create a Change Order.
            Choose how you want to approve this change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Method Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Approval Method</Label>
            <Select value={method} onValueChange={(value: "document" | "admin_approval") => setMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document Approval
                  </div>
                </SelectItem>
                <SelectItem value="admin_approval">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Admin Approval
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Change Order Details */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Change Order Number <span className="text-destructive">*</span>
              </Label>
              <Input
                value={coNumber}
                onChange={(e) => setCoNumber(e.target.value)}
                placeholder="e.g. CO-001"
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the changes being made..."
                className="min-h-[60px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Estimated Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-8"
              />
            </div>
          </div>

          {/* Method-specific fields */}
          {method === "document" ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Change Order Document <span className="text-destructive">*</span>
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {documentFile ? documentFile.name : "Click to upload change order document"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX files accepted
                  </p>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Approver Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Enter admin approver name"
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Approver User ID (Optional)</Label>
                <Input
                  value={approverUserId}
                  onChange={(e) => setApproverUserId(e.target.value)}
                  placeholder="User ID"
                  className="h-8"
                />
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">What happens next?</p>
                <p className="mt-1">
                  {method === "document"
                    ? "The change order document will be uploaded and the SOV will be unlocked for editing."
                    : "The change order will be recorded with admin approval and the SOV will be unlocked for editing."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid()}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Create Change Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};