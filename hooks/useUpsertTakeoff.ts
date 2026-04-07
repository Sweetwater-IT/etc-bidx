import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TakeoffItem {
  productName: string;
  category: string;
  unit: string;
  quantity: number;
  requisitionType: string;
  notes: string;
  material?: string;
}

interface UpsertTakeoffParams {
  takeoffId?: string;
  jobId: string;
  patch: {
    title: string;
    workType: string;
    notes?: string;
    crewNotes?: string;
    buildShopNotes?: string;
    installDate?: string | null;
    pickupDate?: string | null;
    neededByDate?: string | null;
    defaultSignMaterial?: string;
    priority?: string;
    contractedOrAdditional?: string;
    sovItemId?: string | null;
  };
  items: TakeoffItem[];
}

export const useUpsertTakeoff = () => {
  const [saving, setSaving] = useState(false);

  const upsert = async (params: UpsertTakeoffParams) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("upsert-takeoff", {
        body: params,
      });

      if (error) throw error;

      if (data?.takeoff) {
        return { takeoff: data.takeoff };
      } else {
        throw new Error("Failed to upsert takeoff");
      }
    } catch (error: any) {
      console.error("Error upserting takeoff:", error);
      toast.error(error.message || "Failed to save takeoff");
      return null;
    } finally {
      setSaving(false);
    }
  };

  return { upsert, saving };
};