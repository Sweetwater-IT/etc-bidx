import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { AdminData } from "@/types/TAdminData"; // 👈 agregado

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const quoteId = Number(context.params.id);

  if (isNaN(quoteId)) {
    return NextResponse.json(
      { success: false, message: "Invalid quote id" },
      { status: 400 }
    );
  }

  const { data: quote, error } = await supabase
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
      ecms_po_number,
      subject,
      body,
      custom_terms_conditions,
      standard_terms,
      rental_agreements,
      equipment_sale,
      flagging_terms,
      from_email,
      payment_terms
    `)
    .eq("id", quoteId)
    .single();

  if (error || !quote) {
    return NextResponse.json(
      { success: false, message: "Quote not found", error: error?.message },
      { status: 404 }
    );
  }

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
    // podrías loguear o manejar error si quieres
  }

  const contactRecipient = recipients?.find((r) => r.point_of_contact) || null;
  const contact = contactRecipient
    ? {
        name:
          Array.isArray(contactRecipient.customer_contacts) &&
          contactRecipient.customer_contacts.length > 0
            ? contactRecipient.customer_contacts[0].name
            : null,
        email:
          contactRecipient.email ||
          (Array.isArray(contactRecipient.customer_contacts) &&
          contactRecipient.customer_contacts.length > 0
            ? contactRecipient.customer_contacts[0].email
            : null) ||
          null,
        phone:
          Array.isArray(contactRecipient.customer_contacts) &&
          contactRecipient.customer_contacts.length > 0
            ? contactRecipient.customer_contacts[0].phone
            : null,
      }
    : null;

  const ccEmails = recipients?.filter((r) => r.cc).map((r) => r.email) || [];
  const bccEmails = recipients?.filter((r) => r.bcc).map((r) => r.email) || [];

  
  let adminData: AdminData | null = null;

  if (quote.estimate_id) {
    const { data, error: adminErr } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("bid_estimate_id", quote.estimate_id)
      .maybeSingle<AdminData>(); 

    if (!adminErr) adminData = data;
  } else if (quote.job_id) {
    const { data, error: adminErr } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("job_id", quote.job_id)
      .maybeSingle<AdminData>(); 

    if (!adminErr) adminData = data;
  }



  const { data: items, error: itemsErr } = await supabase
    .from("quote_items")
    .select(
      "id, description, quantity, unit_price, notes, uom, discount, discount_type"
    )
    .eq("quote_id", quoteId);

 

  const { data: customers, error: custErr } = await supabase
    .from("quotes_customers")
    .select(`
      contractor_id,
      contractors (
        id,
        name,
        display_name,
        email
      )
    `)
    .eq("quote_id", quoteId);



  const response = {
    id: quote.id,
    quote_number: quote.quote_number,
    status: quote.status,
    created_at: quote.created_at,
    date_sent: quote.date_sent,
    ecms_po_number: quote.ecms_po_number,
    subject: quote.subject,
    body: quote.body,
    from_email: quote.from_email,
    payment_terms: quote.payment_terms,
    custom_terms_conditions: quote.custom_terms_conditions,
    include_terms: {
      "standard-terms": quote.standard_terms,
      "rental-agreements": quote.rental_agreements,
      "equipment-sale": quote.equipment_sale,
      "flagging-terms": quote.flagging_terms,
    },
    contact,
    ccEmails,
    bccEmails,
    recipients: recipients || [],
    items: items || [],
    admin_data: adminData,
    notes: quote.notes ? JSON.parse(quote.notes) : [],
    customers: customers?.map((c) => c.contractors) || [],
    contract_number: adminData?.contract_number || null,
    job_number: adminData?.jobNumber || null,
  };


  return NextResponse.json(response);
}
