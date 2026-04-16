import { supabase } from "@/lib/supabase";
import { parseJobNotes, stringifyJobNotes } from "@/lib/jobNotes";
import { ActionResult, RecordSummary } from "../types";

type ContractUpdateInput = {
  projectName?: string;
  contractNumber?: string;
  customerName?: string;
  projectOwner?: string;
  county?: string;
  etcBranch?: string;
  etcProjectManager?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  contractStatus?: string;
  billingStatus?: string;
  additionalNotes?: string;
  clientVersion?: number;
};

const REQUIRED_CONTRACT_FIELDS: Array<{ key: string; label: string }> = [
  { key: "project_owner", label: "Project Owner" },
  { key: "project_name", label: "Job Name" },
  { key: "contract_number", label: "Project Owner Contract #" },
  { key: "county", label: "County" },
  { key: "etc_branch", label: "ETC Branch" },
  { key: "etc_project_manager", label: "ETC Project Manager" },
  { key: "project_start_date", label: "Project Start Date" },
  { key: "project_end_date", label: "Project End Date" },
  { key: "customer_name", label: "Customer Name" },
  { key: "customer_job_number", label: "Customer Job #" },
  { key: "customer_pm", label: "Customer PM" },
  { key: "customer_pm_email", label: "Customer PM Email" },
  { key: "certified_payroll_contact", label: "Certified Payroll Contact" },
  { key: "certified_payroll_email", label: "Certified Payroll Email" },
  { key: "certified_payroll_type", label: "Certified Payroll Type" },
];

function missingContractRequirements(contractData: Record<string, unknown>) {
  const certifiedPayrollType = typeof contractData.certified_payroll_type === "string"
    ? contractData.certified_payroll_type.trim()
    : contractData.certified_payroll_type;

  return REQUIRED_CONTRACT_FIELDS.flatMap(({ key, label }) => {
    const value = contractData[key];

    if (key === "certified_payroll_type") {
      return value === "none" || value === "state" || value === "federal" ? [] : [label];
    }

    if ((key === "certified_payroll_contact" || key === "certified_payroll_email") && certifiedPayrollType === "none") {
      return [];
    }

    const normalized = typeof value === "string" ? value.trim() : value;
    if (!normalized) return [label];
    if (key === "project_owner" && normalized === "Other") return [label];
    return [];
  });
}

function contractListQuery() {
  return supabase
    .from("jobs_l")
    .select("id, project_name, contract_number, customer_name, project_owner, contract_status, billing_status, created_at", {
      count: "exact",
    })
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(10);
}

function mapContractRecord(data: Record<string, unknown>) {
  const parsedNotes = parseJobNotes(typeof data.additional_notes === "string" ? data.additional_notes : null);

  return {
    id: data.id,
    projectName: data.project_name ?? null,
    contractNumber: data.contract_number ?? null,
    customerName: data.customer_name ?? null,
    projectOwner: data.project_owner ?? null,
    county: data.county ?? null,
    etcBranch: data.etc_branch ?? null,
    etcProjectManager: data.etc_project_manager ?? null,
    projectStartDate: data.project_start_date ?? null,
    projectEndDate: data.project_end_date ?? null,
    contractStatus: data.contract_status ?? null,
    projectStatus: data.project_status ?? null,
    billingStatus: data.billing_status ?? null,
    version: data.version ?? null,
    additionalNotes: parsedNotes.contractNotes,
  };
}

function contractTargetPath(id: string | number) {
  return `/l/contracts/view/${id}`;
}

export async function searchContracts(params: { search?: string; status?: string }): Promise<ActionResult> {
  try {
    let query = contractListQuery();

    if (params.search?.trim()) {
      const search = params.search.trim();
      query = query.or(
        `project_name.ilike.%${search}%,contract_number.ilike.%${search}%,customer_name.ilike.%${search}%,project_owner.ilike.%${search}%`
      );
    }

    if (params.status?.trim()) {
      query = query.eq("contract_status", params.status.trim());
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const items: RecordSummary[] = (data || []).map((contract) => ({
      id: String(contract.id),
      label: String(contract.contract_number || contract.project_name || `Contract #${contract.id}`),
      secondary: String(contract.project_name || contract.customer_name || ""),
      status: String(contract.contract_status || contract.billing_status || ""),
      targetPath: contractTargetPath(String(contract.id)),
    }));

    return {
      success: true,
      entityType: "contract",
      operation: "search",
      capabilityStatus: "read_only",
      summary: `Found ${count ?? items.length} contracts`,
      data: { items, total: count ?? items.length },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "contract",
      operation: "search",
      capabilityStatus: "read_only",
      summary: "Failed to search contracts",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getContract(id: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("jobs_l")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "contract",
      operation: "get",
      capabilityStatus: "read_only",
      recordId: String(data.id),
      summary: `Loaded ${data.contract_number || data.project_name || `contract #${data.id}`}`,
      targetPath: contractTargetPath(String(data.id)),
      data: mapContractRecord(data),
    };
  } catch (error) {
    return {
      success: false,
      entityType: "contract",
      operation: "get",
      capabilityStatus: "read_only",
      summary: "Failed to load contract",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createContract(_input?: Record<string, unknown>): Promise<ActionResult> {
  return {
    success: false,
    entityType: "contract",
    operation: "create",
    capabilityStatus: "planned_not_executable",
    summary: "Contract creation is planned but not wired yet",
    error: "planned_not_executable",
  };
}

export async function updateContract(id: string, input: ContractUpdateInput): Promise<ActionResult> {
  try {
    const { data: currentContract, error: currentError } = await supabase
      .from("jobs_l")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (currentError) throw currentError;

    if (input.clientVersion !== undefined && input.clientVersion !== currentContract.version) {
      return {
        success: false,
        entityType: "contract",
        operation: "update",
        capabilityStatus: "write_requires_confirmation",
        recordId: String(id),
        summary: "Contract update blocked by version conflict",
        error: `Version conflict detected. Current version is ${currentContract.version}.`,
      };
    }

    const fieldMapping: Record<string, string> = {
      projectName: "project_name",
      contractNumber: "contract_number",
      customerName: "customer_name",
      projectOwner: "project_owner",
      county: "county",
      etcBranch: "etc_branch",
      etcProjectManager: "etc_project_manager",
      projectStartDate: "project_start_date",
      projectEndDate: "project_end_date",
      contractStatus: "contract_status",
      billingStatus: "billing_status",
      additionalNotes: "additional_notes",
    };

    const currentNotesPayload = parseJobNotes(currentContract.additional_notes);
    const updatePayload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (key === "clientVersion") continue;
      const mappedKey = fieldMapping[key];
      if (!mappedKey) continue;
      updatePayload[mappedKey] = value;
    }

    if (Object.prototype.hasOwnProperty.call(updatePayload, "additional_notes")) {
      updatePayload.additional_notes = stringifyJobNotes(
        typeof updatePayload.additional_notes === "string" ? updatePayload.additional_notes : "",
        currentNotesPayload.projectLog,
        currentNotesPayload.contractLog
      );
    }

    const nextContractStatus = updatePayload.contract_status as string | undefined;
    const currentContractStatus = currentContract.contract_status as string | undefined;

    if (
      nextContractStatus &&
      nextContractStatus !== currentContractStatus &&
      nextContractStatus !== "CONTRACT_RECEIPT"
    ) {
      const mergedContract = { ...currentContract, ...updatePayload };
      const missing = missingContractRequirements(mergedContract);
      if (missing.length > 0) {
        return {
          success: false,
          entityType: "contract",
          operation: "update",
          capabilityStatus: "write_requires_confirmation",
          recordId: String(id),
          summary: "Contract update is missing required fields",
          error: `Missing required fields: ${missing.join(", ")}`,
        };
      }
    }

    updatePayload.version = Number(currentContract.version || 0) + 1;

    const { data: updatedContract, error: updateError } = await supabase
      .from("jobs_l")
      .update(updatePayload)
      .eq("id", Number(id))
      .select("id, contract_number, project_name, version")
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      entityType: "contract",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      recordId: String(updatedContract.id),
      summary: `Updated ${updatedContract.contract_number || updatedContract.project_name || `contract #${updatedContract.id}`}`,
      targetPath: contractTargetPath(String(updatedContract.id)),
      data: {
        id: updatedContract.id,
        contractNumber: updatedContract.contract_number,
        projectName: updatedContract.project_name,
        version: updatedContract.version,
      },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "contract",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to update contract",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
