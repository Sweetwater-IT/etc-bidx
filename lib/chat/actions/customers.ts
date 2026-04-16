import { supabase } from "@/lib/supabase";
import { ActionResult, RecordSummary } from "../types";

const DEFAULT_LIMIT = 10;

type CustomerWriteInput = {
  name?: string;
  displayName?: string;
  customerNumber?: string;
  mainPhone?: string;
  url?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  paymentTerms?: string;
  wouldLikeToApplyForCredit?: boolean;
};

type ContactWriteInput = {
  contractorId?: string;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
};

function customerSummary(customer: Record<string, unknown>): string {
  const displayName = typeof customer.display_name === "string" && customer.display_name.trim()
    ? customer.display_name
    : customer.name;
  return String(displayName || `Customer #${customer.id}`);
}

function mapCustomerRecord(customer: Record<string, unknown>) {
  const contacts = Array.isArray(customer.customer_contacts)
    ? customer.customer_contacts.filter((contact) => !contact?.is_deleted)
    : [];

  return {
    id: customer.id,
    name: customer.name ?? null,
    displayName: customer.display_name ?? null,
    customerNumber: customer.customer_number ?? null,
    mainPhone: customer.main_phone ?? null,
    url: customer.web ?? null,
    address: customer.address ?? null,
    city: customer.city ?? null,
    state: customer.state ?? null,
    zip: customer.zip ?? null,
    paymentTerms: customer.payment_terms ?? null,
    wouldLikeToApplyForCredit: Boolean(customer.would_like_to_apply_for_credit),
    contacts,
  };
}

function mapContactRecord(contact: Record<string, unknown>) {
  return {
    id: contact.id,
    contractorId: contact.contractor_id,
    name: contact.name ?? null,
    role: contact.role ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
  };
}

async function nextContractorId() {
  const { data, error } = await supabase
    .from("contractors")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? Number(data[0].id) + 1 : 1;
}

export async function searchCustomers(params: { search?: string }): Promise<ActionResult> {
  try {
    let query = supabase
      .from("contractors")
      .select("id, name, display_name, customer_number, city, state, payment_terms", { count: "exact" })
      .eq("is_deleted", false)
      .order("display_name", { ascending: true })
      .limit(DEFAULT_LIMIT);

    if (params.search?.trim()) {
      const search = params.search.trim();
      query = query.or(
        `name.ilike.%${search}%,display_name.ilike.%${search}%,customer_number.ilike.%${search}%,main_phone.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const items: RecordSummary[] = (data || []).map((customer) => ({
      id: String(customer.id),
      label: String(customer.display_name || customer.name || `Customer #${customer.id}`),
      secondary: customer.customer_number
        ? `Customer #${customer.customer_number}`
        : customer.city
          ? `${customer.city}, ${customer.state || ""}`.trim().replace(/,\s*$/, "")
          : undefined,
      status: typeof customer.payment_terms === "string" ? customer.payment_terms : undefined,
    }));

    return {
      success: true,
      entityType: "customer",
      operation: "search",
      capabilityStatus: "read_only",
      summary: `Found ${count ?? items.length} customers`,
      data: { items, total: count ?? items.length },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "customer",
      operation: "search",
      capabilityStatus: "read_only",
      summary: "Failed to search customers",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCustomer(id: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("contractors")
      .select("*, customer_contacts(*)")
      .eq("id", Number(id))
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "customer",
      operation: "get",
      capabilityStatus: "read_only",
      recordId: String(data.id),
      summary: `Loaded ${customerSummary(data)}`,
      data: mapCustomerRecord(data),
    };
  } catch (error) {
    return {
      success: false,
      entityType: "customer",
      operation: "get",
      capabilityStatus: "read_only",
      summary: "Failed to load customer",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createCustomer(input: CustomerWriteInput): Promise<ActionResult> {
  try {
    if (!input.name?.trim()) {
      return {
        success: false,
        entityType: "customer",
        operation: "create",
        capabilityStatus: "write_requires_confirmation",
        summary: "Customer name is required",
        error: "Missing required field: name",
      };
    }

    const id = await nextContractorId();
    const insertPayload = {
      id,
      name: input.name.trim(),
      display_name: input.displayName?.trim() || null,
      customer_number: input.customerNumber?.trim() || null,
      main_phone: input.mainPhone?.trim() || null,
      web: input.url?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      zip: input.zip?.trim() || null,
      bill_to_street: input.address?.trim() || null,
      bill_to_city: input.city?.trim() || null,
      bill_to_state: input.state?.trim() || null,
      bill_to_zip: input.zip?.trim() || null,
      payment_terms: input.paymentTerms?.trim() || null,
      would_like_to_apply_for_credit: Boolean(input.wouldLikeToApplyForCredit),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      active: true,
      is_deleted: false,
    };

    const { data, error } = await supabase
      .from("contractors")
      .insert(insertPayload)
      .select("id, name, display_name")
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "customer",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      recordId: String(data.id),
      summary: `Created ${data.display_name || data.name}`,
      data: { id: data.id, name: data.name, displayName: data.display_name },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "customer",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to create customer",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateCustomer(id: string, input: CustomerWriteInput): Promise<ActionResult> {
  try {
    const updatePayload: Record<string, unknown> = {};

    if (input.name !== undefined) updatePayload.name = input.name?.trim() || null;
    if (input.displayName !== undefined) updatePayload.display_name = input.displayName?.trim() || null;
    if (input.customerNumber !== undefined) updatePayload.customer_number = input.customerNumber?.trim() || null;
    if (input.mainPhone !== undefined) updatePayload.main_phone = input.mainPhone?.trim() || null;
    if (input.url !== undefined) updatePayload.web = input.url?.trim() || null;
    if (input.address !== undefined) {
      const value = input.address?.trim() || null;
      updatePayload.address = value;
      updatePayload.bill_to_street = value;
    }
    if (input.city !== undefined) {
      const value = input.city?.trim() || null;
      updatePayload.city = value;
      updatePayload.bill_to_city = value;
    }
    if (input.state !== undefined) {
      const value = input.state?.trim() || null;
      updatePayload.state = value;
      updatePayload.bill_to_state = value;
    }
    if (input.zip !== undefined) {
      const value = input.zip?.trim() || null;
      updatePayload.zip = value;
      updatePayload.bill_to_zip = value;
    }
    if (input.paymentTerms !== undefined) updatePayload.payment_terms = input.paymentTerms?.trim() || null;
    if (input.wouldLikeToApplyForCredit !== undefined) {
      updatePayload.would_like_to_apply_for_credit = Boolean(input.wouldLikeToApplyForCredit);
    }

    updatePayload.updated = new Date().toISOString();

    const { data, error } = await supabase
      .from("contractors")
      .update(updatePayload)
      .eq("id", Number(id))
      .select("id, name, display_name")
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "customer",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      recordId: String(data.id),
      summary: `Updated ${data.display_name || data.name}`,
      data: { id: data.id, name: data.name, displayName: data.display_name },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "customer",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to update customer",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function searchCustomerContacts(params: { search?: string; contractorId?: string }): Promise<ActionResult> {
  try {
    let query = supabase
      .from("customer_contacts")
      .select("id, contractor_id, name, role, email, phone", { count: "exact" })
      .eq("is_deleted", false)
      .order("name", { ascending: true })
      .limit(DEFAULT_LIMIT);

    if (params.search?.trim()) {
      const search = params.search.trim();
      query = query.or(`name.ilike.%${search}%,role.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (params.contractorId) {
      query = query.eq("contractor_id", Number(params.contractorId));
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const items: RecordSummary[] = (data || []).map((contact) => ({
      id: String(contact.id),
      label: String(contact.name || `Contact #${contact.id}`),
      secondary: typeof contact.email === "string" && contact.email
        ? contact.email
        : typeof contact.phone === "string"
          ? contact.phone
          : undefined,
      status: typeof contact.role === "string" ? contact.role : undefined,
    }));

    return {
      success: true,
      entityType: "customer_contact",
      operation: "search",
      capabilityStatus: "read_only",
      summary: `Found ${count ?? items.length} contacts`,
      data: { items, total: count ?? items.length },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "customer_contact",
      operation: "search",
      capabilityStatus: "read_only",
      summary: "Failed to search customer contacts",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCustomerContact(id: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("customer_contacts")
      .select("id, contractor_id, name, role, email, phone, is_deleted")
      .eq("id", Number(id))
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "customer_contact",
      operation: "get",
      capabilityStatus: "read_only",
      recordId: String(data.id),
      summary: `Loaded ${data.name || `contact #${data.id}`}`,
      data: mapContactRecord(data),
    };
  } catch (error) {
    return {
      success: false,
      entityType: "customer_contact",
      operation: "get",
      capabilityStatus: "read_only",
      summary: "Failed to load customer contact",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createCustomerContact(input: ContactWriteInput): Promise<ActionResult> {
  try {
    const contractorId = Number(input.contractorId);
    if (!contractorId || Number.isNaN(contractorId)) {
      return {
        success: false,
        entityType: "customer_contact",
        operation: "create",
        capabilityStatus: "write_requires_confirmation",
        summary: "A contractor id is required",
        error: "Missing required field: contractorId",
      };
    }

    if (!input.name?.trim()) {
      return {
        success: false,
        entityType: "customer_contact",
        operation: "create",
        capabilityStatus: "write_requires_confirmation",
        summary: "A contact name is required",
        error: "Missing required field: name",
      };
    }

    const { data, error } = await supabase
      .from("customer_contacts")
      .insert({
        contractor_id: contractorId,
        name: input.name.trim(),
        role: input.role?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        is_deleted: false,
      })
      .select("id, name, role")
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "customer_contact",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      recordId: String(data.id),
      summary: `Created ${data.name}`,
      data: { id: data.id, name: data.name, role: data.role },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "customer_contact",
      operation: "create",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to create customer contact",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateCustomerContact(id: string, input: ContactWriteInput): Promise<ActionResult> {
  try {
    const updatePayload: Record<string, unknown> = {
      updated: new Date().toISOString(),
    };

    if (input.name !== undefined) updatePayload.name = input.name?.trim() || null;
    if (input.role !== undefined) updatePayload.role = input.role?.trim() || null;
    if (input.email !== undefined) updatePayload.email = input.email?.trim() || null;
    if (input.phone !== undefined) updatePayload.phone = input.phone?.trim() || null;

    const { data, error } = await supabase
      .from("customer_contacts")
      .update(updatePayload)
      .eq("id", Number(id))
      .select("id, name, role")
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "customer_contact",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      recordId: String(data.id),
      summary: `Updated ${data.name}`,
      data: { id: data.id, name: data.name, role: data.role },
    };
  } catch (error) {
    return {
      success: false,
      entityType: "customer_contact",
      operation: "update",
      capabilityStatus: "write_requires_confirmation",
      summary: "Failed to update customer contact",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
