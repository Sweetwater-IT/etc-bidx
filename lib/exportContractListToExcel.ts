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

function escapeCsvValue(value: string | null | undefined) {
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

export async function exportContractListToExcel(
  contracts: ContractListItem[],
  label: "received" | "sent" | "signed"
) {
  const headers = [
    "Status",
    "ETC Job Number",
    "Project Name",
    "Contract Number",
    "Customer",
    "Owner",
    "County",
    "Branch",
    "Project Manager",
    "Project Start Date",
    "Project End Date",
    "Created At",
  ];

  const rows = contracts.map((contract) => [
    contract.contractStatus ? CONTRACT_STATUS_LABELS[contract.contractStatus] : "",
    contract.etcJobNumber || "",
    contract.projectName || "",
    contract.contractNumber || "",
    contract.customerName || "",
    contract.projectOwner || "",
    contract.county || "",
    contract.etcBranch || "",
    contract.etcProjectManager || "",
    contract.projectStartDate || "",
    contract.projectEndDate || "",
    contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("en-US") : "",
  ]);

  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const timestamp = new Date().toISOString().split("T")[0];
  downloadCsv(csvContent, `contracts_${label}_${timestamp}.csv`);
}
