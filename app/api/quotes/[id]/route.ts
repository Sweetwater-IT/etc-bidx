import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: quoteId } = await context.params;

    const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select(
            `
        id,
        quote_number,
        status,
        created_at,
        date_sent,
        job_id,
        estimate_id,
        notes,
        contract_number:ecms_po_number
      `
        )
        .eq("id", quoteId)
        .single();

    if (quoteError || !quote) {
        return NextResponse.json(
            { message: "Quote not found", error: quoteError?.message },
            { status: 404 }
        );
    }

    const { data: items } = await supabase
        .from("quote_items")
        .select("id, description, quantity, unit_price")
        .eq("quote_id", quoteId);

    const { data: customerJoin } = await supabase
        .from("quotes_customers")
        .select(
            `
        contractor:contractors (
          id,
          name,
          display_name
        )
      `
        )
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

    const { data: contactJoin } = await supabase
        .from("quote_recipients")
        .select(
            `
        customer_contacts (
          id,
          name,
          email,
          phone
        )
      `
        )
        .eq("quote_id", quoteId)
        .maybeSingle();

    const contactArray = contactJoin?.customer_contacts || null;
    const contact = Array.isArray(contactArray) ? contactArray[0] : contactArray;

    const files: any[] = [];
    const notes = quote.notes ? JSON.parse(quote.notes) : [];

    return NextResponse.json({
        ...quote,
        customer,
        contact,
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
