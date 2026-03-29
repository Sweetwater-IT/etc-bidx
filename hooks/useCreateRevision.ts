import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useCreateRevision = () => {
  const [creating, setCreating] = useState(false);

  const createRevision = async (takeoffId: string) => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-takeoff-revision", {
        body: { takeoffId },
      });

      if (error) throw error;

      if (data?.takeoffId) {
        toast.success("Revision created successfully");
        return { takeoffId: data.takeoffId };
      } else {
        throw new Error("Failed to create revision");
      }
    } catch (error: any) {
      console.error("Error creating revision:", error);
      toast.error(error.message || "Failed to create revision");
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createRevision, creating };
};