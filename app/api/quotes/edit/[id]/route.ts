import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { AdminData } from "@/types/TAdminData";
import { AdminDataEntry } from "@/types/TAdminDataEntry";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { QuoteItem } from "@/types/IQuoteItem";


// --- Helper Functions to map DB data to Frontend types ---
function mapAdminDataEntryToAdminData(entry: AdminDataEntry | null): AdminData {
  if (!entry) return defaultAdminObject;
  return {
    id: entry.id,
    contractNumber: entry.contract_number || "",
    contract_number: entry.contract_number || "",
    estimator: entry.estimator || "",
    division: entry.division || null,
    lettingDate: entry.bid_date ? new Date(entry.bid_date) : null,
    owner: entry.owner || null,
    county: entry.county || defaultAdminObject.county,
    srRoute: entry.sr_route || "",
    location: entry.location || "",
    dbe: entry.dbe || "",
    startDate: entry.start_date ? new Date(entry.start_date) : null,
    endDate: entry.end_date ? new Date(entry.end_date) : null,
    winterStart: entry.winter_start
      ? new Date(entry.winter_start)
      : undefined,
    winterEnd: entry.winter_end ? new Date(entry.winter_end) : undefined,
    owTravelTimeMins: entry.ow_travel_time_mins || undefined,
    owTravelTimeMinutes: entry.ow_travel_time_mins || undefined,
    owMileage: entry.ow_mileage || undefined,
    fuelCostPerGallon: entry.fuel_cost_per_gallon || undefined,
    emergencyJob: entry.emergency_job || false,
    rated: entry.rated || "RATED",
    emergencyFields: entry.emergency_fields || {},
    job_id: entry.job_id,
  };
}

function mapDbQuoteItemToQuoteItem(item: any): QuoteItem {
  if (!item) return {} as QuoteItem;
  return {
    id: String(item.id),
    itemNumber: item.item_number || "",
    description: item.description || "",
    uom: item.uom || "",
    notes: item.notes || "",
    quantity: item.quantity || 0,
    unitPrice: item.unit_price || 0,
    discount: item.discount || 0,
    discountType: item.discount_type || "dollar",
    associatedItems: [], // Not queried, so default to empty
  };
}

export async function GET(
  req: NextRequest,
  context: { params: any }
) {
  const resolvedParams = await context.params;
  const quoteId = Number(resolvedParams.id);

  if (isNaN(quoteId)) {
    return NextResponse.json(
      { success: false, message: "Invalid quote id" },
      { status: 400 }
    );
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .select(`
      *
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


  let adminDataEntry: AdminDataEntry | null = null;

  if (quote.estimate_id) {
    const { data, error: adminErr } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("bid_estimate_id", quote.estimate_id)
      .maybeSingle<AdminDataEntry>();

    if (!adminErr) adminDataEntry = data;
  } else if (quote.job_id) {
    const { data, error: adminErr } = await supabase
      .from("admin_data_entries")
      .select("*")
      .eq("job_id", quote.job_id)
      .maybeSingle<AdminDataEntry>();

    if (!adminErr) adminDataEntry = data;
  }



  const { data: items, error: itemsErr } = await supabase
    .from("quote_items")
    .select("*") // Seleccionamos todo para el mapeo
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

  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select(`
      *
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
    items: items?.map(mapDbQuoteItemToQuoteItem) || [],
    admin_data: mapAdminDataEntryToAdminData(adminDataEntry),
    notes: notes?.map((note) => ({
      ...note,
      timestamp: new Date(note.created_at).getTime(),
    })),
    customers: customers?.map((c) => c.contractors) || [],
    contract_number: adminDataEntry?.contract_number || null,
    job_number: adminDataEntry?.job_id ? String(adminDataEntry.job_id) : null,
    ...quote
  };

  return NextResponse.json(response);
}
