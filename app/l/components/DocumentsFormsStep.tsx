import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Paperclip,
  Trash2,
  Download,
  FileText,
  ExternalLink,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { ContractDocument, DocumentCategory } from "@/types/document";
import type { JobProjectInfo } from "@/types/job";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: "Contract",
  addendum: "Addendum",
  permit: "Permit",
  insurance: "Insurance",
  bond: "Bond",
  plan: "Plan",
  specification: "Specification",
  correspondence: "Correspondence",
  photo: "Photo",
  other: "Other",
};

interface FinalWorkOrder {
  id: string;
  wo_number: string;
  title: string;
  status: string;
  updated_at: string;
}

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
  { value: "bond", label: "Bond", description: "Performance and payment bonds" },
  { value: "plan", label: "Plan", description: "Construction plans and drawings" },
  { value: "specification", label: "Specification", description: "Technical specifications" },
  { value: "correspondence", label: "Correspondence", description: "Project correspondence" },
  { value: "photo", label: "Photo", description: "Project photos" },
  { value: "other", label: "Other", description: "Miscellaneous documents" },
];

const getFileIcon = (fileType: string) => {
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
  projectInfo,
  jobId,
  onAddDocuments,
  onRemoveDocument,
  onUpdateCategory,
  readOnly = false
}: DocumentsFormsStepProps) => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("other");
  const [isDragOver, setIsDragOver] = useState(false);
  const [finalWOs, setFinalWOs] = useState<FinalWorkOrder[]>([]);

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

  useEffect(() => {
    if (!jobId) return;
    const fetchWorkOrders = async () => {
      try {
        const response = await fetch(`/api/l/jobs/${jobId}/work-orders`);
        if (response.ok) {
          const data = await response.json();
          setFinalWOs(data);
        } else {
          console.error('Failed to fetch work orders');
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
      }
    };
    fetchWorkOrders();
  }, [jobId]);

  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, ContractDocument[]>);

  const STATUS_STYLE: Record<string, string> = {
    completed: "bg-success/10 text-success border-success/30",
    ready: "bg-primary/10 text-primary border-primary/30",
    scheduled: "bg-amber-500/10 text-amber-600 border-amber-500/30",
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
          <CardHeader>
            <CardTitle className="text-sm">Upload Documents</CardTitle>
          </CardHeader>
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

      {/* Documents by Category */}
      <div className="space-y-4">
        {DOCUMENT_CATEGORIES.map((category) => {
          const categoryDocs = documentsByCategory[category.value] || [];
          if (categoryDocs.length === 0) return null;

          return (
            <Card key={category.value}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {category.label}
                    <Badge variant="secondary" className="text-xs">
                      {categoryDocs.length}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {category.description}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(doc.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)} • Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                          {doc.associatedItemLabel && (
                            <p className="text-xs text-primary">
                              Associated with: {doc.associatedItemLabel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!readOnly && (
                          <Select
                            value={doc.category}
                            onValueChange={(value: DocumentCategory) => onUpdateCategory(doc.id, value)}
                          >
                            <SelectTrigger className="w-[120px] h-7 text-xs">
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

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            // Download functionality would go here
                            console.log('Download', doc);
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>

                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => onRemoveDocument(doc.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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

      {/* Final Work Orders for Billing */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Work Orders Ready for Billing</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Finalized work orders that can be submitted to the billing department.
          </p>
        </div>

        {finalWOs.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No finalized work orders yet. Work orders in Ready, Scheduled, or Completed status will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WO #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px]">Last Updated</TableHead>
                <TableHead className="w-[80px] text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalWOs.map((wo) => (
                <TableRow key={wo.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/l/jobs/${jobId}/work-orders/${wo.id}`)}>
                  <TableCell className="font-mono font-bold text-primary text-sm">
                    {wo.wo_number || "—"}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{wo.title || "Untitled"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_STYLE[wo.status] || ""}`}>
                      {wo.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(wo.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
