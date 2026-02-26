import React from 'react';
import { create } from 'zustand';

interface JobRow {
  id: string;
  project_name: string;
  contract_number: string | null;
  customer_name: string | null;
  customer_job_number: string | null;
  project_owner: string | null;
  etc_job_number: string | null;
  etc_branch: string | null;
  county: string | null;
  state_route: string | null;
  project_start_date: string | null;
  project_end_date: string | null;
  contract_status: string;
  project_status: string;
  billing_status: string;
  archived: boolean;
  created_at: string;
  etc_project_manager: string | null;
  etc_billing_manager: string | null;
  certified_payroll_type: string;
}

interface DisplayJob {
  id: string;
  projectName: string;
  contractNumber: string;
  customerName: string;
  projectOwner: string;
  etcJobNumber: string;
  etcBranch: string;
  county: string;
  etcProjectManager: string;
  projectStartDate: string;
  projectEndDate: string;
  contractStatus: string;
  projectStatus: string;
  billingStatus: string;
  archived: boolean;
  createdAt: string;
}

interface JobsListState {
  jobs: DisplayJob[];
  isLoading: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
}

function toDisplayJob(row: JobRow): DisplayJob {
  return {
    id: row.id,
    projectName: row.project_name || "",
    contractNumber: row.contract_number || "",
    customerName: row.customer_name || "",
    projectOwner: row.project_owner || "",
    etcJobNumber: row.etc_job_number || "",
    etcBranch: row.etc_branch || "",
    county: row.county || "",
    etcProjectManager: row.etc_project_manager || "",
    projectStartDate: row.project_start_date || "",
    projectEndDate: row.project_end_date || "",
    contractStatus: row.contract_status,
    projectStatus: row.project_status,
    billingStatus: row.billing_status,
    archived: row.archived,
    createdAt: row.created_at,
  };
}

export const useJobsListStore = create<JobsListState>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,

  fetchJobs: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/l/jobs');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch jobs');
      }

      const data = await response.json();
      const displayJobs = (data as JobRow[]).map(toDisplayJob);
      set({ jobs: displayJobs, isLoading: false });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  }
}));

export function useJobsList() {
  const { jobs, isLoading, error, fetchJobs } = useJobsListStore();

  // Auto-fetch when component mounts
  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    refetch: fetchJobs
  };
}