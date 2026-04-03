import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
  Upload,
  Paperclip,
  Trash2,
  Download,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import type { ContractDocument, DocumentCategory } from "@/types/document";
import type { JobProjectInfo } from "@/types/job";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: "Contract",
  addendum: "Addendum",
  permit: "Permit",
  insurance: "Insurance",
  change_order: "Change Order",
  plan: "Plan",
  specification: "Specification",
  correspondence: "Correspondence",
  photo: "Photo",
  other: "Other",
};

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface ContractSaveDocumentProps {
  documents: ContractDocument[];
  projectInfo: JobProjectInfo;
  jobId?: string;
  onAddDocuments: (files: File[], associatedItemId?: string, associatedItemLabel?: string, category?: DocumentCategory) => void;
  onRemoveDocument: (id: string) => void;
  onUpdateCategory: (id: string, category: DocumentCategory) => void;
  onRenameDocument?: (id: string, name: string) => Promise<boolean>;
  readOnly?: boolean;
}

export const ContractSaveDocument = ({
  documents,
  jobId,
  onAddDocuments,
  onRemoveDocument,
  onUpdateCategory,
  onRenameDocument,
  readOnly = false,
}: ContractSaveDocumentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [documentBeingRenamed, setDocumentBeingRenamed] = useState<ContractDocument | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onAddDocuments(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDownload = async (doc: ContractDocument) => {
    if (!doc.filePath) {
      toast.error("File not yet saved to storage");
      return;
    }
    try {
      const response = await fetch(`/api/l/contracts/${jobId}/documents/download?documentId=${doc.id}`);
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to download document");
        return;
      }
      const data = await response.json();
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Failed to download document");
    }
  };

  const openRenameDialog = (doc: ContractDocument) => {
    setDocumentBeingRenamed(doc);
    setRenameValue(doc.name);
    setRenameDialogOpen(true);
  };

  const handleRenameSave = async () => {
    if (!documentBeingRenamed) return;
    if (!onRenameDocument) {
      toast.error("Rename is not available");
      return;
    }

    const nextName = renameValue.trim();
    if (!nextName) {
      toast.error("File name is required");
      return;
    }

    if (nextName === documentBeingRenamed.name) {
      setRenameDialogOpen(false);
      return;
    }

    setIsRenaming(true);
    const success = await onRenameDocument(documentBeingRenamed.id, nextName);
    setIsRenaming(false);

    if (success) {
      setRenameDialogOpen(false);
      setDocumentBeingRenamed(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Uploaded / Saved Documents */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Saved Documents</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Uploaded contract documents, proposals, certificates, and compliance files.
            </p>
          </div>
          {!readOnly && (
            <Button onClick={() => inputRef.current?.click()} className="gap-2 bg-[#16335A] text-white hover:bg-[#122947]">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
            onChange={handleFiles}
          />
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <Paperclip className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead className="w-[180px]">Document Type</TableHead>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-sm">{doc.name}</TableCell>
                  <TableCell>
                    <Select
                      value={doc.category}
                      onValueChange={(val) => onUpdateCategory(doc.id, val as DocumentCategory)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(doc.uploadedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleDownload(doc)}
                        disabled={!doc.filePath}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openRenameDialog(doc)}
                          title="Rename"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveDocument(doc.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Work Orders Ready for Billing section removed on contract new page */}

      <Dialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
          if (!open) {
            setDocumentBeingRenamed(null);
            setRenameValue("");
            setIsRenaming(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="contract-document-name">
              File name
            </label>
            <Input
              id="contract-document-name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter file name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSave}
              disabled={isRenaming || !renameValue.trim()}
              className="bg-[#16335A] text-white hover:bg-[#122947]"
            >
              {isRenaming ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
