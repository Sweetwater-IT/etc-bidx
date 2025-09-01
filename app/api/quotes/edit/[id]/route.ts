import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";


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


  let adminData = null;
  if (quote.estimate_id) {
    const { data, error: adminErr } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("bid_estimate_id", quote.estimate_id)
      .maybeSingle();
    if (adminErr) 
    adminData = data;
  } else if (quote.job_id) {
    const { data, error: adminErr } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("job_id", quote.job_id)
      .maybeSingle();
    if (adminErr) 
    adminData = data;
  }

  console.log("🪵 Admin data:", adminData);


  const { data: items, error: itemsErr } = await supabase
    .from("quote_items")
    .select(
      "id, description, quantity, unit_price, notes, uom, discount, discount_type"
    )
    .eq("quote_id", quoteId);

  if (itemsErr) {
  }

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

  if (custErr) {

  }


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
    job_number: adminData?.job_id || null,
  };

  console.log("✅ [GET /quotes/edit/:id] Final response (completo):", response);

  return NextResponse.json(response);
}




export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quoteId = Number(params.id);

  if (isNaN(quoteId)) {
    return NextResponse.json(
      { success: false, message: "Invalid quote id" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    console.log("🛠️ [PATCH] Incoming payload:", body);

    const { payment_terms, quote_date, admin_data = {} } = body;

    // 1️⃣ Actualizar tabla `quotes`
    const { error: quoteErr } = await supabase
      .from("quotes")
      .update({
        payment_terms,
        date_sent: quote_date,
        state_route: admin_data.sr_route,
        ecms_po_number: admin_data.ecms_po_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (quoteErr) {
      console.error("💥 Error updating quotes:", quoteErr);
      return NextResponse.json(
        { success: false, message: "Failed to update quote", error: quoteErr.message },
        { status: 500 }
      );
    }

    // 2️⃣ Buscar la quote con sus relaciones
    const { data: updatedQuote, error: qErr } = await supabase
      .from("quotes")
      .select(`
        id,
        quote_number,
        status,
        created_at,
        date_sent,
        estimate_id,
        job_id,
        payment_terms,
        state_route,
        ecms_po_number
      `)
      .eq("id", quoteId)
      .single();

    if (qErr || !updatedQuote) {
      console.error("💥 Error fetching updated quote:", qErr);
      return NextResponse.json(
        { success: false, message: "Failed to fetch updated quote", error: qErr?.message },
        { status: 500 }
      );
    }

    // 3️⃣ Traer admin_data_entries
    let adminData = null;
    if (updatedQuote.estimate_id) {
      const { data } = await supabase
        .from("admin_data_entries")
        .select("*")
        .eq("bid_estimate_id", updatedQuote.estimate_id)
        .maybeSingle();
      adminData = data;
    } else if (updatedQuote.job_id) {
      const { data } = await supabase
        .from("admin_data_entries")
        .select("*")
        .eq("job_id", updatedQuote.job_id)
        .maybeSingle();
      adminData = data;
    }

    // 4️⃣ Traer customers vinculados
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

    if (custErr) {
      console.error("💥 Error fetching customers:", custErr);
    }

    console.log("✅ [PATCH] Quote + AdminData + Customers updated OK →", quoteId);

    return NextResponse.json({
      success: true,
      message: "Quote updated successfully",
      quote: {
        ...updatedQuote,
        admin_data: adminData,
        customers: customers?.map((c) => c.contractors) || [],
      },
    });
  } catch (err: any) {
    console.error("💥 [PATCH] Unexpected error:", err);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: err.message },
      { status: 500 }
    );
  }
}