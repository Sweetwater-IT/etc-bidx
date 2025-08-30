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

    if (orderBy === "quote_created_at") orderBy = "created_at";

    // 📊 Counts
    if (counts) {
      const { data: allQuotes, error: countError } = await supabase
        .from("quotes")
        .select("id, status");

      if (countError || !allQuotes) {
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

      return NextResponse.json({ success: true, data: countData });
    }

    // 🔢 Next Quote Number (solo vista previa, no inserta)
    if (nextNumber) {
      const { data: latestQuote, error: quoteError } = await supabase
        .from("quotes")
        .select("quote_number")
        .order("id", { ascending: false })
        .limit(1);

      if (quoteError) {
        return NextResponse.json(
          { success: false, message: "Failed to fetch latest quote number", error: quoteError },
          { status: 500 }
        );
      }

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
        .select(`
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
    files ( id ),
    admin_data_entries ( 
      contract_number,
      estimator,
      division,
      owner,
      county,
      sr_route,
      location,
      dbe,
      start_date,
      end_date,
      winter_start,
      winter_end,
      ow_travel_time_mins,
      ow_mileage,
      fuel_cost_per_gallon,
      emergency_job,
      rated,
      emergency_fields
    )
  `)

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
// PATCH → update draft (quotes + recipients + items + admin_data)
// --------------------
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      items,
      admin_data,
      status,
      notes,
      subject,
      body: emailBody,
      from_email,
      recipients,
    } = body;

    const numericId = Number(id);

    console.log("🛠️ [PATCH] Incoming payload (trimmed):", JSON.stringify(body)?.slice(0, 2000));

    // 👉 Skip si todavía no hay id asignado
    if (!id || isNaN(numericId)) {
      console.log("⏭️ [PATCH] Skipping update because quote has no valid ID yet:", id);
      return NextResponse.json(
        { success: false, message: "Skipping update because quote has no valid ID yet" },
        { status: 200 }
      );
    }

    // 1️⃣ Actualizar quotes
    const allowedStatuses = new Set(["Not Sent", "Sent", "Accepted", "DRAFT"]);
    const safeStatus = allowedStatuses.has(status) ? status : "DRAFT";
    const notesValue = Array.isArray(notes) ? JSON.stringify(notes) : notes ?? null;

    const quoteUpdate = {
      status: safeStatus,
      notes: notesValue,
      subject: subject ?? null,
      body: emailBody ?? null,
      from_email: from_email ?? null,
      updated_at: new Date().toISOString(),
      county: admin_data?.county?.country ?? null,


    };

    console.log("🧾 [PATCH] Updating quotes:", { id: numericId, quoteUpdate });

    const { error: quoteError } = await supabase
      .from("quotes")
      .update(quoteUpdate)
      .eq("id", numericId);

    if (quoteError) {
      console.error("💥 [PATCH] Error updating quote:", quoteError);
      return NextResponse.json(
        { success: false, message: "Failed to update quote", error: quoteError.message },
        { status: 500 }
      );
    }

    // 2️⃣ Recipients (delete → insert snapshot)
    if (Array.isArray(recipients)) {
      console.log("👥 [PATCH] Replacing recipients for quote:", numericId);

      const { error: delRecErr } = await supabase
        .from("quote_recipients")
        .delete()
        .eq("quote_id", numericId);

      if (delRecErr) {
        console.error("💥 [PATCH] Error deleting recipients:", delRecErr);
      }

      const recipientsToInsert = recipients.map((r: any) => ({
        quote_id: numericId,
        email: r.email,
        cc: !!r.cc,
        bcc: !!r.bcc,
        point_of_contact: !!r.point_of_contact,
        customer_contacts_id: r.contactId ?? null,
      }));

      if (recipientsToInsert.length > 0) {
        const { error: recipientsError } = await supabase
          .from("quote_recipients")
          .insert(recipientsToInsert);

        if (recipientsError) {
          console.error("💥 [PATCH] Error inserting recipients:", recipientsError);
        } else {
          console.log("✅ [PATCH] Recipients saved:", recipientsToInsert.length);
        }
      }
    }

    // 3️⃣ Items (delete → insert snapshot)
    if (Array.isArray(items)) {
      console.log("📦 [PATCH] Replacing items for quote:", numericId);

      const { error: delItemsErr } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", numericId);

      if (delItemsErr) {
        console.error("💥 [PATCH] Error deleting items:", delItemsErr);
      }

      const itemsToInsert = items.map((item: any) => ({
        quote_id: numericId,
        item_number: item.itemNumber ?? item.item_number ?? null,
        description: item.description ?? null,
        uom: item.uom ?? null,
        notes: item.notes ?? null,
        quantity: item.quantity ?? null,
        unit_price: item.unitPrice ?? item.unit_price ?? null,
        discount: item.discount ?? null,
        discount_type: item.discountType ?? item.discount_type ?? null,
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from("quote_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("💥 [PATCH] Error inserting items:", itemsError);
        } else {
          console.log("✅ [PATCH] Items saved:", itemsToInsert.length);
        }
      }
    }

    // 4️⃣ Admin data (upsert por quote_id → fallback select/update|insert)
    if (admin_data) {
      // Normalización de campos para que calcen con la BDD
      const adminPayload = {
        quote_id: numericId,
        contract_number: admin_data.contract_number ?? admin_data.contractNumber ?? null,
        estimator: admin_data.estimator ?? null,
        division: admin_data.division ?? null,
        // DB usa bid_date (no letting_date). Si viene letting_date desde el front, lo mapeamos:
        bid_date: admin_data.bid_date ?? admin_data.letting_date ?? null,
        owner: admin_data.owner ?? null,
        county: admin_data.county ?? null, // jsonb en DB; si mandás string/obj, Supabase lo guarda como json
        sr_route: admin_data.sr_route ?? admin_data.srRoute ?? null,
        location: admin_data.location ?? null,
        dbe: admin_data.dbe ?? null,
        start_date: admin_data.start_date ?? admin_data.startDate ?? null,
        end_date: admin_data.end_date ?? admin_data.endDate ?? null,
        winter_start: admin_data.winter_start ?? admin_data.winterStart ?? null,
        winter_end: admin_data.winter_end ?? admin_data.winterEnd ?? null,
        ow_travel_time_mins:
          admin_data.ow_travel_time_mins ??
          admin_data.ow_travel_time_minutes ??
          admin_data.owTravelTimeMinutes ??
          admin_data.owTravelTimeMins ??
          null,
        ow_mileage: admin_data.ow_mileage ?? admin_data.owMileage ?? null,
        fuel_cost_per_gallon:
          admin_data.fuel_cost_per_gallon ?? admin_data.fuelCostPerGallon ?? null,
        emergency_job: admin_data.emergency_job ?? admin_data.emergencyJob ?? false,
        rated: admin_data.rated ?? null,
        emergency_fields: admin_data.emergency_fields ?? admin_data.emergencyFields ?? null,
      };

      console.log("🗂️ [PATCH] Admin payload (normalized):", adminPayload);

      // Intento de upsert (requiere UNIQUE (quote_id))
      let adminSaved = false;
      const { error: adminUpsertErr } = await supabase
        .from("admin_data_entries")
        .upsert(adminPayload, { onConflict: "quote_id" });

      if (adminUpsertErr) {
        console.warn(
          "⚠️ [PATCH] upsert by quote_id failed (likely missing UNIQUE on quote_id). Fallback to select→update|insert.",
          adminUpsertErr
        );

        // Fallback: ¿existe ya un registro para esta quote?
        const { data: existing, error: selErr } = await supabase
          .from("admin_data_entries")
          .select("id")
          .eq("quote_id", numericId)
          .maybeSingle();

        if (selErr) {
          console.error("💥 [PATCH] Error selecting admin_data_entries:", selErr);
        } else if (existing?.id) {
          const { error: updErr } = await supabase
            .from("admin_data_entries")
            .update(adminPayload)
            .eq("id", existing.id);

          if (updErr) {
            console.error("💥 [PATCH] Error updating admin_data_entries:", updErr);
          } else {
            console.log("✅ [PATCH] Admin updated. id:", existing.id);
            adminSaved = true;
          }
        } else {
          const { error: insErr } = await supabase
            .from("admin_data_entries")
            .insert(adminPayload);

          if (insErr) {
            console.error("💥 [PATCH] Error inserting admin_data_entries:", insErr);
          } else {
            console.log("✅ [PATCH] Admin inserted for quote:", numericId);
            adminSaved = true;
          }
        }
      } else {
        console.log("✅ [PATCH] Admin upserted by quote_id");
        adminSaved = true;
      }

      if (!adminSaved) {
        console.warn("⚠️ [PATCH] Admin data was not saved (see logs above).");
      }
    }

    console.log("🎉 [PATCH] Quote draft saved OK → id:", numericId);
    return NextResponse.json({ success: true, message: "Quote draft saved" });
  } catch (error) {
    console.error("❌ [PATCH] Unexpected error /quotes:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}

