import { PATCH as patchAvailableBidRoute } from "@/app/api/bids/[id]/route";
import { POST as postAvailableBidRoute } from "@/app/api/bids/route";
import { PATCH as patchActiveBidRoute } from "@/app/api/active-bids/[id]/route";
import { POST as postActiveBidRoute } from "@/app/api/active-bids/route";
import { supabase } from "@/lib/supabase";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { defaultFlaggingObject } from "@/types/default-objects/defaultFlaggingObject";
import { defaultMPTObject } from "@/types/default-objects/defaultMPTObject";
import { defaultPermanentSignsObject } from "@/types/default-objects/defaultPermanentSignsObject";
import { ActionResult, RecordSummary } from "../types";
import { invokeJsonRoute } from "./route-utils";

const DEFAULT_PAGE_SIZE = 10;

type AvailableBidSearchInput = {
  search?: string;
  county?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

type AvailableBidWriteInput = {
  branch?: string;
  contractNumber?: string;
  county?: string;
  dueDate?: string;
  lettingDate?: string;
  entryDate?: string;
  location?: string;
  owner?: string;
  platform?: string;
  requestor?: string;
  dbePercentage?: number | string;
  stateRoute?: string;
  status?: string;
  noBidReason?: string;
  mpt?: boolean;
  flagging?: boolean;
  permSigns?: boolean;
  equipmentRental?: boolean;
  other?: boolean;
};

type ActiveBidSearchInput = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

type ActiveBidWriteInput = {
  contractNumber?: string;
  estimator?: string;
  owner?: string;
  county?: string;
  location?: string;
  division?: string;
  status?: string;
  notes?: string;
};

function availableBidTargetPath(id: string | number) {
  return `/active-bid/view?bidId=${id}&type=available-job`;
}

function activeBidTargetPath(id: string | number) {
  return `/active-bid/view?bidId=${id}`;
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAvailableBidStatus(status: string | undefined) {
  if (!status) return undefined;
  const normalized = status.trim().toLowerCase();
  if (normalized === "bid") return "Bid";
  if (normalized === "no bid" || normalized === "no-bid" || normalized === "nobid") return "No Bid";
  if (normalized === "unset") return "Unset";
  return status;
}

function normalizeActiveBidStatus(status: string | undefined) {
  if (!status) return undefined;
  const normalized = status.trim().toUpperCase().replace(/\s+/g, "-");
  if (normalized === "WON-PENDING") return "WON";
  return normalized;
}

async function existingBidContracts() {
  const { data } = await supabase.from("bid_estimates").select("contract_number");
  return (data || [])
    .map((item) => item.contract_number)
    .filter((contractNumber): contractNumber is string => Boolean(contractNumber));
}

async function loadCountyByName(countyName: string | undefined) {
  if (!countyName?.trim()) return null;

  const { data, error } = await supabase
    .from("counties")
    .select("*")
    .ilike("name", countyName.trim())
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function actualActiveBidStatuses(bidIds: number[]) {
  if (bidIds.length === 0) return new Map<number, string>();

  const { data } = await supabase
    .from("jobs")
    .select(`
      estimate_id,
      job_numbers!jobs_job_number_id_fkey(job_number)
    `)
    .in("estimate_id", bidIds);

  const statusMap = new Map<number, string>();
  const grouped = new Map<number, Array<{ job_numbers?: { job_number?: string }[] }>>();

  for (const row of data || []) {
    const estimateId = row.estimate_id;
    if (typeof estimateId !== "number") continue;
    const rows = grouped.get(estimateId) || [];
    rows.push(row);
    grouped.set(estimateId, rows);
  }

  for (const [estimateId, jobs] of grouped.entries()) {
    const hasPendingJob = jobs.some((job) =>
      Array.isArray(job.job_numbers) && job.job_numbers.some((entry) => entry?.job_number?.startsWith("P-"))
    );
    statusMap.set(estimateId, hasPendingJob ? "won-pending" : "won");
  }

  return statusMap;
}

function availableBidSummary(row: Record<string, any>): RecordSummary {
  return {
    id: String(row.id),
    label: String(row.contract_number || `Bid ${row.id}`),
    secondary: row.owner || row.location || undefined,
    status: row.status || undefined,
    targetPath: availableBidTargetPath(row.id),
  };
}

function activeBidSummary(row: Record<string, any>, status: string): RecordSummary {
  const contractNumber = row.admin_data?.contractNumber || row.contract_number || `Bid ${row.id}`;
  return {
    id: String(row.id),
    label: String(contractNumber),
    secondary: row.admin_data?.owner || row.contractor_name || undefined,
    status,
    targetPath: activeBidTargetPath(row.id),
  };
}

function mapAvailableBidRecord(row: Record<string, any>) {
  return {
    id: row.id,
    branch: row.branch ?? null,
    contractNumber: row.contract_number ?? null,
    county: row.county ?? null,
    dueDate: row.due_date ?? null,
    lettingDate: row.letting_date ?? null,
    entryDate: row.entry_date ?? null,
    location: row.location ?? null,
    owner: row.owner ?? null,
    platform: row.platform ?? null,
    requestor: row.requestor ?? null,
    dbePercentage: row.dbe_percentage ?? null,
    stateRoute: row.state_route ?? null,
    status: row.status ?? null,
    noBidReason: row.no_bid_reason ?? null,
    mpt: Boolean(row.mpt),
    flagging: Boolean(row.flagging),
    permSigns: Boolean(row.perm_signs),
    equipmentRental: Boolean(row.equipment_rental),
    other: Boolean(row.other),
    archived: Boolean(row.archived),
  };
}

function mapActiveBidRecord(row: Record<string, any>, status: string, notes: unknown[]) {
  return {
    id: row.id,
    contractNumber: row.admin_data?.contractNumber ?? row.contract_number ?? null,
    estimator: row.admin_data?.estimator ?? null,
    division: row.admin_data?.division ?? null,
    owner: row.admin_data?.owner ?? null,
    county: row.admin_data?.county?.name ?? null,
    branch: row.admin_data?.county?.branch ?? null,
    location: row.admin_data?.location ?? null,
    status,
    totalRevenue: row.total_revenue ?? null,
    totalCost: row.total_cost ?? null,
    totalGrossProfit: row.total_gross_profit ?? null,
    notes,
    adminData: row.admin_data ?? null,
  };
}

function buildAvailableBidPayload(input: AvailableBidWriteInput) {
  return {
    branch: input.branch ?? "",
    contract_number: input.contractNumber ?? "",
    county: input.county ?? "",
    due_date: input.dueDate ?? "",
    letting_date: input.lettingDate ?? "",
    entry_date: input.entryDate ?? new Date().toISOString().split("T")[0],
    location: input.location ?? "",
    owner: input.owner ?? "",
    platform: input.platform ?? "",
    requestor: input.requestor ?? "",
    dbe_percentage: toNumber(input.dbePercentage) ?? 0,
    state_route: input.stateRoute ?? null,
    status: normalizeAvailableBidStatus(input.status) ?? "Unset",
    no_bid_reason: input.noBidReason ?? null,
    mpt: Boolean(input.mpt),
    flagging: Boolean(input.flagging),
    perm_signs: Boolean(input.permSigns),
    equipment_rental: Boolean(input.equipmentRental),
    other: Boolean(input.other),
  };
}

export async function searchAvailableBids(params: AvailableBidSearchInput): Promise<ActionResult> {
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
    const start = (page - 1) * pageSize;
    const contractsToExclude = await existingBidContracts();

    let query = supabase
      .from("available_jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .eq("archived", false);

    if (contractsToExclude.length > 0) {
      query = query.not("contract_number", "in", `(${contractsToExclude.join(",")})`);
    }

    if (params.status?.trim()) {
      query = query.eq("status", normalizeAvailableBidStatus(params.status.trim()) ?? params.status.trim());
    }

    if (params.county?.trim()) {
      query = query.ilike("county", params.county.trim());
    }

    if (params.search?.trim()) {
      const search = params.search.trim();
      query = query.or(
        `contract_number.ilike.%${search}%,owner.ilike.%${search}%,county.ilike.%${search}%,location.ilike.%${search}%,requestor.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query.range(start, start + pageSize - 1);
    if (error) throw error;

    const items = (data || []).map(availableBidSummary);

    return {
      success: true,
      entityType: "available_bid",
      operation: "search",
      capabilityStatus: "read_only",
      summary: `Found ${count ?? items.length} available bids`,
      data: { items, total: count ?? items.length, page, pageSize },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "available_bid",
      operation: "search",
      capabilityStatus: "read_only",
      summary: "Failed to search available bids",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAvailableBid(id: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("available_jobs")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "available_bid",
      operation: "get",
      capabilityStatus: "read_only",
      recordId: String(data.id),
      summary: `Loaded ${data.contract_number || `available bid #${data.id}`}`,
      targetPath: availableBidTargetPath(data.id),
      data: mapAvailableBidRecord(data),
    };
  } catch (error) {
    return {
      success: false,
      entityType: "available_bid",
      operation: "get",
      capabilityStatus: "read_only",
      summary: "Failed to load available bid",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createAvailableBid(input: AvailableBidWriteInput): Promise<ActionResult> {
  try {
    const payload = buildAvailableBidPayload(input);
    const response = await invokeJsonRoute<{ data: { id: number; contract_number: string }[] | { id: number; contract_number: string } }>(
      postAvailableBidRoute as unknown as (request: Request) => Promise<Response>,
      "http://local/api/bids",
      "POST",
      payload
    );

    const created = Array.isArray(response.data) ? response.data[0] : response.data;
    const recordId = String(created.id);

    return {
      success: true,
      entityType: "available_bid",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      recordId,
      summary: `Created ${created.contract_number || `available bid #${recordId}`}`,
      targetPath: availableBidTargetPath(recordId),
      data: created,
    };
  } catch (error) {
    return {
      success: false,
      entityType: "available_bid",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to create available bid",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateAvailableBid(id: string, input: AvailableBidWriteInput): Promise<ActionResult> {
  try {
    const payload = buildAvailableBidPayload(input);

    const response = await invokeJsonRoute<{ data: { id: number; contract_number: string } }>(
      patchAvailableBidRoute as unknown as (request: Request, context?: unknown) => Promise<Response>,
      `http://local/api/bids/${id}`,
      "PATCH",
      payload,
      { params: Promise.resolve({ id }) }
    );

    return {
      success: true,
      entityType: "available_bid",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      recordId: id,
      summary: `Updated ${response.data.contract_number || `available bid #${id}`}`,
      targetPath: availableBidTargetPath(id),
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      entityType: "available_bid",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to update available bid",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function searchActiveBids(params: ActiveBidSearchInput): Promise<ActionResult> {
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
    const start = (page - 1) * pageSize;

    let query = supabase
      .from("estimate_complete")
      .select("id, status, contract_number, admin_data, contractor_name, archived, deleted", { count: "exact" })
      .eq("deleted", false)
      .or("archived.is.null,archived.eq.false")
      .order("created_at", { ascending: false });

    if (params.search?.trim()) {
      const search = params.search.trim();
      query = query.or(
        `admin_data->>contractNumber.ilike.%${search}%,admin_data->>owner.ilike.%${search}%,admin_data->county->>name.ilike.%${search}%,admin_data->>estimator.ilike.%${search}%,contractor_name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query.range(start, start + pageSize - 1);
    if (error) throw error;

    const statusOverrides = await actualActiveBidStatuses(
      (data || []).map((row) => row.id).filter((id): id is number => typeof id === "number")
    );

    const filtered = (data || []).map((row) => {
      const actualStatus =
        row.status === "WON"
          ? statusOverrides.get(row.id) || "won"
          : String(row.status || "").toLowerCase();
      return { row, actualStatus };
    });

    const requestedStatus = params.status?.trim().toLowerCase();
    const finalRows = requestedStatus
      ? filtered.filter(({ actualStatus }) => actualStatus === requestedStatus)
      : filtered;

    const items = finalRows.map(({ row, actualStatus }) => activeBidSummary(row, actualStatus));

    return {
      success: true,
      entityType: "active_bid",
      operation: "search",
      capabilityStatus: "read_only",
      summary: `Found ${requestedStatus ? items.length : count ?? items.length} active bids`,
      data: { items, total: requestedStatus ? items.length : count ?? items.length, page, pageSize },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "active_bid",
      operation: "search",
      capabilityStatus: "read_only",
      summary: "Failed to search active bids",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getActiveBid(id: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("estimate_complete")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error) throw error;

    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, text, created_at, user_email")
      .eq("bid_id", Number(id));

    if (notesError) throw notesError;

    const { data: bidNotes } = await supabase
      .from("bid_notes")
      .select("id, text, created_at")
      .eq("bid_id", Number(id));

    const statusOverrides = await actualActiveBidStatuses([Number(id)]);
    const actualStatus =
      data.status === "WON"
        ? statusOverrides.get(Number(id)) || "won"
        : String(data.status || "").toLowerCase();

    const mergedNotes = [...(notes || []), ...(bidNotes || [])];

    return {
      success: true,
      entityType: "active_bid",
      operation: "get",
      capabilityStatus: "read_only",
      recordId: String(data.id),
      summary: `Loaded ${data.admin_data?.contractNumber || `active bid #${data.id}`}`,
      targetPath: activeBidTargetPath(data.id),
      data: mapActiveBidRecord(data, actualStatus, mergedNotes),
    };
  } catch (error) {
    return {
      success: false,
      entityType: "active_bid",
      operation: "get",
      capabilityStatus: "read_only",
      summary: "Failed to load active bid",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createActiveBid(input: ActiveBidWriteInput): Promise<ActionResult> {
  try {
    if (!input.contractNumber?.trim() || !input.county?.trim()) {
      return {
        success: false,
        entityType: "active_bid",
        operation: "create",
        capabilityStatus: "write_requires_confirmation",
        summary: "Active bid creation needs at least a contract number and county",
        error: "Missing required contractNumber or county",
      };
    }

    const county = await loadCountyByName(input.county);
    if (!county) {
      return {
        success: false,
        entityType: "active_bid",
        operation: "create",
        capabilityStatus: "write_requires_confirmation",
        summary: "Could not find that county in the reference data",
        error: `Unknown county: ${input.county}`,
      };
    }

    const adminData = {
      ...defaultAdminObject,
      contractNumber: input.contractNumber.trim(),
      contract_number: input.contractNumber.trim(),
      estimator: input.estimator?.trim() || "",
      division: input.division?.trim().toUpperCase() === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      owner: (input.owner?.trim().toUpperCase() as typeof defaultAdminObject.owner) || "PENNDOT",
      county: {
        country: county.country,
        id: county.id,
        name: county.name,
        district: county.district,
        branch: county.branch,
        laborRate: county.labor_rate,
        fringeRate: county.fringe_rate,
        shopRate: county.shop_rate,
        flaggingRate: county.flagging_rate,
        flaggingBaseRate: county.flagging_base_rate,
        flaggingFringeRate: county.flagging_fringe_rate,
        ratedTargetGM: county.rated_target_gm,
        nonRatedTargetGM: county.non_rated_target_gm,
        insurance: county.insurance,
        fuel: county.fuel,
        market: county.market,
      },
      location: input.location?.trim() || "",
    };

    const response = await invokeJsonRoute<{ data: { id: number } }>(
      postActiveBidRoute as unknown as (request: Request) => Promise<Response>,
      "http://local/api/active-bids",
      "POST",
      {
        data: {
          adminData,
          mptRental: defaultMPTObject,
          equipmentRental: [],
          flagging: defaultFlaggingObject,
          serviceWork: defaultFlaggingObject,
          saleItems: [],
          permanentSigns: defaultPermanentSignsObject,
          status: normalizeActiveBidStatus(input.status) === "PENDING" ? "PENDING" : "DRAFT",
          notes: [],
        },
      }
    );

    const recordId = String(response.data.id);
    return {
      success: true,
      entityType: "active_bid",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      recordId,
      summary: `Created active bid ${input.contractNumber.trim()}`,
      targetPath: activeBidTargetPath(recordId),
      data: { id: response.data.id, contractNumber: input.contractNumber.trim() },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "active_bid",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to create active bid",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateActiveBid(id: string, input: ActiveBidWriteInput): Promise<ActionResult> {
  try {
    const payload: Record<string, unknown> = {};
    const normalizedStatus = normalizeActiveBidStatus(input.status);

    if (normalizedStatus) payload.status = normalizedStatus;
    if (input.notes !== undefined) {
      payload.notes = input.notes
        ? [{ text: input.notes, timestamp: Date.now(), user_email: "chat@local" }]
        : [];
    }

    if (Object.keys(payload).length === 0) {
      return {
        success: false,
        entityType: "active_bid",
        operation: "update",
        capabilityStatus: "write_requires_confirmation",
        recordId: id,
        summary: "Active bid chat updates currently support status and notes",
        error: "No supported active bid update fields were provided",
      };
    }

    await invokeJsonRoute(
      patchActiveBidRoute as unknown as (request: Request, context?: unknown) => Promise<Response>,
      `http://local/api/active-bids/${id}`,
      "PATCH",
      payload,
      { params: Promise.resolve({ id }) }
    );

    const refreshed = await getActiveBid(id);
    if (!refreshed.success) {
      return {
        success: true,
        entityType: "active_bid",
        operation: "update",
        capabilityStatus: "write_requires_confirmation",
        recordId: id,
        summary: `Updated active bid ${id}`,
        targetPath: activeBidTargetPath(id),
        data: { id: Number(id) },
      };
    }

    return {
      success: true,
      entityType: "active_bid",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      recordId: id,
      summary: `Updated ${refreshed.data?.contractNumber || `active bid #${id}`}`,
      targetPath: activeBidTargetPath(id),
      data: refreshed.data,
    };
  } catch (error) {
    return {
      success: false,
      entityType: "active_bid",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to update active bid",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
