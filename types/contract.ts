export type ContractPipelineStatus =
  | "CONTRACT_RECEIPT"
  | "RETURNED_TO_CUSTOMER"
  | "CONTRACT_SIGNED"
  | "SOURCE_OF_SUPPLY"
  | "SUBMITTED_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export interface ContractListItem {
  id: string;
  projectName: string | null;
  contractNumber: string | null;
  customerName: string | null;
  projectOwner: string | null;
  etcJobNumber: number | null;
  etcBranch: string | null;
  county: string | null;
  etcProjectManager: string | null;
  projectStartDate: string | null;
  projectEndDate: string | null;
  contractStatus: ContractPipelineStatus | null;
  projectStatus: string | null;
  billingStatus: string | null;
  archived: boolean;
  createdAt: string;
  version: number;
  approverPmUserId: string | null;
  submittedForApprovalAt: string | null;
  submittedForApprovalBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvalNotes: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  rejectionNotes: string | null;
}

export function mapRowToListItem(row: any): ContractListItem {
  return {
    id: row.id,
    projectName: row.project_name,
    contractNumber: row.contract_number,
    customerName: row.customer_name,
    projectOwner: row.project_owner,
    etcJobNumber: row.etc_job_number,
    etcBranch: row.etc_branch,
    county: row.county,
    etcProjectManager: row.etc_project_manager,
    projectStartDate: row.project_start_date,
    projectEndDate: row.project_end_date,
    contractStatus: row.contract_status,
    projectStatus: row.project_status,
    billingStatus: row.billing_status,
    archived: row.archived,
    createdAt: row.created_at,
    version: row.version,
    approverPmUserId: row.approver_pm_user_id,
    submittedForApprovalAt: row.submitted_for_approval_at,
    submittedForApprovalBy: row.submitted_for_approval_by,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    approvalNotes: row.approval_notes,
    rejectedAt: row.rejected_at,
    rejectedBy: row.rejected_by,
    rejectionReason: row.rejection_reason,
    rejectionNotes: row.rejection_notes,
  };
}