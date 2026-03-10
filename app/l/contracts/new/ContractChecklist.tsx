"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Lock, Edit } from "lucide-react";
import type { JobProjectInfo } from "@/types/job";
import { useContractDraft } from "@/hooks/useContractDraft";
import { ChecklistHeader } from "@/app/l/components/ChecklistHeader";
import { ProjectInfoFields } from "@/app/l/components/ProjectInfoFields";
import { SOVTable } from "@/components/SOVTable";
import { ContractSaveDocument } from "@/app/l/components/ContractSaveDocument";
import { SaveStatusIndicator } from "@/app/l/components/SaveStatusIndicator";


type DocumentCategory = "contract" | "addendum" | "permit" | "insurance" | "bond" | "plan" | "specification" | "correspondence" | "photo" | "other";

interface ContractDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  category: DocumentCategory;
  associatedItemId?: string;
  associatedItemLabel?: string;
  uploadedAt: string;
  filePath: string;
}

const emptyProjectInfo: JobProjectInfo = {
  projectName: "",
  contractNumber: "",
  customerName: "",
  customerJobNumber: "",
  projectOwner: "",
  etcJobNumber: null,
  etcBranch: "",
  county: "",
  customerPM: "",
  customerPMEmail: "",
  customerPMPhone: "",
  certifiedPayrollContact: "",
  certifiedPayrollEmail: "",
  certifiedPayrollPhone: "",
  customerBillingContact: "",
  customerBillingEmail: "",
  customerBillingPhone: "",
  etcProjectManager: "",
  etcBillingManager: "",
  etcProjectManagerEmail: "",
  etcBillingManagerEmail: "",
  projectStartDate: "",
  projectEndDate: "",
  otherNotes: "",
  isCertifiedPayroll: "none",
  shopRate: "",
  stateMptBaseRate: "",
  stateMptFringeRate: "",
  stateFlaggingBaseRate: "",
  stateFlaggingFringeRate: "",
  federalMptBaseRate: "",
  federalMptFringeRate: "",
  federalFlaggingBaseRate: "",
  federalFlaggingFringeRate: "",
  extensionDate: "",
};

const SIGNED_STATUSES = ["CONTRACT_SIGNED", "SOURCE_OF_SUPPLY"];

const ContractChecklist = ({ forceReadOnly = false }: { forceReadOnly?: boolean }) => {
  const router = useRouter();
  const params = useParams();
  const routeId = params?.id as string;
  const isNew = !routeId || routeId === "new";

  const [contractId, setContractId] = useState<string | undefined>(isNew ? undefined : routeId);
  const {
    contractRow,
    projectInfo: dbProjectInfo,
    isLoading,
    saveStatus,
    lastSavedAt,
    isSaving,
    hasDirtyFields,
    markDirty,
    manualSave,
    createContract,
  } = useContractDraft(contractId);

  // Signed-contract status
  const isSigned = contractRow ? SIGNED_STATUSES.includes(contractRow.contract_status) : false;
  const isReadOnly = forceReadOnly || isSigned;



  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [projectInfo, setProjectInfo] = useState<JobProjectInfo>(emptyProjectInfo);
  const [hydrated, setHydrated] = useState(isNew);



  // Contract creation mutex
  const creatingRef = useRef<Promise<string | undefined> | null>(null);

  // Navigation blocker - simplified for Next.js
  const [showNavBlocker, setShowNavBlocker] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasDirtyFields) {
        e.preventDefault();
        e.returnValue = '';
        setShowNavBlocker(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasDirtyFields]);

  // Atomic hydration
  const hydratedKeyRef = useRef<string | undefined>(undefined);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (isNew || !contractId) return;
    if (hydratedKeyRef.current === contractId) return;
    if (!dbProjectInfo || !contractRow) return;

    hydratedKeyRef.current = contractId;
    const thisRunId = ++runIdRef.current;

    const hydrate = async () => {
      if (thisRunId !== runIdRef.current) return;

      setProjectInfo(dbProjectInfo);



      try {
        const response = await fetch(`/api/l/contracts/${contractId}/documents`);
        if (thisRunId !== runIdRef.current) return;

        if (response.ok) {
          const docs = await response.json();
          if (docs && docs.length > 0) {
            setDocuments(docs.map((d: any) => ({
              id: d.id,
              name: d.file_name,
              size: d.file_size || 0,
              type: d.file_type || "other",
              category: (d.file_type || "other") as DocumentCategory,
              associatedItemId: d.checklist_item_id || undefined,
              uploadedAt: d.uploaded_at,
              filePath: d.file_path,
            })));
          }
        }
      } catch {
        // Non-critical
      }

      setHydrated(true);
    };

    hydrate();
  }, [isNew, contractId, dbProjectInfo, contractRow]);

  useEffect(() => {
    if (contractId !== hydratedKeyRef.current) {
      setHydrated(false);
      setProjectInfo(emptyProjectInfo);
    }
  }, [contractId]);

  const ensureContractExists = useCallback(async (info: JobProjectInfo) => {
    if (contractId) return contractId;
    if (creatingRef.current) return creatingRef.current;

    const promise = (async () => {
      try {
        const result = await createContract({
          projectName: info.projectName || "Untitled Contract",
          contractNumber: info.contractNumber,
          customerName: info.customerName,
          etcBranch: info.etcBranch,
          county: info.county,
          contractStatus: "CONTRACT_RECEIPT",
        });
        const newId = result.id;
        setContractId(newId);
        window.history.replaceState(null, "", `/l/${newId}`);
        return newId;
      } catch {
        return undefined;
      } finally {
        creatingRef.current = null;
      }
    })();

    creatingRef.current = promise;
    return promise;
  }, [contractId, createContract]);

  const handleProjectInfoChange = useCallback(
    async (newInfo: JobProjectInfo) => {
      setProjectInfo(newInfo);
      const changedFields: Record<string, unknown> = {};
      for (const key of Object.keys(newInfo) as (keyof JobProjectInfo)[]) {
        if (newInfo[key] !== projectInfo[key]) {
          changedFields[key] = newInfo[key];
        }
      }
      if (Object.keys(changedFields).length === 0) return;

      if (!contractId) {
        const hasContent = newInfo.projectName || newInfo.contractNumber || newInfo.customerName;
        if (hasContent) {
          await ensureContractExists(newInfo);
        }
        return;
      }

      for (const [key, value] of Object.entries(changedFields)) {
        markDirty(key, value);
      }
    },
    [contractId, projectInfo, markDirty, ensureContractExists]
  );

  // Document handlers
  const handleAddDocuments = async (files: File[], associatedItemId?: string, associatedItemLabel?: string, category?: DocumentCategory) => {
    if (!contractId) {
      toast.error("Save the contract first before uploading documents");
      return;
    }
    const docCategory = category || "other";

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('associatedItemId', associatedItemId || '');
    formData.append('category', docCategory);

    try {
      const response = await fetch(`/api/l/contracts/${contractId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Upload failed: ${error.error}`);
        return;
      }

      const result = await response.json();
      setDocuments((prev) => [...prev, ...result.documents]);
      if (!associatedItemLabel) {
        toast.success(`${files.length} document(s) uploaded`);
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  const handleRemoveDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/l/contracts/${contractId}/documents?documentId=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Failed to delete document: ${error.error}`);
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      toast.error(`Failed to delete document: ${err.message}`);
    }
  };

  const handleUpdateDocumentCategory = async (id: string, category: DocumentCategory) => {
    try {
      const response = await fetch(`/api/l/contracts/${contractId}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id, category }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Failed to update document category: ${error.error}`);
        return;
      }

      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, category } : d))
      );
    } catch (err: any) {
      toast.error(`Failed to update document category: ${err.message}`);
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading contract…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" onClick={async () => { await manualSave(); router.push("/l/contracts"); }} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Contracts
          </Button>
          <div className="flex items-center gap-3">
            <SaveStatusIndicator
              status={saveStatus === "unsaved" ? "idle" : saveStatus}
              lastSavedAt={lastSavedAt}
              onManualSave={manualSave}
              isSaving={isSaving}
            />
          </div>
        </div>
      </header>

      {/* Signed contract info banner */}
      {isSigned && (
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-primary font-medium">
              This contract is signed. Admin fields can be edited freely. SOV changes require a Change Order.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <ChecklistHeader />

        {/* Admin Info — always editable */}
        <ProjectInfoFields
          projectInfo={projectInfo}
          onChange={handleProjectInfoChange}
          showValidation={showValidation}
          readOnly={isReadOnly}
          contractRow={contractRow}
        />

        {/* Schedule of Values */}
        <div>
          <SOVTable jobId={contractId} />
          {isSigned && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
              <p className="text-xs text-warning font-medium">
                This contract is signed. SOV changes require a Change Order.
              </p>
            </div>
          )}
        </div>

        {/* Documents & Forms */}
        <ContractSaveDocument
          documents={documents}
          projectInfo={projectInfo}
          jobId={routeId}
          onAddDocuments={handleAddDocuments}
          onRemoveDocument={handleRemoveDocument}
          onUpdateCategory={handleUpdateDocumentCategory}
          readOnly={isReadOnly}
        />
      </div>

      {/* Navigation blocker dialog */}
      <Dialog open={showNavBlocker} onOpenChange={setShowNavBlocker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save before leaving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNavBlocker(false);
              }}
            >
              Discard
            </Button>
            <Button
              onClick={async () => {
                setShowNavBlocker(false);
                await manualSave();
              }}
            >
              Save & Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default ContractChecklist;