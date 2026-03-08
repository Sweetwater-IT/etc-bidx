import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
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
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as ContractRow;
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated — please sign in");

  const resp = await supabase.functions.invoke("upsert-contract-draft", {
    body: params,
  });

  // Extract structured error from edge function response
  if (resp.error) {
    const body = resp.data as {
      error?: string;
      details?: string;
      message?: string;
      latest?: ContractRow;
      code?: string;
    } | null;

    if (import.meta.env.DEV) {
      console.error("[upsert-contract-draft] Error response:", { errorMsg: resp.error.message, body });
    }

    if (body?.error === "conflict" && body.latest) {
      throw new ConflictError(body.message || "Stale update", body.latest);
    }
    if (body?.code === "ACCESS_DENIED" || body?.error === "Forbidden") {
      throw new ForbiddenError(body.details || "You do not have permission to update this contract");
    }
    const detail = body?.details || body?.message || body?.error || resp.error.message;
    throw new Error(`${detail}${body?.code ? ` [${body.code}]` : ""}`);
  }

  const result = resp.data as {
    contract?: ContractRow;
    error?: string;
    details?: string;
    message?: string;
    latest?: ContractRow;
    code?: string;
  };

  if (result.error === "conflict") {
    throw new ConflictError(result.message || "Stale update", result.latest!);
  }
  if (result.code === "ACCESS_DENIED" || result.error === "Forbidden") {
    throw new ForbiddenError(result.details || result.error || "Access denied");
  }
  if (result.error) {
    throw new Error(`${result.details || result.error}${result.code ? ` [${result.code}]` : ""}`);
  }
  return result.contract!;
}

const DEBOUNCE_MS = 800;

export function useContractDraft(contractId: string | undefined) {
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [localVersion, setLocalVersion] = useState<number>(1);
  // Use a ref to always have the latest version in closures (prevents stale closure 409s)
  const localVersionRef = useRef<number>(1);
  const [dirtyCount, setDirtyCount] = useState(0);
  const dirtyFieldsRef = useRef<Record<string, unknown>>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  // Single-flight mutex: prevents overlapping saves
  const inFlightRef = useRef<Promise<unknown> | null>(null);
  // Ref to scheduleSave so onSuccess can trigger re-save without stale closure
  const scheduleSaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Query: fetch contract from DB
  const {
    data: contractRow,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => fetchContract(contractId!),
    enabled: !!contractId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // Update local version when server data arrives
  useEffect(() => {
    if (contractRow?.version) {
      setLocalVersion(contractRow.version);
      localVersionRef.current = contractRow.version;
    }
  }, [contractRow?.version]);

  // Mutation
  // Track which fields were sent in the last save so onSuccess only clears those
  const sentFieldsRef = useRef<Record<string, unknown>>({});

  const mutation = useMutation({
    mutationFn: upsertDraft,
    onSuccess: (data) => {
      if (!isMountedRef.current) return;
      // Only remove fields that were actually sent — preserve any new dirty fields added during the save
      const sent = sentFieldsRef.current;
      for (const key of Object.keys(sent)) {
        if (dirtyFieldsRef.current[key] === sent[key]) {
          delete dirtyFieldsRef.current[key];
        }
      }
      sentFieldsRef.current = {};
      const remainingCount = Object.keys(dirtyFieldsRef.current).length;
      setDirtyCount(remainingCount);
      setSaveStatus(remainingCount > 0 ? "unsaved" : "saved");
      setLastSavedAt(new Date());
      setLocalVersion(data.version);
      localVersionRef.current = data.version;
      queryClient.setQueryData(["contract", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["contracts-list"] });
      // If there are still dirty fields, schedule another save
      if (remainingCount > 0) {
        scheduleSaveRef.current?.();
      }
    },
    onError: (err) => {
      if (!isMountedRef.current) return;
      sentFieldsRef.current = {};
      setSaveStatus("error");
      if (err instanceof ConflictError) {
        toast.error("This contract was updated elsewhere. Your changes were reloaded.");
        queryClient.setQueryData(["contract", contractId], err.latest);
        setLocalVersion(err.latest.version);
        localVersionRef.current = err.latest.version;
        dirtyFieldsRef.current = {};
        setDirtyCount(0);
      } else if (err instanceof ForbiddenError) {
        toast.error(err.message);
      } else {
        toast.error(`Save failed: ${err.message}`);
      }
    },
  });

  const flushSave = useCallback(async () => {
    const fields = { ...dirtyFieldsRef.current };
    if (Object.keys(fields).length === 0) return;

    // Record which fields we're sending so onSuccess only clears these
    sentFieldsRef.current = fields;
    setSaveStatus("saving");

    // Single-flight: wait for any in-flight save to complete first
    if (inFlightRef.current) {
      try {
        await inFlightRef.current;
      } catch {
        // Previous save failed, proceed with new one
      }
      // Re-snapshot fields after waiting (may have new dirty fields)
      const freshFields = { ...dirtyFieldsRef.current };
      if (Object.keys(freshFields).length === 0) return;
      sentFieldsRef.current = freshFields;
    }

    // Always read the latest version from ref (not stale closure state)
    const promise = mutation.mutateAsync({
      contractId,
      patch: sentFieldsRef.current,
      clientVersion: localVersionRef.current,
    });

    inFlightRef.current = promise;

    try {
      await promise;
    } catch {
      // Error handled by mutation.onError
    } finally {
      inFlightRef.current = null;
    }
  }, [contractId, mutation]);

  const scheduleSave = useCallback(() => {
    if (!contractId) return;
    setSaveStatus("unsaved");
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      flushSave();
    }, DEBOUNCE_MS);
  }, [contractId, flushSave]);

  // Keep ref in sync so onSuccess can trigger re-save
  scheduleSaveRef.current = scheduleSave;

  // Mark a field as dirty and schedule autosave
  const markDirty = useCallback(
    (fieldName: string, value: unknown) => {
      dirtyFieldsRef.current[fieldName] = value;
      setDirtyCount(Object.keys(dirtyFieldsRef.current).length);
      scheduleSave();
    },
    [scheduleSave]
  );

  // Blur handler: immediate save — returns Promise so callers can await
  const saveOnBlur = useCallback(async () => {
    if (Object.keys(dirtyFieldsRef.current).length === 0) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    await flushSave();
  }, [flushSave]);

  // Manual save — returns a Promise so callers can await it
  const manualSave = useCallback(async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (Object.keys(dirtyFieldsRef.current).length === 0) {
      return;
    }
    await flushSave();
  }, [flushSave]);

  // ── Before-unload flush protection ──
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(dirtyFieldsRef.current).length === 0) return;

      // Attempt to flush via sendBeacon for reliability
      if (contractId && navigator.sendBeacon) {
        const payload = JSON.stringify({
          contractId,
          patch: { ...dirtyFieldsRef.current },
          clientVersion: localVersionRef.current,
        });

        // sendBeacon to the edge function — best-effort
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upsert-contract-draft`;
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      }

      // Show browser confirmation dialog
      e.preventDefault();
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [contractId]);

  // Create new contract
  const createContract = useCallback(
    async (initialData: Record<string, unknown>) => {
      setSaveStatus("saving");
      try {
        const result = await upsertDraft({ patch: initialData });
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        setLocalVersion(result.version);
        queryClient.setQueryData(["contract", result.id], result);
        queryClient.invalidateQueries({ queryKey: ["contracts-list"] });
        return result;
      } catch (err: any) {
        setSaveStatus("error");
        toast.error(`Create failed: ${err.message}`);
        throw err;
      }
    },
    [queryClient]
  );

  const hasDirtyFields = dirtyCount > 0;

  const projectInfo = useMemo(
    () => (contractRow ? rowToProjectInfo(contractRow) : null),
    [contractRow]
  );

  return {
    contractRow,
    projectInfo,
    isLoading,
    fetchError,
    saveStatus,
    lastSavedAt,
    isSaving: mutation.isPending,
    hasDirtyFields,
    markDirty,
    saveOnBlur,
    manualSave,
    createContract,
    localVersion,
  };
}