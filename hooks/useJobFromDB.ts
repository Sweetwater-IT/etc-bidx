import React from 'react';
import { create } from 'zustand';
import { supabase } from "@/lib/supabase";
import type { Job, JobFromDB, JobProjectInfo } from "@/types/job";

interface JobState {
  data: JobFromDB | null;
  isLoading: boolean;
  error: string | null;
  fetchJob: (id: string) => Promise<void>;
}

export const useJobStore = create<JobState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchJob: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("jobs_l")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching job:", error);
        set({ error: error.message, isLoading: false });
        return;
      }

      if (!data) {
        set({ data: null, isLoading: false });
        return;
      }

      // Transform the database job into the expected format
      const job: Job = data;

      const projectInfo: JobProjectInfo = {
        projectName: job.project_name,
        etcJobNumber: job.etc_job_number,
        customerName: job.customer_name,
        customerJobNumber: job.customer_job_number,
        customerPM: job.customer_pm,
        customerPMEmail: job.customer_pm_email,
        customerPMPhone: job.customer_pm_phone,
        projectOwner: job.project_owner,
        contractNumber: job.contract_number,
        county: job.county,
        projectStartDate: job.project_start_date,
        projectEndDate: job.project_end_date,
        extensionDate: job.extension_date,
        otherNotes: job.additional_notes,
      };

      const jobFromDB: JobFromDB = {
        projectInfo,
        ...job,
      };

      set({ data: jobFromDB, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  }
}));

export function useJobFromDB(id: string | undefined) {
  const { data, isLoading, error, fetchJob } = useJobStore();

  // Auto-fetch when id changes
  React.useEffect(() => {
    if (id) {
      fetchJob(id);
    } else {
      useJobStore.setState({ data: null, isLoading: false, error: null });
    }
  }, [id, fetchJob]);

  return {
    data,
    isLoading,
    error,
    refetch: () => id && fetchJob(id)
  };
}
