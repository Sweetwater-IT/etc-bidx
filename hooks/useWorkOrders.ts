import React from 'react';
import { create } from 'zustand';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Types
interface WorkOrder {
  id: string;
  job_id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: string;
  wo_number: string | null;
  assigned_to: string | null;
  customer_poc_phone: string | null;
  contracted_or_additional: string;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
  takeoff_id: string | null;
  parent_work_order_id: string | null;
  is_pickup: boolean;
}

interface BuildRequest {
  id: string;
  work_order_id: string;
  status: string;
  build_required: boolean;
  created_at: string;
  updated_at: string;
}

interface Dispatch {
  id: string;
  work_order_id: string;
  scheduled_date: string;
  status: string;
  crew_notes: string | null;
  customer_not_on_site: boolean;
  customer_signature_name: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkOrderState {
  workOrder: WorkOrder | null;
  isLoading: boolean;
  error: string | null;
  fetchWorkOrder: (workOrderId: string) => Promise<void>;
  updateWorkOrder: (workOrderId: string, patch: Partial<WorkOrder>) => Promise<WorkOrder>;
  deleteWorkOrder: (workOrderId: string) => Promise<{ success: boolean; jobId?: string }>;
}

interface BuildRequestsState {
  buildRequests: BuildRequest[];
  isLoading: boolean;
  error: string | null;
  fetchBuildRequests: (workOrderId: string) => Promise<void>;
  createBuildRequest: (workOrderId: string) => Promise<BuildRequest>;
}

interface DispatchState {
  dispatch: Dispatch | null;
  isLoading: boolean;
  error: string | null;
  fetchDispatch: (workOrderId: string) => Promise<void>;
  createDispatch: (workOrderId: string, scheduledDate: string) => Promise<Dispatch>;
}

interface PickupWorkOrderState {
  isCreating: boolean;
  error: string | null;
  createPickupWorkOrder: (parentWorkOrderId: string) => Promise<{ workOrder: WorkOrder; takeoffId: string }>;
}

// Work Order Store
export const useWorkOrderStore = create<WorkOrderState>((set, get) => ({
  workOrder: null,
  isLoading: false,
  error: null,

  fetchWorkOrder: async (workOrderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("work_orders_l")
        .select("*")
        .eq("id", workOrderId)
        .single();

      if (error) throw error;
      set({ workOrder: data as WorkOrder, isLoading: false });
    } catch (error) {
      console.error("Error fetching work order:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateWorkOrder: async (workOrderId: string, patch: Partial<WorkOrder>) => {
    try {
      const { data, error } = await supabase
        .from("work_orders_l")
        .update(patch)
        .eq("id", workOrderId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set({ workOrder: data as WorkOrder });
      toast.success("Work order updated");
      return data as WorkOrder;
    } catch (error: any) {
      toast.error(`Failed to update work order: ${error.message}`);
      throw error;
    }
  },

  deleteWorkOrder: async (workOrderId: string) => {
    try {
      const { data: workOrder } = await supabase
        .from("work_orders_l")
        .select("job_id")
        .eq("id", workOrderId)
        .single();

      const { error } = await supabase
        .from("work_orders_l")
        .delete()
        .eq("id", workOrderId);

      if (error) throw error;

      set({ workOrder: null });
      toast.success("Work order deleted");
      return { success: true, jobId: workOrder?.job_id };
    } catch (error: any) {
      toast.error(`Failed to delete work order: ${error.message}`);
      throw error;
    }
  },
}));

// Build Requests Store
export const useBuildRequestsStore = create<BuildRequestsState>((set, get) => ({
  buildRequests: [],
  isLoading: false,
  error: null,

  fetchBuildRequests: async (workOrderId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Placeholder - return empty array for now
      set({ buildRequests: [], isLoading: false });
    } catch (error) {
      console.error("Error fetching build requests:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createBuildRequest: async (workOrderId: string) => {
    try {
      // Placeholder implementation - build shop not connected yet
      console.log("Build request creation placeholder for work order:", workOrderId);
      toast.info("Build shop integration coming soon");
      const placeholder: BuildRequest = { id: "placeholder", work_order_id: workOrderId, status: "pending", build_required: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      set({ buildRequests: [placeholder] });
      return placeholder;
    } catch (error: any) {
      toast.error(`Failed to create build request: ${error.message}`);
      throw error;
    }
  },
}));

// Dispatch Store
export const useDispatchStore = create<DispatchState>((set, get) => ({
  dispatch: null,
  isLoading: false,
  error: null,

  fetchDispatch: async (workOrderId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Placeholder - return null for now
      set({ dispatch: null, isLoading: false });
    } catch (error) {
      console.error("Error fetching dispatch:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createDispatch: async (workOrderId: string, scheduledDate: string) => {
    try {
      // Placeholder implementation - dispatch system not connected yet
      console.log("Dispatch creation placeholder for work order:", workOrderId, "on date:", scheduledDate);
      toast.info("Dispatch system integration coming soon");
      const placeholder = {
        id: "placeholder",
        work_order_id: workOrderId,
        scheduled_date: scheduledDate,
        status: "scheduled",
        crew_notes: null,
        customer_not_on_site: false,
        customer_signature_name: null,
        signed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set({ dispatch: placeholder });
      return placeholder;
    } catch (error: any) {
      toast.error(`Failed to create dispatch: ${error.message}`);
      throw error;
    }
  },
}));

// Pickup Work Order Store
export const usePickupWorkOrderStore = create<PickupWorkOrderState>((set, get) => ({
  isCreating: false,
  error: null,

  createPickupWorkOrder: async (parentWorkOrderId: string) => {
    set({ isCreating: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await supabase.functions.invoke("create-pickup-work-order", {
        body: { parentWorkOrderId },
      });

      if (resp.error) {
        const body = resp.data as { error?: string; details?: string; code?: string } | null;
        if (body?.code === "PICKUP_EXISTS") {
          throw new Error(body.details || "Pickup work order already exists");
        }
        throw new Error(body?.details || body?.error || resp.error.message);
      }

      set({ isCreating: false });
      toast.success("Pickup work order created");
      return resp.data as { workOrder: WorkOrder; takeoffId: string };
    } catch (error: any) {
      set({ error: error.message, isCreating: false });
      toast.error(`Failed to create pickup WO: ${error.message}`);
      throw error;
    }
  },
}));

// Hook wrappers to match existing API
export function useWorkOrder(workOrderId: string | undefined) {
  const { workOrder, isLoading, error, fetchWorkOrder } = useWorkOrderStore();

  React.useEffect(() => {
    if (workOrderId && workOrderId !== workOrder?.id) {
      fetchWorkOrder(workOrderId);
    }
  }, [workOrderId, fetchWorkOrder, workOrder?.id]);

  return {
    data: workOrder,
    isLoading,
    error,
    refetch: () => workOrderId ? fetchWorkOrder(workOrderId) : Promise.resolve(),
  };
}

export function useUpdateWorkOrder() {
  const updateWorkOrder = useWorkOrderStore((state) => state.updateWorkOrder);

  return {
    mutateAsync: async ({ workOrderId, patch }: { workOrderId: string; patch: Partial<WorkOrder> }) => {
      return await updateWorkOrder(workOrderId, patch);
    },
  };
}

export function useDeleteWorkOrder() {
  const deleteWorkOrder = useWorkOrderStore((state) => state.deleteWorkOrder);

  return {
    mutateAsync: async (workOrderId: string) => {
      return await deleteWorkOrder(workOrderId);
    },
    deleting: false, // Zustand doesn't track this state the same way
  };
}

export function useCreateBuildRequest() {
  const createBuildRequest = useBuildRequestsStore((state) => state.createBuildRequest);

  return {
    mutateAsync: async ({ workOrderId }: { workOrderId: string }) => {
      return await createBuildRequest(workOrderId);
    },
  };
}

export function useBuildRequestsByWorkOrder(workOrderId: string | undefined) {
  const { buildRequests, isLoading, error, fetchBuildRequests } = useBuildRequestsStore();

  React.useEffect(() => {
    if (workOrderId) {
      fetchBuildRequests(workOrderId);
    }
  }, [workOrderId, fetchBuildRequests]);

  return {
    data: buildRequests,
    isLoading,
    error,
  };
}

export function useCreatePickupWorkOrder() {
  const { createPickupWorkOrder, isCreating } = usePickupWorkOrderStore();

  return {
    mutateAsync: async (parentWorkOrderId: string) => {
      return await createPickupWorkOrder(parentWorkOrderId);
    },
    isPending: isCreating,
  };
}

export function useDispatchByWorkOrder(workOrderId: string | undefined) {
  const { dispatch, isLoading, error, fetchDispatch } = useDispatchStore();

  React.useEffect(() => {
    if (workOrderId) {
      fetchDispatch(workOrderId);
    }
  }, [workOrderId, fetchDispatch]);

  return {
    data: dispatch,
    isLoading,
    error,
  };
}

export function useCreateDispatch() {
  const createDispatch = useDispatchStore((state) => state.createDispatch);

  return {
    mutateAsync: async ({ workOrderId, scheduledDate }: { workOrderId: string; scheduledDate: string }) => {
      return await createDispatch(workOrderId, scheduledDate);
    },
    isPending: false, // Zustand doesn't track this state the same way
  };
}
