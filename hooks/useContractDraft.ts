import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { create } from "zustand";
import { toast } from "sonner";
import type { JobProjectInfo } from "@/types/job";

type CertifiedPayrollType = "none" | "state" | "federal";

export type SaveStatus = "idle" | "saving" | "saved" | "unsaved" | "error";

interface ContractRow {
  id: string;
  project_name: string;
  contract_number: string | null;
  customer_name: string | null;
  customer_job_number: string | null;
  project_owner: string | null;
  etc_job_number: number | null;
  etc_branch: string | null;
  county: string | null;
  state_route: string | null;
  project_start_date: string | null;
  project_end_date: string | null;
  additional_notes: string | null;
  certified_payroll_type: string;
  shop_rate: string | null;
  state_base_rate: string | null;
  state_fringe_rate: string | null;
  state_flagging_base_rate: string | null;
  state_flagging_fringe_rate: string | null;
  federal_base_rate: string | null;
  federal_fringe_rate: string | null;
  federal_flagging_base_rate: string | null;
  federal_flagging_fringe_rate: string | null;
  contract_status: string;
  project_status: string;
  billing_status: string;
  archived: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  customer_pm: string | null;
  customer_pm_email: string | null;
  customer_pm_phone: string | null;
  certified_payroll_contact: string | null;
  certified_payroll_email: string | null;
  certified_payroll_phone: string | null;
  customer_billing_contact: string | null;
  customer_billing_email: string | null;
  customer_billing_phone: string | null;
  etc_project_manager: string | null;
  etc_billing_manager: string | null;
  etc_project_manager_email: string | null;
  etc_billing_manager_email: string | null;
  extension_date: string | null;
  [key: string]: unknown;
}

function rowToProjectInfo(row: ContractRow): JobProjectInfo {
  return {
    projectName: row.project_name || "",
    contractNumber: row.contract_number || "",
    customerName: row.customer_name || "",
    customerJobNumber: row.customer_job_number || "",
    projectOwner: row.project_owner || "",
    etcJobNumber: row.etc_job_number,
    etcBranch: row.etc_branch || "",
    county: row.county || "",

    customerPM: row.customer_pm || "",
    customerPMEmail: row.customer_pm_email || "",
    customerPMPhone: row.customer_pm_phone || "",
    certifiedPayrollContact: row.certified_payroll_contact || "",
    certifiedPayrollEmail: row.certified_payroll_email || "",
    certifiedPayrollPhone: row.certified_payroll_phone || "",
    customerBillingContact: row.customer_billing_contact || "",
    customerBillingEmail: row.customer_billing_email || "",
    customerBillingPhone: row.customer_billing_phone || "",
    etcProjectManager: row.etc_project_manager || "",
    etcBillingManager: row.etc_billing_manager || "",
    etcProjectManagerEmail: row.etc_project_manager_email || "",
    etcBillingManagerEmail: row.etc_billing_manager_email || "",
    projectStartDate: row.project_start_date || "",
    projectEndDate: row.project_end_date || "",
    otherNotes: row.additional_notes || "",
    isCertifiedPayroll: (row.certified_payroll_type || "none") as CertifiedPayrollType,
    shopRate: row.shop_rate || "",
    stateMptBaseRate: row.state_base_rate || "",
    stateMptFringeRate: row.state_fringe_rate || "",
    stateFlaggingBaseRate: row.state_flagging_base_rate || "",
    stateFlaggingFringeRate: row.state_flagging_fringe_rate || "",
    federalMptBaseRate: row.federal_base_rate || "",
    federalMptFringeRate: row.federal_fringe_rate || "",
    federalFlaggingBaseRate: row.federal_flagging_base_rate || "",
    federalFlaggingFringeRate: row.federal_flagging_fringe_rate || "",
    extensionDate: row.extension_date || "",
  };
}

async function fetchContract(id: string): Promise<ContractRow | null> {
  console.log('[HOOK] fetchContract - Fetching contract:', id);
  const response = await fetch(`/api/l/contracts/${id}`);
  if (!response.ok) {
    const error = await response.json();
    console.error('[HOOK] fetchContract - Error:', error);
    throw new Error(error.error || 'Failed to fetch contract');
  }
  const data = await response.json();
  console.log('[HOOK] fetchContract - Success:', data?.id);
  return data as ContractRow;
}

class ConflictError extends Error {
  latest: ContractRow;
  constructor(msg: string, latest: ContractRow) {
    super(msg);
    this.name = "ConflictError";
    this.latest = latest;
  }
}

class ForbiddenError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ForbiddenError";
  }
}

async function upsertDraft(params: {
  contractId?: string;
  patch: Record<string, unknown>;
  clientVersion?: number;
}) {
  const url = params.contractId
    ? `/api/l/contracts/${params.contractId}`
    : '/api/l/contracts';

  const method = params.contractId ? 'PATCH' : 'POST';

  console.log('[HOOK] upsertDraft - Calling API:', { url, method, contractId: params.contractId, patch: params.patch, clientVersion: params.clientVersion });

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patch: params.patch,
      clientVersion: params.clientVersion,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[HOOK] upsertDraft - API error:', { status: response.status, error });

    if (response.status === 409 && error.code === 'VERSION_CONFLICT' && error.latest) {
      throw new ConflictError(error.error || "Stale update", error.latest);
    }
    if (error.code === "ACCESS_DENIED" || error.error === "Forbidden") {
      throw new ForbiddenError(error.details || "You do not have permission to update this contract");
    }

    throw new Error(error.error || 'Failed to save contract');
  }

  const result = await response.json();
  console.log('[HOOK] upsertDraft - Success:', result.contract?.id);
  return result.contract;
}

const DEBOUNCE_MS = 800;

interface ContractDraftState {
  contractRow: ContractRow | null;
  projectInfo: JobProjectInfo | null;
  isLoading: boolean;
  fetchError: string | null;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  localVersion: number;
  dirtyCount: number;
  hasDirtyFields: boolean;
  dirtyFields: Record<string, unknown>;
  sentFields: Record<string, unknown>;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  inFlightPromise: Promise<unknown> | null;
  isMounted: boolean;

  // Actions
  fetchContractData: (contractId: string) => Promise<void>;
  markDirty: (fieldName: string, value: unknown) => void;
  saveOnBlur: () => Promise<void>;
  manualSave: () => Promise<void>;
  createContract: (initialData: Record<string, unknown>) => Promise<ContractRow>;
  reset: () => void;
}

export const useContractDraftStore = create<ContractDraftState>((set, get) => ({
  contractRow: null,
  projectInfo: null,
  isLoading: false,
  fetchError: null,
  saveStatus: "idle",
  lastSavedAt: null,
  localVersion: 1,
  dirtyCount: 0,
  hasDirtyFields: false,
  dirtyFields: {},
  sentFields: {},
  debounceTimer: null,
  inFlightPromise: null,
  isMounted: true,

  fetchContractData: async (contractId: string) => {
    set({ isLoading: true, fetchError: null });

    try {
      const data = await fetchContract(contractId);
      const projectInfo = data ? rowToProjectInfo(data) : null;
      set({
        contractRow: data,
        projectInfo,
        isLoading: false,
        localVersion: data?.version || 1,
      });
    } catch (error) {
      console.error("Error fetching contract:", error);
      set({
        fetchError: (error as Error).message,
        isLoading: false,
      });
    }
  },

  markDirty: (fieldName: string, value: unknown) => {
    const state = get();
    if (!state.isMounted) return;

    console.log('[STORE] markDirty - Field:', fieldName, 'Value:', value, 'Current dirty fields:', Object.keys(state.dirtyFields));

    const newDirtyFields = { ...state.dirtyFields, [fieldName]: value };
    const dirtyCount = Object.keys(newDirtyFields).length;

    set({
      dirtyFields: newDirtyFields,
      dirtyCount,
      hasDirtyFields: dirtyCount > 0,
    });

    // Clear existing timer
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    // Schedule save
    const timer = setTimeout(() => {
      get().manualSave();
    }, DEBOUNCE_MS);

    set({ debounceTimer: timer, saveStatus: "unsaved" });
  },

  saveOnBlur: async () => {
    const state = get();
    if (Object.keys(state.dirtyFields).length === 0) return;

    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      set({ debounceTimer: null });
    }

    await get().manualSave();
  },

  manualSave: async () => {
    const state = get();
    const fields = { ...state.dirtyFields };
    if (Object.keys(fields).length === 0) return;

    console.log('[STORE] manualSave - Starting save with fields:', Object.keys(fields));

    // Record which fields we're sending
    set({ sentFields: fields, saveStatus: "saving" });

    // Single-flight: wait for any in-flight save to complete first
    if (state.inFlightPromise) {
      try {
        await state.inFlightPromise;
      } catch {
        // Previous save failed, proceed with new one
      }
    }

    const promise = (async () => {
      try {
        const contractId = state.contractRow?.id;
        const result = await upsertDraft({
          contractId,
          patch: fields,
          clientVersion: state.localVersion,
        });

        if (!get().isMounted) return;

        // Only remove fields that were actually sent
        const sent = get().sentFields;
        const remainingDirtyFields = { ...get().dirtyFields };
        for (const key of Object.keys(sent)) {
          if (remainingDirtyFields[key] === sent[key]) {
            delete remainingDirtyFields[key];
          }
        }

        const remainingCount = Object.keys(remainingDirtyFields).length;

        set({
          dirtyFields: remainingDirtyFields,
          sentFields: {},
          dirtyCount: remainingCount,
          hasDirtyFields: remainingCount > 0,
          saveStatus: remainingCount > 0 ? "unsaved" : "saved",
          lastSavedAt: new Date(),
          localVersion: result.version,
          contractRow: result,
          projectInfo: rowToProjectInfo(result),
        });

        // If there are still dirty fields, schedule another save
        if (remainingCount > 0) {
          const timer = setTimeout(() => {
            get().manualSave();
          }, DEBOUNCE_MS);
          set({ debounceTimer: timer });
        }
      } catch (err: any) {
        if (!get().isMounted) return;

        set({ sentFields: {}, saveStatus: "error" });

        if (err instanceof ConflictError) {
          toast.error("This contract was updated elsewhere. Your changes were reloaded.");
          set({
            contractRow: err.latest,
            projectInfo: rowToProjectInfo(err.latest),
            localVersion: err.latest.version,
            dirtyFields: {},
            dirtyCount: 0,
            hasDirtyFields: false,
          });
        } else if (err instanceof ForbiddenError) {
          toast.error(err.message);
        } else {
          toast.error(`Save failed: ${err.message}`);
        }
      }
    })();

    set({ inFlightPromise: promise });

    try {
      await promise;
    } finally {
      set({ inFlightPromise: null });
    }
  },

  createContract: async (initialData: Record<string, unknown>) => {
    set({ saveStatus: "saving" });

    try {
      const result = await upsertDraft({ patch: initialData });
      set({
        saveStatus: "saved",
        lastSavedAt: new Date(),
        localVersion: result.version,
        contractRow: result,
        projectInfo: rowToProjectInfo(result),
      });
      return result;
    } catch (err: any) {
      set({ saveStatus: "error" });
      toast.error(`Create failed: ${err.message}`);
      throw err;
    }
  },

  reset: () => {
    const state = get();
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }
    set({
      contractRow: null,
      projectInfo: null,
      isLoading: false,
      fetchError: null,
      saveStatus: "idle",
      lastSavedAt: null,
      localVersion: 1,
      dirtyCount: 0,
      hasDirtyFields: false,
      dirtyFields: {},
      sentFields: {},
      debounceTimer: null,
      inFlightPromise: null,
      isMounted: true,
    });
  },
}));

export function useContractDraft(contractId: string | undefined) {
  const store = useContractDraftStore();

  // Auto-fetch when contractId changes
  useEffect(() => {
    if (contractId) {
      store.fetchContractData(contractId);
    } else {
      store.reset();
    }
  }, [contractId, store]);

  // Set mounted state
  useEffect(() => {
    useContractDraftStore.setState({ isMounted: true });
    return () => {
      useContractDraftStore.setState({ isMounted: false });
    };
  }, []);

  // Before-unload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (store.hasDirtyFields) {
        // Attempt to flush via sendBeacon for reliability
        if (contractId && navigator.sendBeacon) {
          const payload = JSON.stringify({
            contractId,
            patch: store.dirtyFields,
            clientVersion: store.localVersion,
          });

          const url = contractId
            ? `/api/l/contracts/${contractId}`
            : '/api/l/contracts';
          navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
        }

        // Show browser confirmation dialog
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [contractId, store.hasDirtyFields, store.dirtyFields, store.localVersion]);

  return {
    contractRow: store.contractRow,
    projectInfo: store.projectInfo,
    isLoading: store.isLoading,
    fetchError: store.fetchError,
    saveStatus: store.saveStatus,
    lastSavedAt: store.lastSavedAt,
    isSaving: store.saveStatus === "saving",
    hasDirtyFields: store.hasDirtyFields,
    markDirty: store.markDirty,
    saveOnBlur: store.saveOnBlur,
    manualSave: store.manualSave,
    createContract: store.createContract,
    localVersion: store.localVersion,
  };
}
