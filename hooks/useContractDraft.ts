import { useState, useCallback, useEffect } from "react";
import { create } from "zustand";
import { toast } from "sonner";
import type { JobProjectInfo } from "@/types/job";

type CertifiedPayrollType = "none" | "state" | "federal";

export type SaveStatus = "idle" | "saving" | "saved" | "unsaved" | "error";

interface ContractRow {
  id: string;
  projectName: string;
  contract_status: string;
  // other fields
}

interface ContractState {
  contractRow: ContractRow | null;
  projectInfo: JobProjectInfo | null;
  dirtyFields: Record<string, unknown>;
  saveStatus: SaveStatus;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

const useContractStore = create<ContractState & {
  setContractRow: (row: ContractRow | null) => void;
  setProjectInfo: (info: JobProjectInfo | null) => void;
  setDirtyFields: (fields: Record<string, unknown>) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;
}>((set) => ({
  contractRow: null,
  projectInfo: null,
  dirtyFields: {},
  saveStatus: "idle",
  isSaving: false,
  lastSavedAt: null,
  setContractRow: (row) => set({ contractRow: row }),
  setProjectInfo: (info) => set({ projectInfo: info }),
  setDirtyFields: (fields) => set({ dirtyFields: fields }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setLastSavedAt: (date) => set({ lastSavedAt: date }),
}));

async function upsertDraft(params: { contractId?: string; data: Record<string, unknown> }) {
  const url = '/api/l/contracts';
  const method = 'POST';

  console.log('[HOOK] upsertDraft', { url, method, params });

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Save failed:', error);
    throw new Error(error.error || 'Failed to save contract');
  }

  return response.json();
}

export const useContractDraft = (contractId?: string) => {
  const {
    contractRow,
    projectInfo,
    dirtyFields,
    saveStatus,
    isSaving,
    lastSavedAt,
    setContractRow,
    setProjectInfo,
    setDirtyFields,
    setSaveStatus,
    setIsSaving,
    setLastSavedAt,
  } = useContractStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contractId) {
      fetchContractData(contractId);
    }
  }, [contractId]);

  const fetchContractData = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/l/contracts/${id}`);
      if (response.ok) {
        const data = await response.json();
        setContractRow(data.contract);
        setProjectInfo(data.projectInfo);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markDirty = useCallback((field: string, value: unknown) => {
    setDirtyFields({ ...dirtyFields, [field]: value });
    setSaveStatus("unsaved");
  }, [dirtyFields, setDirtyFields, setSaveStatus]);

  const manualSave = useCallback(async () => {
    if (!dirtyFields || Object.keys(dirtyFields).length === 0) return;

    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const result = await upsertDraft({ contractId, data: dirtyFields });
      setContractRow(result.contract);
      setProjectInfo(result.projectInfo);
      setDirtyFields({});
      setSaveStatus("saved");
      setIsSaving(false);
      setLastSavedAt(new Date());
      toast.success("Contract saved successfully");
    } catch (err) {
      setSaveStatus("error");
      setIsSaving(false);
      toast.error(`Save failed: ${(err as Error).message}`);
    }
  }, [contractId, dirtyFields, setContractRow, setProjectInfo, setDirtyFields, setSaveStatus, setIsSaving]);

  const createContract = useCallback(async (initialData: Record<string, unknown>) => {
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const result = await upsertDraft({ data: initialData });
      setContractRow(result.contract);
      setProjectInfo(result.projectInfo);
      setSaveStatus("saved");
      setIsSaving(false);
      setLastSavedAt(new Date());
      return result.contract.id;
    } catch (err) {
      setSaveStatus("error");
      setIsSaving(false);
      toast.error(`Create failed: ${(err as Error).message}`);
      throw err;
    }
  }, [setContractRow, setProjectInfo, setSaveStatus, setIsSaving]);

  const reset = useCallback(() => {
    setContractRow(null);
    setProjectInfo(null);
    setDirtyFields({});
    setSaveStatus("idle");
    setIsSaving(false);
  }, [setContractRow, setProjectInfo, setDirtyFields, setSaveStatus, setIsSaving]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(dirtyFields).length > 0) {
        const payload = JSON.stringify({ data: dirtyFields });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`/api/l/contracts/${contractId}`, blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyFields, contractId]);

  return {
    contractRow,
    projectInfo,
    dirtyFields,
    saveStatus,
    isSaving,
    isLoading,
    lastSavedAt,
    hasDirtyFields: Object.keys(dirtyFields).length > 0,
    markDirty,
    manualSave,
    createContract,
    reset,
  };
};
