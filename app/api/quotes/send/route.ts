import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
// import { resend } from "@/lib/resend"; // Descomenta cuando configures tu proveedor de email
import { BidProposalReactPDF } from "@/components/pages/quote-form/BidProposalReactPDF";
import ReactPDF from "@react-pdf/renderer";
import { createQuoteEmailHtml } from "@/app/quotes/create/ProposalHTML";
import { AdminData } from "@/types/TAdminData";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { AdminDataEntry } from "@/types/TAdminDataEntry";
import { Customer } from "@/types/Customer";
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

async function getFullQuoteDetails(quoteId: number) {
    const { data: quote, error } = await supabase
        .from("quotes")
        .select(`
            *,
            quote_items(*),
            quotes_customers(contractors(*)),
            quote_recipients(
                *,
                customer_contacts (
                    id,
                    name,
                    email,
                    phone
                )
            )
        `)
        .eq("id", quoteId)
        .single();

    if (error) throw new Error(`Quote not found: ${error.message}`);

    let adminDataEntry: AdminDataEntry | null = null;
    if (quote.estimate_id) {
        const { data: ad } = await supabase.from("admin_data_entries").select<"*", AdminDataEntry>("*").eq("bid_estimate_id", quote.estimate_id).maybeSingle();
        adminDataEntry = ad;
    } else if (quote.job_id) {
        const { data: ad } = await supabase.from("admin_data_entries").select<"*", AdminDataEntry>("*").eq("job_id", quote.job_id).maybeSingle();
        adminDataEntry = ad;
    }

    const mappedAdminData = mapAdminDataEntryToAdminData(adminDataEntry);

    return { ...quote, admin_data: mappedAdminData };
}


export async function POST(request: NextRequest) {
    try {
        const { quoteId } = await request.json();

        if (!quoteId) {
            return NextResponse.json({ success: false, message: "Quote ID is required" }, { status: 400 });
        }

        const quoteData = await getFullQuoteDetails(quoteId);
        
        const { 
            quote_number, subject, body, from_email, quote_recipients, 
            quote_items: raw_quote_items, quotes_customers: raw_quotes_customers, payment_terms, standard_terms,
            rental_agreements, equipment_sale, flagging_terms, 
            custom_terms_conditions, admin_data
        } = quoteData;

        const pointOfContactRecipient = quote_recipients.find(r => r.point_of_contact);
        if (!pointOfContactRecipient) {
            throw new Error("Point of contact not found for this quote.");
        }

        const to = pointOfContactRecipient.email;
        const cc = quote_recipients.filter(r => r.cc).map(r => r.email);
        const bcc = quote_recipients.filter(r => r.bcc).map(r => r.email);

        const customers: Customer[] = raw_quotes_customers.map((qc: any) => qc.contractors as Customer);
        const items: QuoteItem[] = raw_quote_items.map(mapDbQuoteItemToQuoteItem);

        const pdfBlob = await ReactPDF.pdf(
            <BidProposalReactPDF
                adminData={admin_data}
                items={items || []}
                customers={customers}
                quoteDate={new Date(quoteData.created_at)}
                quoteNumber={quote_number ?? ""}
                pointOfContact={{ name: pointOfContactRecipient.customer_contacts?.[0]?.name || to, email: to }}
                sender={{ name: "Napoleon Dunn", email: from_email || "it@establishedtraffic.com", role: "President" }}
                paymentTerms={payment_terms}
                includedTerms={{
                    "standard-terms": standard_terms,
                    "rental-agreements": rental_agreements,
                    "equipment-sale": equipment_sale,
                    "flagging-terms": flagging_terms,
                    "custom-terms": !!custom_terms_conditions,
                }}
                customTaC={custom_terms_conditions || ""}
                county={admin_data?.county?.country || admin_data?.county?.name || ''}
                sr={admin_data?.srRoute || ''}
                ecms={admin_data?.contractNumber || ''}
            />
        ).toBlob();
        const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

        const emailHtml = createQuoteEmailHtml(
            admin_data,
            items || [],
            customers.map(c => c.name),
            quote_number ?? "",
            new Date(quoteData.created_at),
            payment_terms,
            admin_data?.county?.country || admin_data?.county?.name || '',
            admin_data?.srRoute || '',
            admin_data?.contractNumber || '',
            {
                "standard-terms": standard_terms,
                "rental-agreements": rental_agreements,
                "equipment-sale": equipment_sale,
                "flagging-terms": flagging_terms,
                "custom-terms": !!custom_terms_conditions,
            },
            custom_terms_conditions || "",
            body || ""
        );

        // --- LÓGICA DE ENVÍO DE CORREO ---
        // Aquí iría la integración con tu servicio de email (ej. Resend, SendGrid)
        // await resend.emails.send({
        //     from: from_email || 'it@establishedtraffic.com',
        //     to: to,
        //     cc: cc,
        //     bcc: bcc,
        //     subject: subject || `Quote ${quote_number} from Established Traffic Control`,
        //     html: emailHtml,
        //     attachments: [
        //         {
        //             filename: `Quote-${quote_number}.pdf`,
        //             content: pdfBuffer,
        //         },
        //     ],
        // });
        console.log("✅ Email sending logic would execute here.");

        const { error: updateError } = await supabase
            .from("quotes")
            .update({ status: 'Sent', date_sent: new Date().toISOString() })
            .eq("id", quoteId);

        if (updateError) {
            throw new Error(`Failed to update quote status: ${updateError.message}`);
        }

        return NextResponse.json({ success: true, message: "Quote sent successfully" });

    } catch (error: any) {
        console.error("Error sending quote email:", error);
        return NextResponse.json({ success: false, message: error.message || "An unexpected error occurred." }, { status: 500 });
    }
}