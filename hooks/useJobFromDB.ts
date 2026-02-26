import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Job, JobFromDB, JobProjectInfo } from "@/types/job";

export function useJobFromDB(id: string | undefined) {
  return useQuery({
    queryKey: ["job-detail", id],
    queryFn: async (): Promise<JobFromDB | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("jobs_l")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching job:", error);
        return null;
      }

      if (!data) return null;

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

      return {
        projectInfo,
        ...job,
      };
    },
    enabled: !!id,
  });
}