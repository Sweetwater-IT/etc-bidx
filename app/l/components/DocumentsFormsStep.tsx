import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Download,
  FileText,
  Plus,
  Camera,
} from "lucide-react";
import type { ContractDocument, DocumentCategory } from "@/types/document";
import type { JobProjectInfo } from "@/types/job";

interface DocumentsFormsStepProps {
  documents: ContractDocument[];
  projectInfo: JobProjectInfo;
  jobId?: string;
  onAddDocuments: (files: File[], associatedItemId?: string, associatedItemLabel?: string, category?: DocumentCategory) => void;
  onRemoveDocument: (id: string) => void;
  onUpdateCategory: (id: string, category: DocumentCategory) => void;
  readOnly?: boolean;
}

const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string; description: string }[] = [
  { value: "contract", label: "Contract", description: "Main contract documents" },
  { value: "addendum", label: "Addendum", description: "Contract addendums and amendments" },
  { value: "permit", label: "Permit", description: "Permits and approvals" },
  { value: "insurance", label: "Insurance", description: "Insurance certificates" },
  { value: "change_order", label: "Change Order", description: "Approved change order documents" },
  { value: "plan", label: "Plan", description: "Construction plans and drawings" },
  { value: "specification", label: "Specification", description: "Technical specifications" },
  { value: "correspondence", label: "Correspondence", description: "Project correspondence" },
  { value: "photo", label: "Photo", description: "Project photos" },
  { value: "other", label: "Other", description: "Miscellaneous documents" },
];

const DOCUMENT_CATEGORY_COLORS: Record<DocumentCategory, string> = {
  contract: "bg-blue-500/15 text-blue-700",
  addendum: "bg-indigo-500/15 text-indigo-700",
  permit: "bg-amber-500/15 text-amber-700",
  insurance: "bg-emerald-500/15 text-emerald-700",
  change_order: "bg-purple-500/15 text-purple-700",
  plan: "bg-cyan-500/15 text-cyan-700",
  specification: "bg-orange-500/15 text-orange-700",
  correspondence: "bg-slate-500/15 text-slate-700",
  photo: "bg-pink-500/15 text-pink-700",
  other: "bg-muted text-muted-foreground",
};

const getFileIcon = (fileType: string) => {
  if (fileType === "photo") {
    return <Camera className="h-4 w-4" />;
  }
  return <FileText className="h-4 w-4" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

export const DocumentsFormsStep = ({
  documents,
  projectInfo: _projectInfo,
  jobId,
  onAddDocuments,
  onRemoveDocument,
  onUpdateCategory,
  readOnly = false
}: DocumentsFormsStepProps) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("other");
  const [isDragOver, setIsDragOver] = useState(false);

  const groupedDocuments = useMemo(() => {
    const groups = documents.reduce<Record<string, ContractDocument[]>>((acc, document) => {
      const key = document.category || "other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(document);
      return acc;
    }, {});

    return DOCUMENT_CATEGORIES
      .map((category) => ({
        ...category,
        documents: groups[category.value] || [],
      }))
      .filter((group) => group.documents.length > 0);
  }, [documents]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || readOnly) return;
    const fileArray = Array.from(files);
    onAddDocuments(fileArray, undefined, undefined, selectedCategory);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!readOnly) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleOpenDocument = async (document: ContractDocument) => {
    if (!document.filePath) {
      toast.error("Document path is missing");
      return;
    }

    const { data, error } = await supabase.storage
      .from("files")
      .createSignedUrl(document.filePath, 300);

    if (error || !data?.signedUrl) {
      toast.error("Failed to open document");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents & Forms
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage contract documents, permits, and other project files.
          </p>
        </div>
      </div>

      {/* Upload Section */}
      {!readOnly && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-sm font-medium">Document Category</Label>
                <Select value={selectedCategory} onValueChange={(value: DocumentCategory) => setSelectedCategory(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div>
                          <div className="font-medium">{cat.label}</div>
                          <div className="text-xs text-muted-foreground">{cat.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="file-upload"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">
                  {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, XLS, XLSX, TXT, Images (max 10MB each)
                </p>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <div className="space-y-4">
          {groupedDocuments.map((group) => (
            <div key={group.value}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {group.label} ({group.documents.length})
              </h4>
              <div className="rounded-md border overflow-hidden divide-y">
                {group.documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleOpenDocument(doc)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void handleOpenDocument(doc);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left cursor-pointer"
                  >
                    <div
                      className={`p-2 rounded-md shrink-0 ${
                        doc.category === "photo"
                          ? "bg-pink-500/10 text-pink-700"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {getFileIcon(doc.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</span>
                        {doc.associatedItemLabel ? (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground truncate">{doc.associatedItemLabel}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {readOnly ? (
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${DOCUMENT_CATEGORY_COLORS[doc.category] || "bg-muted text-muted-foreground"}`}
                        >
                          {DOCUMENT_CATEGORIES.find((cat) => cat.value === doc.category)?.label || doc.category}
                        </Badge>
                      ) : (
                        <Select
                          value={doc.category}
                          onValueChange={(value: DocumentCategory) => onUpdateCategory(doc.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs min-w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {jobId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenDocument(doc)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => onRemoveDocument(doc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">No documents yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload contract documents, permits, plans, and other project files.
              </p>
              {!readOnly && (
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
