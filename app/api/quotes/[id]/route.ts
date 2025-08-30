// app/api/quotes/[id]/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

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

  // 🔹 1. Quote base
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

  if (quoteError || !quote) {
    return NextResponse.json(
      { message: "Quote not found", error: quoteError?.message },
      { status: 404 }
    );
  }

  // 🔹 2. Items
  const { data: items } = await supabase
    .from("quote_items")
    .select("id, description, quantity, unit_price")
    .eq("quote_id", quoteId);

  // 🔹 3. Customer
  const { data: customerJoin } = await supabase
    .from("quotes_customers")
    .select(`
      contractor:contractors (
        id,
        name,
        display_name
      )
    `)
    .eq("quote_id", quoteId)
    .single();

  const contractor = Array.isArray(customerJoin?.contractor)
    ? customerJoin.contractor[0]
    : customerJoin?.contractor;

  const customer = contractor
    ? {
        id: contractor.id,
        name: contractor.name,
        displayName: contractor.display_name,
      }
    : null;

  // 🔹 4. Contact (recipients)
  const { data: contactJoin } = await supabase
    .from("quote_recipients")
    .select(`
      customer_contacts (
        id,
        name,
        email,
        phone
      )
    `)
    .eq("quote_id", quoteId)
    .maybeSingle();

  const contactData = contactJoin?.customer_contacts;
  const contact = Array.isArray(contactData)
    ? contactData[0]
    : contactData || null;

  const files: any[] = [];
  const notes = quote.notes ? JSON.parse(quote.notes) : [];

  // 🔹 5. Response
  return NextResponse.json({
    id: quote.id, // 👈 garantizamos que sea numérico
    quote_number: quote.quote_number,
    contract_number: quote.ecms_po_number,
    status: quote.status,
    created_at: quote.created_at,
    date_sent: quote.date_sent,
    customer,
    contact: contact
      ? {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
        }
      : null,
    requestor: contact?.name || null,
    quote_date: quote.date_sent,
    items: items?.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unit_price,
    })),
    files,
    notes,
  });
}
