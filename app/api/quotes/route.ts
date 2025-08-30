// app/api/quotes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface QuoteGridView {
  id: number;
  quote_number: string | null;
  status: "Not Sent" | "Sent" | "Accepted" | "DRAFT" | null;
  date_sent: string | null;
  customer_name: string;
  point_of_contact: string;
  point_of_contact_email: string;
  total_items: number;
  county: string | null;
  updated_at: string | null;
  has_attachments: boolean;
  estimate_contract_number?: string;
  job_number?: string;
}

// --------------------
// GET
// --------------------
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    let orderBy = searchParams.get("orderBy") || "date_sent";
    const ascending = searchParams.get("ascending") === "true";
    const counts = searchParams.get("counts") === "true";
    const nextNumber = searchParams.get("nextNumber") === "true";
    const detailed = searchParams.get("detailed") === "true";

    console.log("[GET /quotes] params:", { status, limit, page, orderBy, ascending, counts, nextNumber, detailed });

    if (orderBy === "quote_created_at") orderBy = "created_at";

    // 📊 Counts
    if (counts) {
      console.log("[GET /quotes] Fetching counts...");

      const { data: allQuotes, error: countError } = await supabase
        .from("quotes")
        .select("id, status");

      if (countError || !allQuotes) {
        console.error("[GET /quotes] Count error:", countError);

        return NextResponse.json(
          { success: false, message: "Failed to fetch quote counts", error: countError },
          { status: 500 }
        );
      }

      const countData = {
        all: allQuotes.length,
        not_sent: allQuotes.filter((q) => q.status === "Not Sent").length,
        sent: allQuotes.filter((q) => q.status === "Sent").length,
        accepted: allQuotes.filter((q) => q.status === "Accepted").length,
      };

      console.log("[GET /quotes] Count data:", countData);


      return NextResponse.json({ success: true, data: countData });
    }

    // 🔢 Next Quote Number (solo vista previa, no inserta)
    if (nextNumber) {
      console.log("[GET /quotes] Fetching next quote number...");

      const { data: latestQuote, error: quoteError } = await supabase
        .from("quotes")
        .select("quote_number")
        .order("id", { ascending: false })
        .limit(1);

      if (quoteError) {

        console.error("[GET /quotes] Error fetching latest quote:", quoteError);

        return NextResponse.json(
          { success: false, message: "Failed to fetch latest quote number", error: quoteError },
          { status: 500 }
        );
      }


      console.log("[GET /quotes] Latest quote:", latestQuote);

      let nextQuoteNumber = "Q-1001";
      if (latestQuote && latestQuote.length > 0) {
        const currentNumber = latestQuote[0].quote_number;
        if (currentNumber && currentNumber.startsWith("Q-")) {
          const numericPart = parseInt(currentNumber.substring(2));
          if (!isNaN(numericPart)) {
            nextQuoteNumber = `Q-${numericPart + 1}`;
          }
        }
      }

      console.log("[GET /quotes] Next quote number will be:", nextQuoteNumber);

      return NextResponse.json({ success: true, data: { nextQuoteNumber } });
    }

    // 📑 Pagination
    const offset = (page - 1) * limit;

    if (detailed) {
      let query = supabase
        .from("quotes")
        .select("*")
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error || !data) {
        return NextResponse.json(
          { success: false, message: "Failed to fetch quotes", error: error?.message },
          { status: 500 }
        );
      }

      const { count } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true });

      return NextResponse.json({
        success: true,
        data,
        pagination: {
          page,
          pageSize: limit,
          pageCount: Math.ceil((count || 0) / limit),
          totalCount: count || 0,
        },
      });
    } else {
      let query = supabase
        .from("quotes")
        .select(
          `
          id,
          quote_number,
          status,
          date_sent,
          county,
          updated_at,
          quotes_customers (
            contractors ( name )
          ),
          quote_recipients (
            email,
            point_of_contact
          ),
          quote_items ( id ),
          files ( id )
        `
        )
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data: rawData, error } = await query;

      if (error || !rawData) {
        return NextResponse.json(
          { success: false, message: "Failed to fetch quotes", error: error?.message },
          { status: 500 }
        );
      }

      const transformedData: QuoteGridView[] = rawData.map((row: any) => ({
        id: row.id,
        quote_number: row.quote_number,
        status: row.status,
        date_sent: row.date_sent,
        customer_name: row.quotes_customers?.[0]?.contractors?.name || "Unknown Customer",
        point_of_contact: row.quote_recipients?.find((r: any) => r.point_of_contact)?.email || "",
        point_of_contact_email: row.quote_recipients?.[0]?.email || "",
        total_items: row.quote_items?.length || 0,
        county: row.county,
        updated_at: row.updated_at,
        has_attachments: (row.files?.length || 0) > 0,
        estimate_contract_number: undefined,
        job_number: undefined,
      }));

      const { count } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true });

      return NextResponse.json({
        success: true,
        data: transformedData,
        pagination: {
          page,
          pageSize: limit,
          pageCount: Math.ceil((count || 0) / limit),
          totalCount: count || 0,
        },
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}

// --------------------
// POST → crear draft vacío con quote_number
// --------------------
export async function POST() {
  try {
    // Buscar el último quote_number
    const { data: latest, error: latestError } = await supabase
      .from("quotes")
      .select("quote_number")
      .order("id", { ascending: false })
      .limit(1);

    if (latestError) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch last quote", error: latestError.message },
        { status: 500 }
      );
    }

    let nextQuoteNumber = "Q-1001";
    if (latest && latest.length > 0) {
      const current = latest[0].quote_number;
      if (current && current.startsWith("Q-")) {
        const num = parseInt(current.substring(2));
        if (!isNaN(num)) {
          nextQuoteNumber = `Q-${num + 1}`;
        }
      }
    }

    // Crear draft nuevo con quote_number
    const { data, error } = await supabase
      .from("quotes")
      .insert([
        {
          quote_number: nextQuoteNumber,
          status: "DRAFT",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id, quote_number")
      .single();

    if (error || !data) {
      console.error("Error creating draft:", error);
      return NextResponse.json(
        { success: false, message: "Failed to create draft", error: error?.message || "No data" },
        { status: 500 }
      );
    }

    if (!data.id || isNaN(Number(data.id))) {
      return NextResponse.json(
        { success: false, message: "Invalid ID returned from insert", error: "ID null" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Unexpected error POST /quotes:", err);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(err) },
      { status: 500 }
    );
  }
}

// --------------------
// PATCH → update draft
// --------------------
export async function PATCH(request: NextRequest) {


  try {
    const body = await request.json();
    const { id, items, admin_data, status, notes, subject, body: emailBody, from_email, recipients } = body;

    const numericId = Number(id);

    // 👉 Skip si todavía no hay id asignado
    if (!id || isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "Skipping update because quote has no valid ID yet" },
        { status: 200 }
      );
    }

    // 1️⃣ Actualizar quotes
    const { error: quoteError } = await supabase
      .from("quotes")
      .update({
        status: status || "Not Sent",
        notes: Array.isArray(notes) ? JSON.stringify(notes) : notes,
        subject,
        body: emailBody,
        from_email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", numericId);

    if (quoteError) {
      console.error("Error updating quote:", quoteError);
      return NextResponse.json(
        { success: false, message: "Failed to update quote", error: quoteError.message },
        { status: 500 }
      );
    }

    // 2️⃣ recipients
    if (Array.isArray(recipients)) {
      await supabase.from("quote_recipients").delete().eq("quote_id", numericId);

      const recipientsToInsert = recipients.map((r: any) => ({
        quote_id: numericId,
        email: r.email,
        cc: r.cc || false,
        bcc: r.bcc || false,
        point_of_contact: r.point_of_contact || false,
        customer_contacts_id: r.contactId || null,
      }));

      if (recipientsToInsert.length > 0) {
        const { error: recipientsError } = await supabase
          .from("quote_recipients")
          .insert(recipientsToInsert);

        if (recipientsError) {
          console.error("Error saving recipients:", recipientsError);
        }
      }
    }

    // 3️⃣ items
    if (Array.isArray(items)) {
      await supabase.from("quote_items").delete().eq("quote_id", numericId);

      const itemsToInsert = items.map((item: any) => ({
        quote_id: numericId,
        item_number: item.itemNumber,
        description: item.description,
        uom: item.uom,
        notes: item.notes,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        discount_type: item.discountType,
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from("quote_items").insert(itemsToInsert);

        if (itemsError) {
          console.error("Error saving items:", itemsError);
        }
      }
    }

    // 4️⃣ admin_data
  if (admin_data) {
  const { error: adminError } = await supabase.from("admin_data_entries").upsert(
    {
      quote_id: numericId, // 👈 relación directa
      contract_number: admin_data.contract_number,
      estimator: admin_data.estimator,
      division: admin_data.division,
      letting_date: admin_data.letting_date,
      owner: admin_data.owner,
      county: admin_data.county,
      sr_route: admin_data.sr_route,
      location: admin_data.location,
      dbe: admin_data.dbe,
      start_date: admin_data.start_date,
      end_date: admin_data.end_date,
      winter_start: admin_data.winter_start,
      winter_end: admin_data.winter_end,
      ow_travel_time_mins: admin_data.ow_travel_time_minutes,
      ow_mileage: admin_data.ow_mileage,
      fuel_cost_per_gallon: admin_data.fuel_cost_per_gallon,
      emergency_job: admin_data.emergency_job,
      rated: admin_data.rated,
      emergency_fields: admin_data.emergency_fields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "quote_id" } // 👈 mejor clave que contract_number
  )

  if (adminError) {
    console.error("Error saving admin data:", adminError)
  }
}

    return NextResponse.json({ success: true, message: "Quote draft saved" });
  } catch (error) {
    console.error("Unexpected error PATCH /quotes:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}
