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
import { Lock, Pencil, StickyNote } from "lucide-react";
import type { JobProjectInfo } from "@/types/job";
import { ChecklistHeader } from "@/app/l/components/ChecklistHeader";
import { ProjectInfoFields } from "@/app/l/components/ProjectInfoFields";
import { SOVTable, type SOVTableHandle } from "@/components/SOVTable";
import { QuoteNotes, type Note } from "@/components/pages/quote-form/QuoteNotes";
import { ContractSaveDocument } from "@/app/l/components/ContractSaveDocument";
import { ChangeOrderGateDialog } from "@/app/l/components/ChangeOrderGateDialog";
import { saveContract } from "@/lib/api-client";
import isEqual from "lodash/isEqual";
import { NewRecordStickyPageHeader } from "@/app/l/components/NewRecordStickyPageHeader";
import { useAuth } from "@/contexts/auth-context";


type DocumentCategory = "contract" | "addendum" | "permit" | "insurance" | "change_order" | "plan" | "specification" | "correspondence" | "photo" | "other";

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

const composeName = (firstName?: string | null, lastName?: string | null, fallback?: string | null) => {
  const combined = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ").trim();
  return combined || fallback || "";
};

const splitNameParts = (fullName?: string | null) => {
  const trimmed = fullName?.trim() || "";
  if (!trimmed) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
};

const emptyProjectInfo: JobProjectInfo = {
  projectName: "",
  contractNumber: "",
  customerName: "",
  customerJobNumber: "",
  projectOwner: "",
  etcJobNumber: null,
  etcBranch: "",
  county: "",
  stateRoute: "",
  customerPM: "",
  customerPMFirstName: "",
  customerPMLastName: "",
  customerPMEmail: "",
  customerPMPhone: "",
  certifiedPayrollContact: "",
  certifiedPayrollContactFirstName: "",
  certifiedPayrollContactLastName: "",
  certifiedPayrollEmail: "",
  certifiedPayrollPhone: "",
  customerBillingContact: "",
  customerBillingContactFirstName: "",
  customerBillingContactLastName: "",
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

const CONTRACT_ACTION_BUTTON_CLASS = "bg-[#16335A] text-white hover:bg-[#122947]";

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
  state_route: projectInfo.stateRoute,
  customer_pm: composeName(projectInfo.customerPMFirstName, projectInfo.customerPMLastName, projectInfo.customerPM),
  customer_pm_first_name: projectInfo.customerPMFirstName,
  customer_pm_last_name: projectInfo.customerPMLastName,
  customer_pm_email: projectInfo.customerPMEmail,
  customer_pm_phone: projectInfo.customerPMPhone,
  certified_payroll_contact: composeName(
    projectInfo.certifiedPayrollContactFirstName,
    projectInfo.certifiedPayrollContactLastName,
    projectInfo.certifiedPayrollContact
  ),
  certified_payroll_contact_first_name: projectInfo.certifiedPayrollContactFirstName,
  certified_payroll_contact_last_name: projectInfo.certifiedPayrollContactLastName,
  certified_payroll_email: projectInfo.certifiedPayrollEmail,
  certified_payroll_phone: projectInfo.certifiedPayrollPhone,
  customer_billing_contact: composeName(
    projectInfo.customerBillingContactFirstName,
    projectInfo.customerBillingContactLastName,
    projectInfo.customerBillingContact
  ),
  customer_billing_contact_first_name: projectInfo.customerBillingContactFirstName,
  customer_billing_contact_last_name: projectInfo.customerBillingContactLastName,
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
  const { user } = useAuth();
  const params = useParams();
  const routeId = params?.id as string;
  const isNew = !routeId || routeId === "new";

  const [contractId, setContractId] = useState<string | undefined>(isNew ? undefined : routeId);
  const [contractRow, setContractRow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [firstSave, setFirstSave] = useState<boolean>(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const sovTableRef = useRef<SOVTableHandle | null>(null);

  // Signed-contract status
  const isSigned = contractRow ? SIGNED_STATUSES.includes(getContractStatus(contractRow)) : false;
  const isReadOnly = forceReadOnly;

  // Change order gate state
  const [changeOrderApproved, setChangeOrderApproved] = useState(false);
  const [showChangeOrderDialog, setShowChangeOrderDialog] = useState(false);

  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [pendingDocumentDeleteId, setPendingDocumentDeleteId] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [projectInfo, setProjectInfo] = useState<JobProjectInfo>(emptyProjectInfo);
  const [hydrated, setHydrated] = useState(isNew);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [contractNotes, setContractNotes] = useState<Note[]>([]);
  const [contractNotesLoading, setContractNotesLoading] = useState(false);
  const buildContractData = useCallback((info: JobProjectInfo) => {
    const nextData = mapProjectInfoToContractData(info, getContractStatus(contractRow));
    delete (nextData as { additional_notes?: string }).additional_notes;
    return nextData;
  }, [contractRow]);
  const handleSovEditAttempt = useCallback(() => {
    setShowChangeOrderDialog(true);
  }, []);
  const hasAssignedProjectManager = Boolean(projectInfo.etcProjectManager?.trim());

  // Check if we're in view mode (forceReadOnly is true and contract exists)
  const isViewMode = forceReadOnly && contractId;
  const jobIdentifier = projectInfo.etcJobNumber?.toString() || (projectInfo.projectName?.trim() || "Untitled Project");
  const checklistTitle = isViewMode
    ? `Contract for ${jobIdentifier}`
    : "Contract";
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

  const hasMeaningfulContent = useCallback((info: JobProjectInfo, id?: string) => {
    return Boolean(id && (
      info.projectName ||
      info.contractNumber ||
      info.customerName ||
      info.customerJobNumber ||
      info.projectOwner ||
      info.etcJobNumber ||
      info.etcBranch ||
      info.county ||
      info.customerPM ||
      info.customerPMEmail ||
      info.customerPMPhone ||
      info.certifiedPayrollContact ||
      info.certifiedPayrollEmail ||
      info.certifiedPayrollPhone ||
      info.customerBillingContact ||
      info.customerBillingEmail ||
      info.customerBillingPhone ||
      info.etcProjectManager ||
      info.etcBillingManager ||
      info.etcProjectManagerEmail ||
      info.etcBillingManagerEmail ||
      info.projectStartDate ||
      info.projectEndDate ||
      info.otherNotes ||
      info.isCertifiedPayroll !== "none" ||
      info.shopRate ||
      info.stateMptBaseRate ||
      info.stateMptFringeRate ||
      info.stateFlaggingBaseRate ||
      info.stateFlaggingFringeRate ||
      info.federalMptBaseRate ||
      info.federalMptFringeRate ||
      info.federalFlaggingBaseRate ||
      info.federalFlaggingFringeRate ||
      info.extensionDate
    ));
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!contractId || !isSigned) {
      setChangeOrderApproved(false);
      return;
    }

    let cancelled = false;

    const fetchChangeOrderState = async () => {
      try {
        const response = await fetch(`/api/l/contracts/${contractId}/change-orders`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch change orders: ${response.status}`);
        }
        const result = await response.json();
        if (!cancelled) {
          setChangeOrderApproved(!!result?.hasApprovedChangeOrder);
        }
      } catch (error) {
        console.error('Error loading change order state:', error);
        if (!cancelled) setChangeOrderApproved(false);
      }
    };

    fetchChangeOrderState();

    return () => {
      cancelled = true;
    };
  }, [contractId, isSigned]);

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
            stateRoute: contract.state_route || "",
            customerPM: contract.customer_pm || "",
            customerPMFirstName: contract.customer_pm_first_name || splitNameParts(contract.customer_pm).firstName,
            customerPMLastName: contract.customer_pm_last_name || splitNameParts(contract.customer_pm).lastName,
            customerPMEmail: contract.customer_pm_email || "",
            customerPMPhone: contract.customer_pm_phone || "",
            certifiedPayrollContact: contract.certified_payroll_contact || "",
            certifiedPayrollContactFirstName: contract.certified_payroll_contact_first_name || splitNameParts(contract.certified_payroll_contact).firstName,
            certifiedPayrollContactLastName: contract.certified_payroll_contact_last_name || splitNameParts(contract.certified_payroll_contact).lastName,
            certifiedPayrollEmail: contract.certified_payroll_email || "",
            certifiedPayrollPhone: contract.certified_payroll_phone || "",
            customerBillingContact: contract.customer_billing_contact || "",
            customerBillingContactFirstName: contract.customer_billing_contact_first_name || splitNameParts(contract.customer_billing_contact).firstName,
            customerBillingContactLastName: contract.customer_billing_contact_last_name || splitNameParts(contract.customer_billing_contact).lastName,
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

  useEffect(() => {
    if (!contractId) {
      setContractNotes([]);
      return;
    }

    const fetchContractNotes = async () => {
      setContractNotesLoading(true);
      try {
        const response = await fetch(`/api/l/contracts/${contractId}/notes`);
        if (!response.ok) throw new Error("Failed to fetch notes");
        const notes = await response.json();
        setContractNotes(Array.isArray(notes) ? notes : []);
      } catch (error) {
        console.error("Error fetching contract notes:", error);
        setContractNotes([]);
      } finally {
        setContractNotesLoading(false);
      }
    };

    fetchContractNotes();
  }, [contractId]);

  const ensureContractExists = useCallback(async (info: JobProjectInfo) => {
    if (contractId) return contractId;
    if (creatingRef.current) return creatingRef.current;

    const trimmedProjectName = info.projectName?.trim();
    const trimmedProjectManager = info.etcProjectManager?.trim();
    if (!trimmedProjectName || !trimmedProjectManager) return undefined;

    const promise = (async () => {
      try {
        const contractData = {
          contractId: undefined,
          data: mapProjectInfoToContractData({
            ...info,
            projectName: trimmedProjectName,
          }, getContractStatus(contractRow)),
        };
        delete (contractData.data as { additional_notes?: string }).additional_notes;
        const result = await saveContract(contractData);
        const newId = result.id;
        setContractId(newId);
        setContractRow(result);
        setLastSavedAt(new Date());
        setFirstSave(true);
        // Update URL without full page reload for better UX
        window.history.replaceState(null, '', `/l/contracts/edit/${newId}`);
        return newId;
      } catch {
        return undefined;
      } finally {
        creatingRef.current = null;
      }
    })();

    creatingRef.current = promise;
    return promise;
  }, [contractId, contractRow]);

  const handleProjectNameBlur = useCallback(async () => {
    if (isReadOnly || contractId) return;
    const trimmedProjectName = projectInfo.projectName?.trim();
    if (!trimmedProjectName) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    try {
      setIsSaving(true);
      await ensureContractExists(projectInfo);
    } finally {
      setIsSaving(false);
    }
  }, [isReadOnly, contractId, projectInfo, ensureContractExists]);

  useEffect(() => {
    if (isReadOnly || isViewMode || contractId) return;
    if (!projectInfo.projectName?.trim() || !hasAssignedProjectManager) return;

    let cancelled = false;

    const ensureDraftAfterPmAssignment = async () => {
      try {
        setIsSaving(true);
        await ensureContractExists(projectInfo);
      } finally {
        if (!cancelled) {
          setIsSaving(false);
        }
      }
    };

    ensureDraftAfterPmAssignment();

    return () => {
      cancelled = true;
    };
  }, [
    isReadOnly,
    isViewMode,
    contractId,
    projectInfo,
    hasAssignedProjectManager,
    ensureContractExists,
  ]);

  const handleProjectInfoChange = useCallback(
    async (newInfo: JobProjectInfo) => {
      setProjectInfo(newInfo);

      if (!contractId) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        return;
      }
    },
    [contractId]
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
        if (hasMeaningfulContent(projectInfo, contractId) && hasAssignedProjectManager) {
          try {
            setIsSaving(true);
            const contractData = {
              contractId,
              data: buildContractData(projectInfo),
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
      }, 5000); // Autosave every 5 seconds like sign orders
    }
  }, [projectInfo, contractId, isViewMode, hasMeaningfulContent, contractRow, hasAssignedProjectManager, buildContractData]);

  useEffect(() => {
    if (isViewMode) return;

    const handlePageLeave = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const shouldSend =
        hasAssignedProjectManager && (
          hasMeaningfulContent(projectInfo, contractId) ||
          (!contractId && Boolean(projectInfo.projectName?.trim()))
        );

      if (!shouldSend) return;

      const payload = {
        contractId,
        data: buildContractData(projectInfo),
      };
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/api/l/contracts", blob);
    };

    window.addEventListener("beforeunload", handlePageLeave);
    window.addEventListener("pagehide", handlePageLeave);

    return () => {
      window.removeEventListener("beforeunload", handlePageLeave);
      window.removeEventListener("pagehide", handlePageLeave);
    };
  }, [isViewMode, hasMeaningfulContent, projectInfo, contractId, contractRow]);

  const manualSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    await sovTableRef.current?.flushPendingSave();

    let currentContractId = contractId;

    if (!projectInfo.etcProjectManager?.trim()) {
      setShowValidation(true);
      toast.error('Assign an ETC Project Manager before saving this contract');
      return null;
    }

    if (!currentContractId) {
      const hasProjectName = Boolean(projectInfo.projectName?.trim());
      if (!hasProjectName) return null;
      currentContractId = await ensureContractExists(projectInfo);
      if (!currentContractId) return null;
    }

    try {
      setIsSaving(true);
      const contractData = {
        contractId: currentContractId,
        data: buildContractData(projectInfo),
      };
      console.log('Manual save: sending contract data:', contractData);
      const result = await saveContract(contractData);
      console.log('Manual save: received result:', result);
      setContractRow(result);
      setLastSavedAt(new Date());
      setFirstSave(true);
      toast.success('Contract saved successfully');
      return currentContractId;
    } catch (error) {
      console.error('Manual save failed:', error);
      toast.error('Failed to save contract');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [contractId, projectInfo, ensureContractExists, buildContractData]);

  const handleAddContractNote = useCallback(async (note: Note) => {
    let currentContractId = contractId;

    if (!currentContractId) {
      const hasProjectName = Boolean(projectInfo.projectName?.trim());
      if (!hasProjectName) return;
      currentContractId = await ensureContractExists(projectInfo);
      if (!currentContractId) return;
    }

    try {
      setIsSavingNotes(true);
      const response = await fetch(`/api/l/contracts/${currentContractId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: {
            ...note,
            user_email: user?.email || note.user_email,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      const savedNote = await response.json();
      setContractNotes((prev) => [...prev, savedNote]);
      toast.success("Note added");
    } catch (error) {
      console.error("Error adding contract note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsSavingNotes(false);
    }
  }, [contractId, projectInfo, ensureContractExists, user?.email]);

  const handleEditContractNote = useCallback(async (index: number, updatedNote: Note) => {
    if (!contractId || !contractNotes[index]?.id) return;
    try {
      setIsSavingNotes(true);
      const response = await fetch(`/api/l/contracts/${contractId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contractNotes[index].id,
          text: updatedNote.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      const savedNote = await response.json();
      setContractNotes((prev) => prev.map((note, noteIndex) => (noteIndex === index ? savedNote : note)));
      toast.success("Note updated");
    } catch (error) {
      console.error("Error updating contract note:", error);
      toast.error("Failed to update note");
    } finally {
      setIsSavingNotes(false);
    }
  }, [contractId, contractNotes]);

  const handleDeleteContractNote = useCallback(async (index: number) => {
    if (!contractId || !contractNotes[index]?.id) return;
    try {
      setIsSavingNotes(true);
      const response = await fetch(`/api/l/contracts/${contractId}/notes?id=${encodeURIComponent(String(contractNotes[index].id))}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setContractNotes((prev) => prev.filter((_, noteIndex) => noteIndex !== index));
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting contract note:", error);
      toast.error("Failed to delete note");
    } finally {
      setIsSavingNotes(false);
    }
  }, [contractId, contractNotes]);

  const handleDone = useCallback(async () => {
    const savedContractId = await manualSave();
    if (savedContractId) {
      router.push(`/l/contracts/view/${savedContractId}`);
    }
  }, [manualSave, router]);

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

  const requestRemoveDocument = (id: string) => {
    setPendingDocumentDeleteId(id);
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

  // Change order handlers
  const handleChangeOrderApproved = async (method: "document" | "admin_approval", details: {
    coNumber?: string;
    description?: string;
    amount?: number;
    documentFile?: File;
    approverName?: string;
  }): Promise<boolean> => {
    if (!contractId) {
      toast.error("Contract must be saved first");
      return false;
    }

    try {
      // Create change order record
      const coData = {
        coNumber: details.coNumber || `CO-AUTO-${Date.now()}`,
        description: details.description || "SOV modification on signed contract",
        amount: details.amount || 0,
        status: "approved",
        submittedDate: new Date().toISOString().split("T")[0],
        approvedDate: new Date().toISOString().split("T")[0],
      };

      // Handle document upload if provided
      if (method === "document" && details.documentFile) {
        const formData = new FormData();
        formData.append('coNumber', coData.coNumber);
        formData.append('description', coData.description);
        formData.append('amount', coData.amount.toString());
        formData.append('status', coData.status);
        formData.append('submittedDate', coData.submittedDate);
        formData.append('approvedDate', coData.approvedDate);
        formData.append('documentFile', details.documentFile);

        const response = await fetch(`/api/l/contracts/${contractId}/change-orders`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create change order: ${error.error}`);
        }

        const result = await response.json();
        if (result.document) {
          setDocuments((prev) => {
            const exists = prev.some((doc) => doc.id === result.document.id);
            return exists ? prev : [...prev, result.document];
          });
        }
      } else {
        // Admin approval - just create the record
        const response = await fetch(`/api/l/contracts/${contractId}/change-orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create change order: ${error.error}`);
        }
      }

      // Set approval state and close dialog
      setChangeOrderApproved(true);
      setShowChangeOrderDialog(false);
      toast.success("Change order approved. SOV editing is now enabled.");
      return true;
    } catch (error: any) {
      console.error('Error creating change order:', error);
      toast.error(error.message || 'Failed to create change order');
      return false;
    }
  };

  const handleChangeOrderCancel = () => {
    setShowChangeOrderDialog(false);
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading contract…</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 bg-slate-50">
      <NewRecordStickyPageHeader
        backLabel="Contracts"
        onBack={async () => {
          // Cancel any pending contract creation timeout
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
          }
          if (!isViewMode && hasAssignedProjectManager && hasMeaningfulContent(projectInfo, contractId)) {
            await manualSave();
          }
          router.push("/l/contracts");
        }}
        onDone={handleDone}
        doneLabel={isNew ? "Create Contract" : "Save Contract"}
        saveStatusLabel="Contract"
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        hasUnsavedChanges={!lastSavedAt && firstSave}
        firstSave={firstSave}
        doneButtonClassName={CONTRACT_ACTION_BUTTON_CLASS}
        doneDisabled={!hasAssignedProjectManager}
        additionalButtons={
          isViewMode ? (
            <Button onClick={() => router.push(`/l/contracts/edit/${contractId}`)} className={`gap-2 ${CONTRACT_ACTION_BUTTON_CLASS}`}>
              <Pencil className="h-4 w-4" />
              Edit Contract
            </Button>
          ) : undefined
        }
      />

      {/* Signed contract info banner */}
      {isSigned && (
        <div className="mx-auto max-w-7xl min-w-0 px-4 pt-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-primary font-medium">
              This contract is signed. Customer and ETC job number are locked. Other admin fields remain editable. SOV changes require a Change Order.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl min-w-0 px-4 py-8 sm:py-12 space-y-8">
        <ChecklistHeader title={checklistTitle} description={checklistDescription} />

        {/* Admin Info — always editable */}
        <ProjectInfoFields
          projectInfo={projectInfo}
          onChange={handleProjectInfoChange}
          onProjectNameBlur={handleProjectNameBlur}
          contractSigned={isSigned}
          showValidation={showValidation}
          readOnly={isReadOnly}
          contractRow={contractRow}
          hideNotesSection
        />

        {/* Schedule of Values */}
        <div className="min-w-0">
          <SOVTable
            ref={sovTableRef}
            contractId={contractId}
            readOnly={false}
            onEditAttempt={isSigned && !changeOrderApproved ? handleSovEditAttempt : undefined}
            isSignedContract={isSigned}
            changeOrderApproved={changeOrderApproved}
          />
          {isSigned && !changeOrderApproved && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
              <p className="text-xs text-warning font-medium">
                This contract is signed. SOV changes require a Change Order.
              </p>
            </div>
          )}
          {isSigned && changeOrderApproved && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-xs text-green-800 font-medium">
                ✓ Change Order approved. SOV editing is now enabled.
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
          onRemoveDocument={requestRemoveDocument}
          onUpdateCategory={handleUpdateDocumentCategory}
          readOnly={forceReadOnly}
        />

        <QuoteNotes
          title="Additional Notes"
          notes={contractNotes}
          loading={contractNotesLoading}
          onSave={handleAddContractNote}
          onEdit={handleEditContractNote}
          onDelete={handleDeleteContractNote}
          submitLabel="Save"
          updateLabel="Save"
          actionAlignment="right"
          addButtonClassName="h-7 bg-[#16335A] px-2.5 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-[#122947]"
          submitButtonClassName="bg-[#16335A] text-white hover:bg-[#122947]"
          containerClassName="bg-card"
          addButtonInHeader
          headerContent={
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-violet-500/10 p-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Additional Notes
                </span>
              </div>
            </div>
          }
          emptyState={
            <div className="text-xs italic text-muted-foreground">
              No notes yet. Use &quot;Add Note&quot; to get started.
            </div>
          }
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

      {/* Change Order Gate Dialog */}
      <ChangeOrderGateDialog
        open={showChangeOrderDialog}
        onOpenChange={setShowChangeOrderDialog}
        jobId={contractId || ""}
        onApproved={handleChangeOrderApproved}
        onCancel={handleChangeOrderCancel}
      />

      <Dialog open={!!pendingDocumentDeleteId} onOpenChange={(open) => {
        if (!open) setPendingDocumentDeleteId(null);
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Document?</DialogTitle>
            <DialogDescription>
              This will permanently remove the selected contract document.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDocumentDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (pendingDocumentDeleteId) {
                  await handleRemoveDocument(pendingDocumentDeleteId);
                }
                setPendingDocumentDeleteId(null);
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ContractChecklist;
