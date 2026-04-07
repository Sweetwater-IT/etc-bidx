import React from 'react';
import { create } from 'zustand';
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
      const response = await fetch(`/api/l/jobs/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching job:", errorText);
        set({ error: `Failed to fetch job: ${response.status}`, isLoading: false });
        return;
      }

      const data = await response.json();

      if (!data) {
        set({ data: null, isLoading: false });
        return;
      }

      // Transform the database job into the expected format
      const job: Job = data;

      const projectInfo: JobProjectInfo = {
        projectName: job.project_name,
        etcJobNumber: job.etc_job_number,
        etcBranch: job.etc_branch,
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
        isCertifiedPayroll: (job.certified_payroll_type || "none") as "none" | "state" | "federal",
        shopRate: job.shop_rate?.toString() || null,
        stateMptBaseRate: job.state_base_rate?.toString() || null,
        stateMptFringeRate: job.state_fringe_rate?.toString() || null,
        stateFlaggingBaseRate: job.state_flagging_base_rate?.toString() || null,
        stateFlaggingFringeRate: job.state_flagging_fringe_rate?.toString() || null,
        federalMptBaseRate: job.federal_base_rate?.toString() || null,
        federalMptFringeRate: job.federal_fringe_rate?.toString() || null,
        federalFlaggingBaseRate: job.federal_flagging_base_rate?.toString() || null,
        federalFlaggingFringeRate: job.federal_flagging_fringe_rate?.toString() || null,
        etcProjectManager: job.etc_project_manager,
        etcBillingManager: job.etc_billing_manager,
        etcProjectManagerEmail: job.etc_project_manager_email,
        etcBillingManagerEmail: job.etc_billing_manager_email,
        certifiedPayrollContact: job.certified_payroll_contact,
        certifiedPayrollEmail: job.certified_payroll_email,
        certifiedPayrollPhone: job.certified_payroll_phone,
        customerBillingContact: job.customer_billing_contact,
        customerBillingEmail: job.customer_billing_email,
        customerBillingPhone: job.customer_billing_phone,
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
