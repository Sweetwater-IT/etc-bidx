import { useEffect, useMemo, useRef, useState } from "react";
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
  FilePlus2,
  Sparkles,
  ShieldCheck,
  Eye,
  ChevronUp,
  ChevronDown,
  Files,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { ContractDocument, DocumentCategory } from "@/types/document";
import type { JobProjectInfo } from "@/types/job";
import { BUILT_IN_CONTRACT_DOCS, GENERATED_CONTRACT_DOCS, type BuiltInContractDocType, type GeneratedContractDocType } from "@/lib/contract-packet";

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
  onAppendDocument?: (document: ContractDocument) => void;
  readOnly?: boolean;
  currentUser?: {
    name: string;
    email: string;
    role?: string;
  } | null;
}

export const ContractSaveDocument = ({
  documents,
  projectInfo,
  jobId,
  onAddDocuments,
  onRemoveDocument,
  onUpdateCategory,
  onRenameDocument,
  onAppendDocument,
  readOnly = false,
  currentUser = null,
}: ContractSaveDocumentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [documentBeingRenamed, setDocumentBeingRenamed] = useState<ContractDocument | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [selectedPacketDocIds, setSelectedPacketDocIds] = useState<string[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("Document Preview");
  const [activeBuiltInDoc, setActiveBuiltInDoc] = useState<BuiltInContractDocType | null>(null);
  const [activeGeneratedDoc, setActiveGeneratedDoc] = useState<GeneratedContractDocType | null>(null);
  const [isPacketPreviewing, setIsPacketPreviewing] = useState(false);
  const [isPacketMerging, setIsPacketMerging] = useState(false);

  const packetDocuments = useMemo(
    () =>
      documents.filter((doc) => {
        const name = (doc.name || "").toLowerCase();
        const type = (doc.type || "").toLowerCase();
        return name.endsWith(".pdf") || type.includes("pdf");
      }),
    [documents]
  );

  const selectedPacketDocs = useMemo(() => {
    const packetDocMap = new Map(packetDocuments.map((doc) => [doc.id, doc]));
    return selectedPacketDocIds.map((id) => packetDocMap.get(id)).filter(Boolean) as ContractDocument[];
  }, [packetDocuments, selectedPacketDocIds]);

  useEffect(() => {
    setSelectedPacketDocIds((prev) => prev.filter((id) => packetDocuments.some((doc) => doc.id === id)));
  }, [packetDocuments]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onAddDocuments(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPreviewFromBlob = (blob: Blob, title: string) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(blob);
    setPreviewUrl(objectUrl);
    setPreviewTitle(title);
    setPreviewDialogOpen(true);
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

  const togglePacketDocument = (documentId: string) => {
    setSelectedPacketDocIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const movePacketDocument = (documentId: string, direction: "up" | "down") => {
    setSelectedPacketDocIds((prev) => {
      const index = prev.indexOf(documentId);
      if (index === -1) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const reordered = [...prev];
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return reordered;
    });
  };

  const handleAddBuiltInDocument = async (docType: BuiltInContractDocType) => {
    if (!jobId) {
      toast.error("Save the contract first before appending compliance files");
      return;
    }
    setActiveBuiltInDoc(docType);
    try {
      const response = await fetch(`/api/l/contracts/${jobId}/documents/packet/built-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || result?.message || "Failed to add built-in document");
      }
      onAppendDocument?.(result.document);
      toast.success(`${BUILT_IN_CONTRACT_DOCS.find((doc) => doc.type === docType)?.label || "Compliance document"} added to contract files`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add compliance document");
    } finally {
      setActiveBuiltInDoc(null);
    }
  };

  const handleGenerateDocument = async (docType: GeneratedContractDocType) => {
    if (!jobId) {
      toast.error("Save the contract first before generating contract documents");
      return;
    }
    setActiveGeneratedDoc(docType);
    try {
      const response = await fetch(`/api/l/contracts/${jobId}/documents/packet/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          projectInfo,
          user: currentUser,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || result?.message || "Failed to generate contract document");
      }
      onAppendDocument?.(result.document);
      toast.success(`${GENERATED_CONTRACT_DOCS.find((doc) => doc.type === docType)?.label || "Generated document"} added to contract files`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate contract document");
    } finally {
      setActiveGeneratedDoc(null);
    }
  };

  const handlePreviewPacket = async () => {
    if (!jobId || selectedPacketDocIds.length === 0) {
      toast.error("Select at least one saved PDF document first");
      return;
    }
    setIsPacketPreviewing(true);
    try {
      const response = await fetch(`/api/l/contracts/${jobId}/documents/packet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: selectedPacketDocIds,
          preview: true,
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Failed to preview packet");
      }
      const blob = await response.blob();
      openPreviewFromBlob(blob, "Packet Preview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to preview packet");
    } finally {
      setIsPacketPreviewing(false);
    }
  };

  const handleMergeAndSavePacket = async () => {
    if (!jobId || selectedPacketDocIds.length === 0) {
      toast.error("Select at least one saved PDF document first");
      return;
    }
    setIsPacketMerging(true);
    try {
      const response = await fetch(`/api/l/contracts/${jobId}/documents/packet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: selectedPacketDocIds,
          preview: false,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "Failed to merge packet");
      }

      const newDocument: ContractDocument = {
        id: result.document.id,
        name: result.document.name,
        size: result.document.size,
        type: "application/pdf",
        category: "contract",
        uploadedAt: result.document.uploadedAt,
        filePath: result.document.filePath,
      };

      onAppendDocument?.(newDocument);
      setSelectedPacketDocIds([]);
      toast.success("Merged packet saved to contract files");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to merge packet");
    } finally {
      setIsPacketMerging(false);
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
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Contract Packet Automation</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Generate deprecated contract-manager documents and append them directly into this contract&apos;s saved files.
            </p>
          </div>
          {!jobId && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
              Save Contract First
            </Badge>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-slate-50/70 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Generate & Save Deprecated Docs</h4>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              These are generated from the current `l/contracts/new` form values and saved straight into contract files.
            </p>
            <div className="mt-4 space-y-3">
              {GENERATED_CONTRACT_DOCS.map((doc) => {
                const isActive = activeGeneratedDoc === doc.type;
                return (
                  <div key={doc.type} className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.label}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateDocument(doc.type)}
                      disabled={!jobId || readOnly || !!activeGeneratedDoc || !!activeBuiltInDoc}
                    >
                      {isActive ? "Generating..." : "Generate & Save"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border bg-slate-50/70 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Append Built-In Compliance PDFs</h4>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Add static compliance files to the contract so they live alongside uploaded and generated docs.
            </p>
            <div className="mt-4 space-y-3">
              {BUILT_IN_CONTRACT_DOCS.map((doc) => {
                const isActive = activeBuiltInDoc === doc.type;
                return (
                  <div key={doc.type} className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.label}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddBuiltInDocument(doc.type)}
                      disabled={!jobId || readOnly || !!activeBuiltInDoc || !!activeGeneratedDoc}
                    >
                      {isActive ? "Adding..." : "Add to Contract Files"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded / Saved Documents */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Saved Documents</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Uploaded contract documents, generated deprecated forms, merged packets, and compliance files.
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
                <TableHead className="w-[90px]">Packet</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="w-[180px]">Document Type</TableHead>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    {packetDocuments.some((packetDoc) => packetDoc.id === doc.id) ? (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedPacketDocIds.includes(doc.id)}
                          onCheckedChange={() => togglePacketDocument(doc.id)}
                          disabled={readOnly}
                        />
                        {selectedPacketDocIds.includes(doc.id) ? (
                          <Badge variant="outline" className="h-6 min-w-6 px-1 justify-center">
                            {selectedPacketDocIds.indexOf(doc.id) + 1}
                          </Badge>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Non-PDF</span>
                    )}
                  </TableCell>
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

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Packet Builder</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select saved PDF files, set their order, preview the merged packet, and save it back into this contract.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePreviewPacket}
              disabled={!jobId || selectedPacketDocIds.length === 0 || isPacketPreviewing || isPacketMerging}
            >
              <Eye className="mr-2 h-4 w-4" />
              {isPacketPreviewing ? "Generating..." : "Preview Packet"}
            </Button>
            <Button
              onClick={handleMergeAndSavePacket}
              disabled={!jobId || selectedPacketDocIds.length === 0 || isPacketMerging}
              className="bg-[#16335A] text-white hover:bg-[#122947]"
            >
              <Files className="mr-2 h-4 w-4" />
              {isPacketMerging ? "Merging..." : "Merge & Save"}
            </Button>
          </div>
        </div>

        {!jobId ? (
          <div className="mt-6 rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <FilePlus2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Save the contract first, then generate documents and build a merged packet from the saved PDF files.
            </p>
          </div>
        ) : selectedPacketDocs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <Files className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Select one or more saved PDF documents above to build a packet.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Order</TableHead>
                  <TableHead>Packet Document</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPacketDocs.map((doc, index) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-6 min-w-6 px-1 justify-center">
                          {index + 1}
                        </Badge>
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => movePacketDocument(doc.id, "up")}
                            disabled={index === 0 || readOnly}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => movePacketDocument(doc.id, "down")}
                            disabled={index === selectedPacketDocs.length - 1 || readOnly}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{doc.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleDownload(doc)}
                        title="Preview document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

      <Dialog
        open={previewDialogOpen}
        onOpenChange={(open) => {
          setPreviewDialogOpen(open);
          if (!open && previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="h-[75vh] overflow-hidden rounded-md border bg-muted/30">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title={previewTitle}
                className="h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Preparing preview…
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
