export interface ScheduleOfValuesItem {
  id: string;
  description: string;
  itemNumber: string;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
  retainageAmount: number;
  retainageType: 'percent' | 'amount';
  retainageValue: number;
  uom: string;
  notes?: string;
}

export interface Job {
  id: string;
  created_by: string | null;
  assigned_pm: string | null;
  assigned_billing: string | null;
  project_name: string | null;
  contract_number: string | null;
  customer_name: string | null;
  customer_job_number: string | null;
  project_owner: string | null;
  etc_job_number: number | null;
  etc_branch: string | null;
  county: string | null;
  state_route: string | null;
  contract_status: string | null;
  project_status: string | null;
  billing_status: string | null;
  certified_payroll_type: string | null;
  shop_rate: number | null;
  state_base_rate: number | null;
  state_fringe_rate: number | null;
  federal_base_rate: number | null;
  federal_fringe_rate: number | null;
  project_start_date: string | null;
  project_end_date: string | null;
  additional_notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  customer_id: number | null;
  version: number;
  state_flagging_base_rate: number | null;
  state_flagging_fringe_rate: number | null;
  federal_flagging_base_rate: number | null;
  federal_flagging_fringe_rate: number | null;
  etc_project_manager: string | null;
  etc_billing_manager: string | null;
  etc_project_manager_email: string | null;
  etc_billing_manager_email: string | null;
  customer_pm: string | null;
  customer_pm_email: string | null;
  customer_pm_phone: string | null;
  certified_payroll_contact: string | null;
  certified_payroll_email: string | null;
  certified_payroll_phone: string | null;
  customer_billing_contact: string | null;
  customer_billing_email: string | null;
  customer_billing_phone: string | null;
  sov_items: ScheduleOfValuesItem[] | null;
  approver_pm_user_id: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approval_notes: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  rejection_notes: string | null;
  submitted_for_approval_at: string | null;
  submitted_for_approval_by: string | null;
  extension_date: string | null;
}

export interface JobProjectInfo {
  projectName: string | null;
  etcJobNumber: number | null;
  customerName: string | null;
  customerJobNumber: string | null;
  customerPM: string | null;
  customerPMEmail: string | null;
  customerPMPhone: string | null;
  projectOwner: string | null;
  contractNumber: string | null;
  county: string | null;
  projectStartDate: string | null;
  projectEndDate: string | null;
  extensionDate: string | null;
  otherNotes: string | null;
}

export interface JobFromDB {
  projectInfo: JobProjectInfo;
  [key: string]: any;
}