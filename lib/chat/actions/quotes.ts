import { PATCH as patchQuoteRoute, POST as postQuoteRoute } from "@/app/api/quotes/route";
import { POST as postSignOrderRoute } from "@/app/api/sign-orders/route";
import { supabase } from "@/lib/supabase";
import { ActionResult, RecordSummary } from "../types";
import { invokeJsonRoute } from "./route-utils";

const DEFAULT_PAGE_SIZE = 10;

type QuoteSearchInput = {
  search?: string;
  status?: string;
  createdBy?: string;
  page?: number;
  pageSize?: number;
};

type QuoteWriteInput = {
  estimateId?: string;
  jobId?: string;
  customerId?: string;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  county?: string;
  township?: string;
  stateRoute?: string;
  subject?: string;
  body?: string;
  fromEmail?: string;
  typeQuote?: string;
  status?: string;
  notes?: string;
  paymentTerms?: string;
  etcJobNumber?: string;
  customerJobNumber?: string;
  contactId?: string;
};

type SignOrderSearchInput = {
  search?: string;
  status?: string;
  branch?: string;
  page?: number;
  pageSize?: number;
};

type SignOrderWriteInput = {
  contractorId?: string;
  contractNumber?: string;
  requestor?: string;
  branch?: string;
  orderDate?: string;
  needDate?: string;
  startDate?: string;
  endDate?: string;
  jobNumber?: string;
  status?: string;
  orderType?: string;
  contactId?: string;
  signs?: unknown[];
};

function quoteTargetPath(id: string | number) {
  return `/quotes/view/${id}`;
}

function signOrderTargetPath(id: string | number) {
  return `/takeoffs/sign-order/view/${id}`;
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOrderType(value: string | undefined) {
  if (!value) return [] as string[];

  return value
    .split(/[,+/]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .flatMap((part) => {
      if (part === "perm" || part === "permanent" || part === "permanent signs") return ["permanent signs"];
      return [part];
    });
}

function normalizeQuoteStatus(status: string | undefined) {
  if (!status) return undefined;
  if (/^not sent$/i.test(status)) return "Not Sent";
  if (/^sent$/i.test(status)) return "Sent";
  if (/^accepted$/i.test(status)) return "Accepted";
  if (/^declined$/i.test(status)) return "Declined";
  if (/^draft$/i.test(status)) return "DRAFT";
  return status;
}

function normalizeSignOrderStatus(status: string | undefined) {
  if (!status) return undefined;
  const normalized = status.trim().toUpperCase().replace(/\s+/g, "-");
  if (normalized === "IN-PROCESS") return "IN-PROCESS";
  if (normalized === "SUBMITTED") return "SUBMITTED";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "DRAFT") return "DRAFT";
  return status;
}

function mapQuoteListItem(row: Record<string, any>): RecordSummary {
  return {
    id: String(row.id),
    label: String(row.quote_number || `Quote ${row.id}`),
    secondary: row.customer_name || row.etc_job_number || undefined,
    status: row.status || undefined,
    targetPath: quoteTargetPath(row.id),
  };
}

async function loadQuoteAdminData(estimateId: number | null, jobId: number | null) {
  if (estimateId) {
    const { data } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("bid_estimate_id", estimateId)
      .maybeSingle();
    return data;
  }

  if (jobId) {
    const { data } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();
    return data;
  }

  return null;
}

function buildQuoteWritePayload(input: QuoteWriteInput) {
  const customerId = toNumber(input.customerId);
  const contactId = toNumber(input.contactId);
  const status = normalizeQuoteStatus(input.status);

  return {
    estimate_id: toNumber(input.estimateId),
    job_id: toNumber(input.jobId),
    customers: customerId ? [{ id: customerId }] : [],
    recipients:
      input.customerEmail || contactId
        ? [
            {
              email: input.customerEmail ?? null,
              point_of_contact: true,
              customer_contacts_id: contactId,
            },
          ]
        : [],
    customer_name: input.customerName ?? null,
    customer_contact: input.customerContact ?? null,
    customer_email: input.customerEmail ?? null,
    customer_phone: input.customerPhone ?? null,
    customer_address: input.customerAddress ?? null,
    county: input.county ?? null,
    township: input.township ?? null,
    sr_route: input.stateRoute ?? null,
    subject: input.subject ?? null,
    body: input.body ?? null,
    from_email: input.fromEmail ?? null,
    type_quote: input.typeQuote ?? null,
    status,
    notes: input.notes ?? null,
    payment_terms: input.paymentTerms ?? null,
    etc_job_number: input.etcJobNumber ?? null,
    customer_job_number: input.customerJobNumber ?? null,
  };
}

function mapQuoteRecord(row: Record<string, any>, adminData: Record<string, any> | null) {
  const customers = Array.isArray(row.quotes_customers)
    ? row.quotes_customers
        .map((entry: any) => entry.contractors)
        .filter(Boolean)
        .map((contractor: any) => ({
          id: contractor.id,
          name: contractor.display_name || contractor.name,
        }))
    : [];

  const recipients = Array.isArray(row.quote_recipients)
    ? row.quote_recipients.map((recipient: any) => ({
        id: recipient.id,
        email: recipient.email,
        cc: recipient.cc,
        bcc: recipient.bcc,
        pointOfContact: recipient.point_of_contact,
        customerContactId: recipient.customer_contacts_id,
      }))
    : [];

  return {
    id: row.id,
    quoteNumber: row.quote_number ?? null,
    status: row.status ?? null,
    typeQuote: row.type_quote ?? null,
    subject: row.subject ?? null,
    body: row.body ?? null,
    customerName: row.customer_name ?? null,
    customerContact: row.customer_contact ?? null,
    customerEmail: row.customer_email ?? null,
    customerPhone: row.customer_phone ?? null,
    county: row.county ?? null,
    township: row.township ?? null,
    stateRoute: row.state_route ?? null,
    paymentTerms: row.payment_terms ?? null,
    etcJobNumber: row.etc_job_number ?? null,
    customerJobNumber: row.customer_job_number ?? null,
    estimateId: row.estimate_id ?? null,
    jobId: row.job_id ?? null,
    notes: row.notes ?? null,
    customers,
    recipients,
    items: Array.isArray(row.quote_items)
      ? row.quote_items.map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          uom: item.uom,
        }))
      : [],
    adminData,
  };
}

function mapSignOrderRecord(row: Record<string, any>) {
  const typeParts = [
    row.sale ? "sale" : null,
    row.rental ? "rental" : null,
    row.perm_signs ? "permanent signs" : null,
  ].filter(Boolean);

  return {
    id: row.id,
    requestor: row.requestor ?? null,
    contractorId: row.contractor_id ?? null,
    customerName: row.contractors?.display_name || row.contractors?.name || null,
    contractNumber: row.contract_number ?? null,
    jobNumber: row.job_number ?? null,
    orderDate: row.order_date ?? null,
    needDate: row.need_date ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    orderNumber: row.order_number ?? null,
    orderStatus: row.order_status ?? row.status ?? null,
    shopStatus: row.shop_status ?? null,
    orderType: typeParts,
    signs: Array.isArray(row.signs) ? row.signs : [],
  };
}

function buildSignOrderPayload(input: SignOrderWriteInput, id?: string) {
  const orderTypes = parseOrderType(input.orderType);

  return {
    id: id ? Number(id) : undefined,
    requestor: input.requestor ? { name: input.requestor, branches: input.branch ? { name: input.branch } : undefined } : null,
    contractor_id: toNumber(input.contractorId),
    contract_number: input.contractNumber ?? null,
    order_date: input.orderDate ?? null,
    need_date: input.needDate ?? null,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    order_type: orderTypes,
    job_number: input.jobNumber ?? null,
    status: normalizeSignOrderStatus(input.status) ?? "DRAFT",
    contact: input.contactId ? { id: Number(input.contactId) } : null,
    signs: Array.isArray(input.signs) ? input.signs : [],
  };
}

export async function searchQuotes(params: QuoteSearchInput): Promise<ActionResult> {
  console.info("[chat/actions/quotes] searchQuotes called", {
    params,
    search: params.search,
    timestamp: new Date().toISOString(),
  });

  try {
    let query = supabase
      .from("quotes")
      .select("id, quote_number, status, customer_name, county, etc_job_number, created_at, user_created", { count: "exact" })
      .order("created_at", { ascending: false });

    const page = params.page || 1;
    const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
    const start = (page - 1) * pageSize;

    if (params.status?.trim()) {
      query = query.eq("status", normalizeQuoteStatus(params.status.trim()) ?? params.status.trim());
    }

    if (params.createdBy?.trim()) {
      query = query.eq("user_created", params.createdBy.trim());
    }

    if (params.search?.trim()) {
      const search = params.search.trim();
      query = query.or(
        `quote_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_contact.ilike.%${search}%,county.ilike.%${search}%,etc_job_number.ilike.%${search}%`
      );
    }

    console.info("[chat/actions/quotes] executing query", { search: params.search });

    const { data, error, count } = await query.range(start, start + pageSize - 1);

    console.info("[chat/actions/quotes] query completed", {
      error,
      count,
      resultCount: data?.length || 0,
      sampleData: data?.slice(0, 3).map(r => ({ id: r.id, quote_number: r.quote_number, customer_name: r.customer_name })),
    });

    if (error) throw error;

    const items = (data || []).map(mapQuoteListItem);

    console.info("[chat/actions/quotes] returning items", {
      itemCount: items.length,
      total: count || 0,
    });

    return {
      success: true,
      entityType: "quote",
      operation: "search",
      capabilityStatus: "read_only",
      summary: `Found ${count ?? items.length} quotes`,
      data: { items, total: count ?? items.length, page, pageSize },
    };
  } catch (error) {
    console.error("[chat/actions/quotes] searchQuotes failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      params,
    });

    return {
      success: false,
      entityType: "quote",
      operation: "search",
      capabilityStatus: "read_only",
      summary: "Failed to search quotes",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getQuote(id: string): Promise<ActionResult> {
  try {
    const selectClause = `
        *,
        quote_items(*),
        quote_recipients(*),
        quotes_customers(
          contractors(id, name, display_name)
        )
      `;

    let data: any = null;
    let error: unknown = null;
    const numericId = Number(id);

    if (Number.isFinite(numericId)) {
      const byIdResult = await supabase
        .from("quotes")
        .select(selectClause)
        .eq("id", numericId)
        .maybeSingle();

      data = byIdResult.data;
      error = byIdResult.error;
    }

    if (!data) {
      const normalizedQuoteNumber = id.toUpperCase().startsWith("Q-") ? id.toUpperCase() : `Q-${id}`;
      const byQuoteNumberResult = await supabase
        .from("quotes")
        .select(selectClause)
        .eq("quote_number", normalizedQuoteNumber)
        .maybeSingle();

      data = byQuoteNumberResult.data;
      error = byQuoteNumberResult.error;
    }

    if (error) throw error;
    if (!data) {
      throw new Error(`Quote ${id} was not found`);
    }

    const adminData = await loadQuoteAdminData(data.estimate_id ?? null, data.job_id ?? null);

    return {
      success: true,
      entityType: "quote",
      operation: "get",
      capabilityStatus: "read_only",
      recordId: String(data.id),
      summary: `Loaded ${data.quote_number || `quote #${data.id}`}`,
      targetPath: quoteTargetPath(data.id),
      data: mapQuoteRecord(data, adminData),
    };
  } catch (error) {
    return {
      success: false,
      entityType: "quote",
      operation: "get",
      capabilityStatus: "read_only",
      summary: "Failed to load quote",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createQuote(input: QuoteWriteInput): Promise<ActionResult> {
  try {
    if (!input.customerId && !input.customerName && !input.estimateId && !input.jobId) {
      return {
        success: false,
        entityType: "quote",
        operation: "create",
        capabilityStatus: "write_requires_confirmation",
        summary: "Quote creation needs a customer, estimate, or job reference",
        error: "Missing required customerId, customerName, estimateId, or jobId",
      };
    }

    const payload = buildQuoteWritePayload(input);
    const response = await invokeJsonRoute<{ data: { id: number; quote_number: string | null } }>(
      postQuoteRoute as unknown as (request: Request) => Promise<Response>,
      "http://local/api/quotes",
      "POST",
      payload
    );

    const recordId = String(response.data.id);
    return {
      success: true,
      entityType: "quote",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      recordId,
      summary: `Created ${response.data.quote_number || `quote #${recordId}`}`,
      targetPath: quoteTargetPath(recordId),
      data: { id: response.data.id, quoteNumber: response.data.quote_number },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "quote",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to create quote",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateQuote(id: string, input: QuoteWriteInput): Promise<ActionResult> {
  try {
    const payload = {
      id: Number(id),
      ...buildQuoteWritePayload(input),
    };

    await invokeJsonRoute(
      patchQuoteRoute as unknown as (request: Request) => Promise<Response>,
      "http://local/api/quotes",
      "PATCH",
      payload
    );

    const refreshed = await getQuote(id);
    if (!refreshed.success) {
      return {
        success: true,
        entityType: "quote",
        operation: "update",
        capabilityStatus: "write_requires_confirmation",
        recordId: id,
        summary: `Updated quote ${id}`,
        targetPath: quoteTargetPath(id),
        data: { id: Number(id) },
      };
    }

    return {
      success: true,
      entityType: "quote",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      recordId: id,
      summary: `Updated ${refreshed.data?.quoteNumber || `quote #${id}`}`,
      targetPath: quoteTargetPath(id),
      data: refreshed.data,
    };
  } catch (error) {
    return {
      success: false,
      entityType: "quote",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to update quote",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function searchSignOrders(params: SignOrderSearchInput): Promise<ActionResult> {
  try {
    let query = supabase
      .from("sign_orders")
      .select("id, requestor, contract_number, job_number, order_number, order_status, status, need_date, contractors(name, display_name)", {
        count: "exact",
      })
      .order("id", { ascending: false });

    const page = params.page || 1;
    const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
    const start = (page - 1) * pageSize;

    if (params.status?.trim()) {
      const status = normalizeSignOrderStatus(params.status.trim()) ?? params.status.trim();
      query = query.or(`order_status.eq.${status},status.eq.${status}`);
    }

    if (params.search?.trim()) {
      const search = params.search.trim();
      query = query.or(
        `requestor.ilike.%${search}%,contract_number.ilike.%${search}%,job_number.ilike.%${search}%,order_number.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query.range(start, start + pageSize - 1);
    if (error) throw error;

    const items: RecordSummary[] = (data || []).map((row: any) => ({
      id: String(row.id),
      label: String(row.order_number || `Sign Order ${row.id}`),
      secondary: row.contractors?.display_name || row.contractors?.name || row.contract_number || undefined,
      status: row.order_status || row.status || undefined,
      targetPath: signOrderTargetPath(row.id),
    }));

    return {
      success: true,
      entityType: "sign_order",
      operation: "search",
      capabilityStatus: "read_only",
      summary: `Found ${count ?? items.length} sign orders`,
      data: { items, total: count ?? items.length, page, pageSize },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "sign_order",
      operation: "search",
      capabilityStatus: "read_only",
      summary: "Failed to search sign orders",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getSignOrder(id: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("sign_orders")
      .select("*, contractors(id, name, display_name)")
      .eq("id", Number(id))
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "sign_order",
      operation: "get",
      capabilityStatus: "read_only",
      recordId: String(data.id),
      summary: `Loaded ${data.order_number || `sign order #${data.id}`}`,
      targetPath: signOrderTargetPath(data.id),
      data: mapSignOrderRecord(data),
    };
  } catch (error) {
    return {
      success: false,
      entityType: "sign_order",
      operation: "get",
      capabilityStatus: "read_only",
      summary: "Failed to load sign order",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createSignOrder(input: SignOrderWriteInput): Promise<ActionResult> {
  try {
    if (!input.contractorId && !input.contractNumber && !input.jobNumber) {
      return {
        success: false,
        entityType: "sign_order",
        operation: "create",
        capabilityStatus: "write_requires_confirmation",
        summary: "Sign order creation needs a contractor, contract number, or job number",
        error: "Missing required contractorId, contractNumber, or jobNumber",
      };
    }

    const payload = buildSignOrderPayload(input);
    const response = await invokeJsonRoute<{ id: number }>(
      postSignOrderRoute as unknown as (request: Request) => Promise<Response>,
      "http://local/api/sign-orders",
      "POST",
      payload
    );

    const recordId = String(response.id);
    return {
      success: true,
      entityType: "sign_order",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      recordId,
      summary: `Created sign order ${recordId}`,
      targetPath: signOrderTargetPath(recordId),
      data: { id: response.id },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "sign_order",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to create sign order",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateSignOrder(id: string, input: SignOrderWriteInput): Promise<ActionResult> {
  try {
    const payload = buildSignOrderPayload(input, id);
    await invokeJsonRoute(
      postSignOrderRoute as unknown as (request: Request) => Promise<Response>,
      "http://local/api/sign-orders",
      "POST",
      payload
    );

    const refreshed = await getSignOrder(id);
    if (!refreshed.success) {
      return {
        success: true,
        entityType: "sign_order",
        operation: "update",
        capabilityStatus: "write_requires_confirmation",
        recordId: id,
        summary: `Updated sign order ${id}`,
        targetPath: signOrderTargetPath(id),
        data: { id: Number(id) },
      };
    }

    return {
      success: true,
      entityType: "sign_order",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      recordId: id,
      summary: `Updated ${refreshed.data?.orderNumber || `sign order #${id}`}`,
      targetPath: signOrderTargetPath(id),
      data: refreshed.data,
    };
  } catch (error) {
    return {
      success: false,
      entityType: "sign_order",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to update sign order",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
