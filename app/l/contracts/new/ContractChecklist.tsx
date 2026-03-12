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
import { Lock, Pencil } from "lucide-react";
import type { JobProjectInfo } from "@/types/job";
import { ChecklistHeader } from "@/app/l/components/ChecklistHeader";
import { ProjectInfoFields } from "@/app/l/components/ProjectInfoFields";
import { SOVTable } from "@/components/SOVTable";
import { ContractSaveDocument } from "@/app/l/components/ContractSaveDocument";
import { SaveStatusIndicator } from "@/app/l/components/SaveStatusIndicator";
import { saveContract } from "@/lib/api-client";
import isEqual from "lodash/isEqual";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";


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

const mapProjectInfoToContractData = (projectInfo: JobProjectInfo, contractStatus?: string) => ({
  contract_status: contractStatus || "CONTRACT_RECEIPT",
  project_name: projectInfo.projectName,
  contract_number: projectInfo.contractNumber,
  customer_name: projectInfo.customerName,
  customer_job_number: projectInfo.customerJobNumber,
  project_owner: projectInfo.projectOwner,
  etc_job_number: projectInfo.etcJobNumber,
  etc_branch: projectInfo.etcBranch,
  county: projectInfo.county,
  customer_pm: projectInfo.customerPM,
  customer_pm_email: projectInfo.customerPMEmail,
  customer_pm_phone: projectInfo.customerPMPhone,
  certified_payroll_contact: projectInfo.certifiedPayrollContact,
  certified_payroll_email: projectInfo.certifiedPayrollEmail,
  certified_payroll_phone: projectInfo.certifiedPayrollPhone,
  customer_billing_contact: projectInfo.customerBillingContact,
  customer_billing_email: projectInfo.customerBillingEmail,
  customer_billing_phone: projectInfo.customerBillingPhone,
  etc_project_manager: projectInfo.etcProjectManager,
  etc_billing_manager: projectInfo.etcBillingManager,
  etc_project_manager_email: projectInfo.etcProjectManagerEmail,
  etc_billing_manager_email: projectInfo.etcBillingManagerEmail,
  project_start_date: projectInfo.projectStartDate,
  project_end_date: projectInfo.projectEndDate,
  additional_notes: projectInfo.otherNotes,
  certified_payroll_type: projectInfo.isCertifiedPayroll,
  shop_rate: projectInfo.shopRate,
  state_base_rate: projectInfo.stateMptBaseRate,
  state_fringe_rate: projectInfo.stateMptFringeRate,
  state_flagging_base_rate: projectInfo.stateFlaggingBaseRate,
  state_flagging_fringe_rate: projectInfo.stateFlaggingFringeRate,
  federal_base_rate: projectInfo.federalMptBaseRate,
  federal_fringe_rate: projectInfo.federalMptFringeRate,
  federal_flagging_base_rate: projectInfo.federalFlaggingBaseRate,
  federal_flagging_fringe_rate: projectInfo.federalFlaggingFringeRate,
  extension_date: projectInfo.extensionDate,
});

const getContractStatus = (contractRow: any) =>
  contractRow?.contractStatus || contractRow?.contract_status || "CONTRACT_RECEIPT";

const ContractChecklist = ({ forceReadOnly = false }: { forceReadOnly?: boolean }) => {
  const router = useRouter();
  const params = useParams();
  const routeId = params?.id as string;
  const isNew = !routeId || routeId === "new";

  const [contractId, setContractId] = useState<string | undefined>(isNew ? undefined : routeId);
  const [contractRow, setContractRow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [secondCounter, setSecondCounter] = useState<number>(0);
  const [firstSave, setFirstSave] = useState<boolean>(false);
  const saveTimeoutRef = useRef<number | null>(null);

  // Signed-contract status
  const isSigned = contractRow ? SIGNED_STATUSES.includes(getContractStatus(contractRow)) : false;
  const isReadOnly = forceReadOnly || isSigned;

  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [projectInfo, setProjectInfo] = useState<JobProjectInfo>(emptyProjectInfo);
  const [hydrated, setHydrated] = useState(isNew);

  // Check if we're in view mode (forceReadOnly is true and contract exists)
  const isViewMode = forceReadOnly && contractId;
  const jobName = projectInfo.projectName?.trim() || "Untitled Project";
  const checklistTitle = isViewMode
    ? `Contract for ${jobName}`
    : isNew
      ? (projectInfo.projectName?.trim() ? `New Contract for ${jobName}` : "New Contract")
      : `Edit Contract for ${jobName}`;
  const checklistDescription = isViewMode
    ? "Review contract requirements, schedule of values, and supporting documents."
    : isNew
      ? "Set up contract requirements, schedule of values, and supporting documents."
      : "Update contract requirements, schedule of values, and supporting documents.";

  // Contract creation mutex
  const creatingRef = useRef<Promise<string | undefined> | null>(null);

  // Navigation blocker - simplified for Next.js
  const [showNavBlocker, setShowNavBlocker] = useState(false);

  // Autosave states - exactly like sign-orders
  const prevStateRef = useRef({
    projectInfo,
    contractId
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondCounter(prev => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Fetch contract data for existing contracts
  useEffect(() => {
    if (isNew || !contractId) return;

    const fetchContract = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/l/contracts/${contractId}`);
        if (response.ok) {
          const contract = await response.json();
          setContractRow(contract);
          // Transform snake_case to camelCase for projectInfo
          const transformedProjectInfo: JobProjectInfo = {
            projectName: contract.project_name || "",
            contractNumber: contract.contract_number || "",
            customerName: contract.customer_name || "",
            customerJobNumber: contract.customer_job_number || "",
            projectOwner: contract.project_owner || "",
            etcJobNumber: contract.etc_job_number || null,
            etcBranch: contract.etc_branch || "",
            county: contract.county || "",
            customerPM: contract.customer_pm || "",
            customerPMEmail: contract.customer_pm_email || "",
            customerPMPhone: contract.customer_pm_phone || "",
            certifiedPayrollContact: contract.certified_payroll_contact || "",
            certifiedPayrollEmail: contract.certified_payroll_email || "",
            certifiedPayrollPhone: contract.certified_payroll_phone || "",
            customerBillingContact: contract.customer_billing_contact || "",
            customerBillingEmail: contract.customer_billing_email || "",
            customerBillingPhone: contract.customer_billing_phone || "",
            etcProjectManager: contract.etc_project_manager || "",
            etcBillingManager: contract.etc_billing_manager || "",
            etcProjectManagerEmail: contract.etc_project_manager_email || "",
            etcBillingManagerEmail: contract.etc_billing_manager_email || "",
            projectStartDate: contract.project_start_date || "",
            projectEndDate: contract.project_end_date || "",
            otherNotes: contract.additional_notes || "",
            isCertifiedPayroll: contract.certified_payroll_type === "state" ? "state" : contract.certified_payroll_type === "federal" ? "federal" : "none",
            shopRate: contract.shop_rate || "",
            stateMptBaseRate: contract.state_base_rate || "",
            stateMptFringeRate: contract.state_fringe_rate || "",
            stateFlaggingBaseRate: contract.state_flagging_base_rate || "",
            stateFlaggingFringeRate: contract.state_flagging_fringe_rate || "",
            federalMptBaseRate: contract.federal_base_rate || "",
            federalMptFringeRate: contract.federal_fringe_rate || "",
            federalFlaggingBaseRate: contract.federal_flagging_base_rate || "",
            federalFlaggingFringeRate: contract.federal_flagging_fringe_rate || "",
            extensionDate: contract.extension_date || "",
          };
          setProjectInfo(transformedProjectInfo);
        }

        // Fetch documents
        const docsResponse = await fetch(`/api/l/contracts/${contractId}/documents`);
        if (docsResponse.ok) {
          const docs = await docsResponse.json();
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
      } catch (error) {
        console.error('Error fetching contract:', error);
        toast.error('Failed to load contract');
      } finally {
        setIsLoading(false);
        setHydrated(true);
      }
    };

    fetchContract();
  }, [isNew, contractId]);

  const ensureContractExists = useCallback(async (info: JobProjectInfo) => {
    if (contractId) return contractId;
    if (creatingRef.current) return creatingRef.current;

    const trimmedProjectName = info.projectName?.trim();
    if (!trimmedProjectName) return undefined;

    const promise = (async () => {
      try {
        const contractData = {
          contractId: undefined,
          data: mapProjectInfoToContractData({
            ...info,
            projectName: trimmedProjectName,
          }, getContractStatus(contractRow)),
        };
        const result = await saveContract(contractData);
        const newId = result.id;
        setContractId(newId);
        setContractRow(result);
        router.replace(`/l/contracts/edit/${newId}`);
        return newId;
      } catch {
        return undefined;
      } finally {
        creatingRef.current = null;
      }
    })();

    creatingRef.current = promise;
    return promise;
  }, [contractId, contractRow, router]);

  const handleProjectInfoChange = useCallback(
    async (newInfo: JobProjectInfo) => {
      setProjectInfo(newInfo);

      if (!contractId) {
        // Only create contract if job name is entered
        if (newInfo.projectName && newInfo.projectName.trim()) {
          // Clear any existing timeout
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          // Set a 4-second delay before creating the contract
          saveTimeoutRef.current = window.setTimeout(async () => {
            await ensureContractExists(newInfo);
          }, 4000);
        } else {
          // If job name is cleared, cancel the timeout
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
        }
        return;
      }
    },
    [contractId, ensureContractExists]
  );

  // Autosave logic - exactly like sign-orders
  // Skip autosave when in view mode (forceReadOnly)
  useEffect(() => {
    if (isViewMode) return; // Don't autosave in view mode

    const currentState = { projectInfo, contractId };
    const prevState = prevStateRef.current;

    if (!isEqual(currentState, prevState)) {
      prevStateRef.current = currentState;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(async () => {
        // Check if we have a contractId and some meaningful content to save
        const hasContent = contractId && (
          projectInfo.projectName ||
          projectInfo.contractNumber ||
          projectInfo.customerName ||
          projectInfo.customerJobNumber ||
          projectInfo.projectOwner ||
          projectInfo.etcJobNumber ||
          projectInfo.etcBranch ||
          projectInfo.county ||
          projectInfo.customerPM ||
          projectInfo.customerPMEmail ||
          projectInfo.customerPMPhone ||
          projectInfo.certifiedPayrollContact ||
          projectInfo.certifiedPayrollEmail ||
          projectInfo.certifiedPayrollPhone ||
          projectInfo.customerBillingContact ||
          projectInfo.customerBillingEmail ||
          projectInfo.customerBillingPhone ||
          projectInfo.etcProjectManager ||
          projectInfo.etcBillingManager ||
          projectInfo.etcProjectManagerEmail ||
          projectInfo.etcBillingManagerEmail ||
          projectInfo.projectStartDate ||
          projectInfo.projectEndDate ||
          projectInfo.otherNotes ||
          projectInfo.isCertifiedPayroll !== "none" ||
          projectInfo.shopRate ||
          projectInfo.stateMptBaseRate ||
          projectInfo.stateMptFringeRate ||
          projectInfo.stateFlaggingBaseRate ||
          projectInfo.stateFlaggingFringeRate ||
          projectInfo.federalMptBaseRate ||
          projectInfo.federalMptFringeRate ||
          projectInfo.federalFlaggingBaseRate ||
          projectInfo.federalFlaggingFringeRate ||
          projectInfo.extensionDate
        );

        if (hasContent) {
          try {
            setIsSaving(true);
            const contractData = {
              contractId,
              data: mapProjectInfoToContractData(projectInfo, getContractStatus(contractRow)),
            };
            console.log('Autosave: sending contract data:', contractData);
            const result = await saveContract(contractData);
            console.log('Autosave: received result:', result);
            setContractRow(result);
            setLastSavedAt(new Date());
            setFirstSave(true);
          } catch (error) {
            console.error('Autosave failed:', error);
            toast.error('Failed to save contract');
          } finally {
            setIsSaving(false);
          }
        }
      }, 5000); // Autosave every 5 seconds like sign-orders
    }
  }, [projectInfo, contractId, isViewMode]);

  const manualSave = useCallback(async () => {
    if (!contractId) {
      const hasProjectName = Boolean(projectInfo.projectName?.trim());
      if (!hasProjectName) return;
      await ensureContractExists(projectInfo);
      return;
    }

    try {
      setIsSaving(true);
      const contractData = {
        contractId,
        data: mapProjectInfoToContractData(projectInfo, getContractStatus(contractRow)),
      };
      console.log('Manual save: sending contract data:', contractData);
      const result = await saveContract(contractData);
      console.log('Manual save: received result:', result);
      setContractRow(result);
      setLastSavedAt(new Date());
      setFirstSave(true);
      toast.success('Contract saved successfully');
    } catch (error) {
      console.error('Manual save failed:', error);
      toast.error('Failed to save contract');
    } finally {
      setIsSaving(false);
    }
  }, [contractId, projectInfo, ensureContractExists, contractRow]);

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
      <StickyPageHeader
        backLabel="Contracts"
        onBack={async () => {
          // Cancel any pending contract creation timeout
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
          }
          if (!isViewMode) await manualSave();
          router.push("/l/contracts");
        }}
        rightContent={
          isViewMode ? (
            <Button onClick={() => router.push(`/l/contracts/edit/${contractId}`)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit Contract
            </Button>
          ) : (
            <SaveStatusIndicator
              status={isSaving ? "saving" : lastSavedAt ? "saved" : "idle"}
              lastSavedAt={lastSavedAt}
              onManualSave={manualSave}
              isSaving={isSaving}
            />
          )
        }
      />

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
        <ChecklistHeader title={checklistTitle} description={checklistDescription} />

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
          <SOVTable contractId={contractId} readOnly={isReadOnly} />
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