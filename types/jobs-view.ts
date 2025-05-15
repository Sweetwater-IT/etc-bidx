// types/job-view.types.ts
import { Database } from "./database.types";
import { EstimateCompleteView } from "./estimate-view";

export interface JobCompleteView {
  // Job-specific fields
  id: number;
  billing_status: Database['public']['Enums']['project_status'];
  project_status: Database['public']['Enums']['project_status'];
  overdays: number;
  notes: string | null;
  bid_number: string | null;
  certified_payroll: Database['public']['Enums']['certified_payroll_status'];
  created_at: string;
  archived: boolean;
  
  // Job number fields
  job_number: string;
  branch_code: string;
  owner_type: string;
  job_year: number;
  sequential_number: number;
  
  // Estimate data (extending from EstimateCompleteView)
  estimate_id: number;
  estimate_status: Database['public']['Enums']['bid_estimate_status'];
  total_revenue: number;
  total_cost: number;
  total_gross_profit: number;
  estimate_created_at: string;
  
  // All the estimate fields from EstimateCompleteView
  admin_data: EstimateCompleteView['admin_data'];
  mpt_rental: EstimateCompleteView['mpt_rental'];
  equipment_rental: EstimateCompleteView['equipment_rental'];
  flagging: EstimateCompleteView['flagging'];
  service_work: EstimateCompleteView['service_work'];
  sale_items: EstimateCompleteView['sale_items'];
  
  // Project metadata
  project_manager: string | null;
  pm_email: string | null;
  pm_phone: string | null;
  customer_contract_number: string | null;
  contractor_name: string | null;
  subcontractor_name: string | null;
  
  // Summary fields
  total_phases: number;
  total_days: number;
  total_hours: number;
  
  // Job summary JSON object
  job_summary: {
    jobNumber: string;
    contractNumber: string;
    estimator: string;
    owner: string;
    county: {
      name: string;
      branch: string;
    };
    branch: string;
    startDate: string | null;
    endDate: string | null;
    projectDays: number;
    totalHours: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    jobStatus: Database['public']['Enums']['project_status'];
    billingStatus: Database['public']['Enums']['project_status'];
    certifiedPayroll: Database['public']['Enums']['certified_payroll_status'];
    overdays: number;
  };
}

// Simplified type for job lists/grids
export interface JobGridView {
  id: number;
  billing_status: Database['public']['Enums']['project_status'];
  project_status: Database['public']['Enums']['project_status'];
  overdays: number;
  bid_number: string | null;
  certified_payroll: Database['public']['Enums']['certified_payroll_status'];
  created_at: string;
  archived: boolean;
  job_number: string;
  branch_code: string;
  owner_type: string;
  contract_number: string;
  estimator: string;
  letting_date: string | null;
  owner: string;
  county: string;
  branch: string;
  start_date: string | null;
  end_date: string | null;
  project_days: number;
  total_hours: number;
  total_revenue: number;
  total_cost: number;
  total_gross_profit: number;
  contractor: string | null;
  subcontractor: string | null;
  project_manager: string | null;
  gross_margin_percent: number;
}