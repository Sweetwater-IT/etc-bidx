"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
import type { JobProjectInfo, ScheduleOfValuesItem } from "@/types/job";
import { useContractDraft } from "@/hooks/useContractDraft";
import { ChecklistHeader } from "@/app/l/components/ChecklistHeader";
import { ProjectInfoFields } from "@/app/l/components/ProjectInfoFields";
import { ScheduleOfValues } from "@/app/l/components/ScheduleOfValues";
import { DocumentsFormsStep } from "@/app/l/components/DocumentsFormsStep";
import { SaveStatusIndicator } from "@/app/l/components/SaveStatusIndicator";
import { ChangeOrderGateDialog } from "@/app/l/components/ChangeOrderGateDialog";

type DocumentCategory = "contract" | "permit" | "insurance" | "other";

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

const ContractChecklist = () => {
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
    saveOnBlur,
    manualSave,
    createContract,
  } = useContractDraft(contractId);

  // Signed-contract status
  const isSigned = contractRow ? SIGNED_STATUSES.includes(contractRow.contract_status) : false;

  // SOV state
  const [scheduleOfValues, setScheduleOfValuesLocal] = useState<ScheduleOfValuesItem[]>([]);
  const sovSnapshotRef = useRef<ScheduleOfValuesItem[] | null>(null);
  const [showChangeOrderGate, setShowChangeOrderGate] = useState(false);
  const [pendingSovChanges, setPendingSovChanges] = useState<ScheduleOfValuesItem[] | null>(null);
  const [changeOrderApproved, setChangeOrderApproved] = useState(false);

  // SOV is read-only on signed contracts until change order is approved
  const sovReadOnly = isSigned && !changeOrderApproved;

  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [projectInfo, setProjectInfo] = useState<JobProjectInfo>(emptyProjectInfo);
  const [hydrated, setHydrated] = useState(isNew);

  // Take SOV snapshot when contract is signed (for change detection)
  useEffect(() => {
    if (isSigned && !sovSnapshotRef.current && scheduleOfValues.length > 0) {
      sovSnapshotRef.current = [...scheduleOfValues];
    }
  }, [isSigned, scheduleOfValues]);

  const hasSovChanged = useCallback(() => {
    if (!sovSnapshotRef.current) return false;
    const snap = sovSnapshotRef.current;
    const curr = scheduleOfValues;
    if (snap.length !== curr.length) return true;
    return snap.some((s, i) => {
      const c = curr[i];
      return s.id !== c.id || s.itemNumber !== c.itemNumber || s.description !== c.description ||
        s.quantity !== c.quantity || s.unitPrice !== c.unitPrice || s.uom !== c.uom;
    });
  }, [scheduleOfValues]);

  const setScheduleOfValues = useCallback((items: ScheduleOfValuesItem[]) => {
    // On signed contracts without change order, block edits and show gate
    if (isSigned && !changeOrderApproved) {
      // This shouldn't be called if SOV is readOnly, but just in case
      setPendingSovChanges(items);
      setShowChangeOrderGate(true);
      return;
    }
    setScheduleOfValuesLocal(items);
    markDirty("sovItems", items);
    // Also persist to sov_items table for PM window visibility
    if (contractId) {
      supabase.functions.invoke("upsert-sov-items", {
        body: { jobId: contractId, items },
      });
    }
  }, [markDirty, isSigned, changeOrderApproved, contractId]);

  // Handler when user tries to edit SOV on a signed contract (clicks the unlock button)
  const handleRequestSovEdit = useCallback(() => {
    if (changeOrderApproved) return; // already unlocked
    setPendingSovChanges(scheduleOfValues);
    setShowChangeOrderGate(true);
  }, [changeOrderApproved, scheduleOfValues]);

  const handleChangeOrderApproved = useCallback(async (
    method: "document" | "admin_approval",
    details: {
      coNumber?: string;
      description?: string;
      amount?: number;
      documentFile?: File;
      approverUserId?: string;
      approverName?: string;
    }
  ) => {
    if (!contractId) return;
    try {
      const coData: Record<string, unknown> = {
        job_id: contractId,
        co_number: details.coNumber || `CO-AUTO-${Date.now()}`,
        description: details.description || "SOV modification on signed contract",
        amount: details.amount || 0,
        status: method === "document" ? "approved" : "admin_approved",
        submitted_date: new Date().toISOString().split("T")[0],
        approved_date: new Date().toISOString().split("T")[0],
      };
      const { error: coErr } = await supabase.from("change_orders").insert(coData as any);
      if (coErr) {
        toast.error(`Failed to record change order: ${coErr.message}`);
        return;
      }

      if (method === "document" && details.documentFile) {
        const filePath = `${contractId}/change-orders/${Date.now()}-${details.documentFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("contract-documents")
          .upload(filePath, details.documentFile);
        if (uploadErr) {
          toast.error("Change order recorded but document upload failed");
        } else {
          await supabase.from("documents").insert({
            job_id: contractId,
            file_name: details.documentFile.name,
            file_path: filePath,
            file_type: details.documentFile.type,
            file_size: details.documentFile.size,
          });
        }
      }

      // Don't save SOV yet — just unlock editing. User will make changes and they auto-save.
      setChangeOrderApproved(true);
      sovSnapshotRef.current = [...scheduleOfValues];

      toast.success(method === "document"
        ? "Change order recorded — SOV is now unlocked for editing"
        : `SOV unlocked by ${details.approverName || "Admin"} — you can now edit`
      );
    } catch (err: any) {
      toast.error(`Failed to process change order: ${err.message}`);
    } finally {
      setShowChangeOrderGate(false);
      setPendingSovChanges(null);
    }
  }, [contractId, scheduleOfValues]);

  const handleChangeOrderCancel = useCallback(() => {
    if (sovSnapshotRef.current) {
      setScheduleOfValuesLocal(sovSnapshotRef.current);
    }
    setShowChangeOrderGate(false);
    setPendingSovChanges(null);
  }, []);

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

      const dbSov = (contractRow as any)?.sov_items;
      if (Array.isArray(dbSov) && dbSov.length > 0) {
        setScheduleOfValuesLocal(dbSov);
      }

      try {
        const [docsResult] = await Promise.all([
          supabase.from("documents").select("*").eq("job_id", contractId),
        ]);
        if (thisRunId !== runIdRef.current) return;

        const docs = docsResult.data;
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
      setScheduleOfValuesLocal([]);
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
        window.history.replaceState(null, "", `/contract/${newId}`);
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

    for (const file of files) {
      const filePath = `${contractId}/${docCategory}/${Date.now()}_${file.name}`;
      try {
        const { error: uploadErr } = await supabase.storage
          .from("contract-documents")
          .upload(filePath, file, { upsert: false });
        if (uploadErr) throw uploadErr;

        const { data: docRow, error: docErr } = await supabase.from("documents").insert({
          job_id: contractId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: docCategory,
          checklist_item_id: associatedItemId || null,
        }).select("*").single();
        if (docErr) throw docErr;

        const newDoc: ContractDocument = {
          id: docRow.id,
          name: file.name,
          size: file.size,
          type: file.type,
          category: docCategory,
          associatedItemId,
          associatedItemLabel,
          uploadedAt: new Date().toISOString(),
          filePath,
        };
        setDocuments((prev) => [...prev, newDoc]);
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message}`);
      }
    }
    if (!associatedItemLabel) {
      toast.success(`${files.length} document(s) uploaded`);
    }
  };

  const handleRemoveDocument = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc?.filePath) {
      await supabase.storage.from("contract-documents").remove([doc.filePath]);
      await supabase.from("documents").delete().eq("id", id);
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDocumentCategory = async (id: string, category: DocumentCategory) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, category } : d))
    );
    await supabase.from("documents").update({ file_type: category }).eq("id", id);
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
          readOnly={false}
        />

        {/* Schedule of Values */}
        <div>
          <ScheduleOfValues items={scheduleOfValues} onChange={setScheduleOfValues} readOnly={sovReadOnly} />
          {isSigned && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
              <p className="text-xs text-warning font-medium">
                {changeOrderApproved
                  ? "✓ Change order approved — SOV is unlocked for editing."
                  : "SOV is locked. A Change Order is required to modify the Schedule of Values."}
              </p>
              {!changeOrderApproved && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-warning/40 text-warning hover:bg-warning/10"
                  onClick={handleRequestSovEdit}
                >
                  <Edit className="h-3 w-3" />
                  Unlock SOV
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Documents & Forms */}
        <DocumentsFormsStep
          documents={documents}
          projectInfo={projectInfo}
          jobId={routeId}
          onAddDocuments={handleAddDocuments}
          onRemoveDocument={handleRemoveDocument}
          onUpdateCategory={handleUpdateDocumentCategory}
          readOnly={false}
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

      {/* Change Order Gate Dialog for signed contract SOV edits */}
      {contractId && (
        <ChangeOrderGateDialog
          open={showChangeOrderGate}
          onOpenChange={setShowChangeOrderGate}
          jobId={contractId}
          onApproved={handleChangeOrderApproved}
          onCancel={handleChangeOrderCancel}
        />
      )}
    </div>
  );
};

export default ContractChecklist;