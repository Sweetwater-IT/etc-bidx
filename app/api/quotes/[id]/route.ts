import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { AdminDataEntry } from "@/types/TAdminDataEntry"; // 👈 ya lo tenés

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const quoteId = Number(context.params.id);

  if (isNaN(quoteId)) {
    return NextResponse.json(
      { message: "Invalid quote id", error: "ID must be a number" },
      { status: 400 }
    );
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select(`
      id,
      quote_number,
      status,
      created_at,
      date_sent,
      job_id,
      estimate_id,
      notes,
      ecms_po_number
    `)
    .eq("id", quoteId)
    .single();

  console.log("🪵 Quote base:", quote);

  if (quoteError || !quote) {
    return NextResponse.json(
      { message: "Quote not found", error: quoteError?.message },
      { status: 404 }
    );
  }

  // 2️⃣ Items
  const { data: items } = await supabase
    .from("quote_items")
    .select("id, description, quantity, unit_price")
    .eq("quote_id", quoteId);

  // 3️⃣ Customer
  const { data: customerJoin } = await supabase
    .from("quotes_customers")
    .select(`
      contractors (
        id,
        name,
        display_name
      )
    `)
    .eq("quote_id", quoteId);

  const contractorData =
    Array.isArray(customerJoin) && customerJoin.length > 0
      ? Array.isArray(customerJoin[0].contractors)
        ? customerJoin[0].contractors[0]
        : customerJoin[0].contractors
      : null;

  const customer = contractorData
    ? {
        id: contractorData.id,
        name: contractorData.name,
        displayName: contractorData.display_name,
      }
    : null;

  const { data: recipients, error: recErr } = await supabase
    .from("quote_recipients")
    .select(`
      id,
      email,
      cc,
      bcc,
      point_of_contact,
      customer_contacts (
        id,
        name,
        email,
        phone
      )
    `)
    .eq("quote_id", quoteId);

  if (recErr) {
    console.warn("⚠️ Error fetching recipients:", recErr);
  }

  const contactRecipient = recipients?.find((r) => r.point_of_contact) || null;

const contact = contactRecipient
  ? {
      name: contactRecipient.customer_contacts?.[0]?.name ?? null,
      email:
        contactRecipient.email ||
        contactRecipient.customer_contacts?.[0]?.email ||
        null,
      phone: contactRecipient.customer_contacts?.[0]?.phone ?? null,
    }
  : null;

  const ccEmails = recipients?.filter((r) => r.cc).map((r) => r.email) || [];
  const bccEmails = recipients?.filter((r) => r.bcc).map((r) => r.email) || [];

  // 👇 cambio: adminData tipado
  let adminData: AdminDataEntry | null = null;

  if (quote.estimate_id) {
    const { data } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("bid_estimate_id", quote.estimate_id)
      .maybeSingle<AdminDataEntry>(); // 👈 tipado aquí
    adminData = data;
  } else if (quote.job_id) {
    const { data } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("job_id", quote.job_id)
      .maybeSingle<AdminDataEntry>(); // 👈 tipado aquí
    adminData = data;
  }

  const files: any[] = [];
  const notes = quote.notes ? JSON.parse(quote.notes) : [];

  const response = {
    id: quote.id,
    quote_number: quote.quote_number,
    contract_number: quote.ecms_po_number || adminData?.contract_number || null,
    status: quote.status,
    created_at: quote.created_at,
    date_sent: quote.date_sent,
    customer,
    contact,
    ccEmails,
    bccEmails,
    requestor: contact?.email || null,
    quote_date: quote.date_sent || quote.created_at,
    items: items?.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unit_price,
    })),
    admin_data: adminData || null,
    files,
    notes,
  };

  console.log("✅ [GET /quotes/:id] Final response3", response);

  return NextResponse.json(response);
}
