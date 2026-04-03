import type { ContractListItem, ContractPipelineStatus } from "@/types/contract";

const CONTRACT_STATUS_LABELS: Record<ContractPipelineStatus, string> = {
  CONTRACT_RECEIPT: "Received",
  RETURNED_TO_CUSTOMER: "Sent",
  CONTRACT_SIGNED: "Signed",
  SOURCE_OF_SUPPLY: "Source of Supply",
  SUBMITTED_FOR_APPROVAL: "Submitted for Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function escapeCsvValue(value: string | number | null | undefined) {
  const normalized = value ?? "";
  const escaped = String(normalized).replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function exportContractListToExcel(contracts: ContractListItem[]) {
  const headers = [
    "Contract Pipeline Status",
    "Project Name",
    "Contract Number",
    "Customer Name",
    "Customer Job Number",
    "Project Owner",
    "ETC Job Number",
    "ETC Branch",
    "County",
    "State Route",
    "ETC Project Manager",
    "ETC Project Manager Email",
    "ETC Billing Manager",
    "ETC Billing Manager Email",
    "Project Start Date",
    "Project End Date",
    "Project Status",
    "Billing Status",
    "Certified Payroll Type",
    "Shop Rate",
    "State Base Rate",
    "State Fringe Rate",
    "State Flagging Base Rate",
    "State Flagging Fringe Rate",
    "Federal Base Rate",
    "Federal Fringe Rate",
    "Federal Flagging Base Rate",
    "Federal Flagging Fringe Rate",
    "Customer PM",
    "Customer PM First Name",
    "Customer PM Last Name",
    "Customer PM Email",
    "Customer PM Phone",
    "Certified Payroll Contact",
    "Certified Payroll Contact First Name",
    "Certified Payroll Contact Last Name",
    "Certified Payroll Email",
    "Certified Payroll Phone",
    "Customer Billing Contact",
    "Customer Billing Contact First Name",
    "Customer Billing Contact Last Name",
    "Customer Billing Email",
    "Customer Billing Phone",
    "Additional Notes",
    "Extension Date",
    "Internal ID",
    "Created At",
    "Submitted For Approval At",
    "Submitted For Approval By",
    "Approved At",
    "Approved By",
    "Approval Notes",
    "Rejected At",
    "Rejected By",
    "Rejection Reason",
    "Rejection Notes",
    "Version",
  ];

  const rows = contracts.map((contract) => {
    const row = contract as ContractListItem & Record<string, string | number | null | undefined>;
    return [
      contract.contractStatus ? CONTRACT_STATUS_LABELS[contract.contractStatus] : "",
      contract.projectName || "",
      contract.contractNumber || "",
      contract.customerName || "",
      row.customerJobNumber || "",
      contract.projectOwner || "",
      contract.etcJobNumber || "",
      contract.etcBranch || "",
      contract.county || "",
      row.stateRoute || "",
      contract.etcProjectManager || "",
      row.etcProjectManagerEmail || "",
      row.etcBillingManager || "",
      row.etcBillingManagerEmail || "",
      contract.projectStartDate || "",
      contract.projectEndDate || "",
      contract.projectStatus || "",
      contract.billingStatus || "",
      row.certifiedPayrollType || "",
      row.shopRate || "",
      row.stateBaseRate || "",
      row.stateFringeRate || "",
      row.stateFlaggingBaseRate || "",
      row.stateFlaggingFringeRate || "",
      row.federalBaseRate || "",
      row.federalFringeRate || "",
      row.federalFlaggingBaseRate || "",
      row.federalFlaggingFringeRate || "",
      row.customerPm || "",
      row.customerPmFirstName || "",
      row.customerPmLastName || "",
      row.customerPmEmail || "",
      row.customerPmPhone || "",
      row.certifiedPayrollContact || "",
      row.certifiedPayrollContactFirstName || "",
      row.certifiedPayrollContactLastName || "",
      row.certifiedPayrollEmail || "",
      row.certifiedPayrollPhone || "",
      row.customerBillingContact || "",
      row.customerBillingContactFirstName || "",
      row.customerBillingContactLastName || "",
      row.customerBillingEmail || "",
      row.customerBillingPhone || "",
      row.additionalNotes || "",
      row.extensionDate || "",
      row.internalId || "",
      contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("en-US") : "",
      contract.submittedForApprovalAt || "",
      contract.submittedForApprovalBy || "",
      contract.approvedAt || "",
      contract.approvedBy || "",
      contract.approvalNotes || "",
      contract.rejectedAt || "",
      contract.rejectedBy || "",
      contract.rejectionReason || "",
      contract.rejectionNotes || "",
      row.version || contract.version || "",
    ];
  });

  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const timestamp = new Date().toISOString().split("T")[0];
  downloadCsv(csvContent, `contracts_all_${timestamp}.csv`);
}