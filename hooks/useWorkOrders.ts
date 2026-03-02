import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

// Hook to fetch a single work order
export function useWorkOrder(workOrderId: string | undefined) {
  return useQuery({
    queryKey: ["work-order", workOrderId],
    queryFn: async () => {
      if (!workOrderId) return null;

      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", workOrderId)
        .single();

      if (error) throw error;
      return data as WorkOrder;
    },
    enabled: !!workOrderId,
  });
}

// Hook to update a work order
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workOrderId, patch }: { workOrderId: string; patch: Partial<WorkOrder> }) => {
      const { data, error } = await supabase
        .from("work_orders")
        .update(patch)
        .eq("id", workOrderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["work-order", data.id] });
      queryClient.invalidateQueries({ queryKey: ["work-orders", data.job_id] });
      toast.success("Work order updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update work order: ${error.message}`);
    },
  });
}

// Hook to delete a work order
export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workOrderId: string) => {
      const { data: workOrder } = await supabase
        .from("work_orders")
        .select("job_id")
        .eq("id", workOrderId)
        .single();

      const { error } = await supabase
        .from("work_orders")
        .delete()
        .eq("id", workOrderId);

      if (error) throw error;
      return { success: true, jobId: workOrder?.job_id };
    },
    onSuccess: (data) => {
      if (data.jobId) {
        queryClient.invalidateQueries({ queryKey: ["work-orders", data.jobId] });
      }
      toast.success("Work order deleted");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete work order: ${error.message}`);
    },
  });
}

// Hook to create build request (placeholder - not hooked up)
export function useCreateBuildRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workOrderId }: { workOrderId: string }) => {
      // Placeholder implementation - build shop not connected yet
      console.log("Build request creation placeholder for work order:", workOrderId);
      toast.info("Build shop integration coming soon");
      return { id: "placeholder", workOrderId, status: "pending" };
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ["build-requests"] });
    },
  });
}

// Hook to fetch build requests by work order (placeholder)
export function useBuildRequestsByWorkOrder(workOrderId: string | undefined) {
  return useQuery({
    queryKey: ["build-requests", workOrderId],
    queryFn: async () => {
      // Placeholder - return empty array for now
      return [] as BuildRequest[];
    },
    enabled: !!workOrderId,
  });
}

// Hook to create pickup work order
export function useCreatePickupWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (parentWorkOrderId: string) => {
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

      return resp.data as { workOrder: WorkOrder; takeoffId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["work-orders", data.workOrder.job_id] });
      queryClient.invalidateQueries({ queryKey: ["work-order", data.workOrder.parent_work_order_id] });
      toast.success("Pickup work order created");
    },
    onError: (err: Error) => {
      toast.error(`Failed to create pickup WO: ${err.message}`);
    },
  });
}

// Hook to fetch dispatch by work order (placeholder)
export function useDispatchByWorkOrder(workOrderId: string | undefined) {
  return useQuery({
    queryKey: ["dispatch", workOrderId],
    queryFn: async () => {
      // Placeholder - return null for now
      return null as Dispatch | null;
    },
    enabled: !!workOrderId,
  });
}

// Hook to create dispatch (placeholder)
export function useCreateDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workOrderId, scheduledDate }: { workOrderId: string; scheduledDate: string }) => {
      // Placeholder implementation - dispatch system not connected yet
      console.log("Dispatch creation placeholder for work order:", workOrderId, "on date:", scheduledDate);
      toast.info("Dispatch system integration coming soon");
      return {
        id: "placeholder",
        workOrderId,
        scheduledDate,
        status: "scheduled"
      };
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}