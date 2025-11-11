// app/api/quotes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// --------------------
// GET → listado con filtros, paginación, counts y nextNumber
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

    // 🔢 Next Quote Number
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

    let query = supabase
      .from("quotes")
      .select(`
        id,
        quote_number,
        status,
        date_sent,
        type_quote,                                  
        customer_name,
        customer_contact,
        county,
        created_at,
        updated_at,
        estimate_id,
        etc_job_number,
        job_id,
        quote_items ( id ),
        files ( id ),
        quotes_customers (
          contractors ( id, name )
        ),
        quote_recipients ( email, point_of_contact )
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

    console.log("🪵 [GET /quotes] Raw data:", JSON.stringify(rawData, null, 2));

    const transformedData: any[] = [];

    for (const row of rawData) {
      let adminData: any = null;

      if (row.estimate_id) {
        const { data } = await supabase
          .from("admin_data_entries")
          .select("*")
          .eq("bid_estimate_id", row.estimate_id)
          .maybeSingle();
        adminData = data;
      } else if (row.job_id) {
        const { data } = await supabase
          .from("admin_data_entries")
          .select("*")
          .eq("job_id", row.job_id)
          .maybeSingle();
        adminData = data;
      }

      const contractor = row.quotes_customers?.[0]?.contractors;
      const customerName =
        contractor && "name" in contractor ? contractor.name : "Unknown Customer";

      const transformedRow: any = {
        id: row.id,
        quote_number: row.quote_number,
        status: row.status,
        type: row.type_quote,
        date_sent: row.date_sent,
        estimate_id: row.estimate_id ?? null,
        job_id: row.job_id ?? null,
        customer_name: row.customer_name,
        point_of_contact: row.customer_contact,
        point_of_contact_email: row.quote_recipients?.[0]?.email || "",
        total_items: row.quote_items?.length || 0,
        county: row.county,
        updated_at: row.updated_at,
        created_at: row.created_at,
        has_attachments: (row.files?.length || 0) > 0,
        estimate_contract_number: adminData?.contract_number ?? null,
        etc_job_number: row.etc_job_number || "",
        job_number: row.job_id ?? null,
      };

      console.log("🪵 [GET /quotes] Transformed row:", JSON.stringify(transformedRow, null, 2));
      transformedData.push(transformedRow);
    }

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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      estimate_id = null,
      job_id = null,
      admin_data,
      customers,
      recipients,
      items,
      quoteId: quoteIdCreated,
      bid_date, start_date, end_date,
      userEmail,
      ...rest
    } = body;

    if (quoteIdCreated) {
      const { data: updated, error: updateError } = await supabase
        .from("quotes")
        .update({
          ...rest,
          estimate_id,
          job_id,
          bid_date: bid_date || null,
          start_date: start_date || null,
          end_date: end_date || null,
          status: "Not Sent",
          updated_at: new Date().toISOString(),
        })
        .eq("id", quoteIdCreated)
        .select("id, quote_number, estimate_id, job_id")
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, message: "Failed to update quote", error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }


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

    const cleanRest = {
      ...rest,
      bid_date: bid_date || null,
      start_date: start_date || null,
      end_date: end_date || null,
    };

    const { data: quoteData, error: quoteError } = await supabase
      .from("quotes")
      .insert([{
        quote_number: nextQuoteNumber,
        status: "DRAFT",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimate_id,
        job_id,
        user_created: userEmail,
        ...cleanRest
      }])
      .select("id, quote_number, estimate_id, job_id")
      .single();


    if (quoteError || !quoteData) {
      console.error("Error creating draft:", quoteError);
      return NextResponse.json(
        { success: false, message: "Failed to create draft", error: quoteError?.message || "No data" },
        { status: 500 }
      );
    }

    const quoteId = quoteData.id;

    if (admin_data) {
      const adminPayload: any = {
        contract_number: admin_data.contract_number ?? admin_data.contractNumber ?? null,
        estimator: admin_data.estimator ?? null,
        division: admin_data.division ?? null,
        bid_date: admin_data.bid_date ?? admin_data.letting_date ?? null,
        owner: admin_data.owner ?? null,
        county: admin_data.county ?? null,
        location: admin_data.location ?? null,
        start_date: admin_data.start_date ?? admin_data.startDate ?? null,
        end_date: admin_data.end_date ?? admin_data.endDate ?? null,
        bid_estimate_id: estimate_id,
        job_id: job_id,
      };

      let conflictKey: "bid_estimate_id" | "job_id" | null = null;
      if (estimate_id) conflictKey = "bid_estimate_id";
      else if (job_id) conflictKey = "job_id";

      if (conflictKey) {
        await supabase
          .from("admin_data_entries")
          .upsert(adminPayload, { onConflict: conflictKey });
      }
    }

    // Insertar customers
    if (Array.isArray(customers) && customers.length > 0) {
      const customersToInsert = customers.map((c: any) => ({
        quote_id: quoteId,
        contractor_id: c.id ?? c.contractor_id,
      }));
      await supabase.from("quotes_customers").insert(customersToInsert);
    }

    // Insertar recipients
    if (Array.isArray(recipients) && recipients.length > 0) {
      const recipientsToInsert = recipients.map((r: any) => ({
        quote_id: quoteId,
        email: r.email ?? null,
        cc: r.cc ?? false,
        bcc: r.bcc ?? false,
        point_of_contact: r.point_of_contact ?? false,
        customer_contacts_id: r.customer_contacts_id ?? null,
      }));
      await supabase.from("quote_recipients").insert(recipientsToInsert);
    }

    if (Array.isArray(items) && items.length > 0) {
      const validItems = items.filter((i: any) => {
        const parsedId = Number(i.id);
        return !isNaN(parsedId) && isFinite(parsedId);
      });

      if (validItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("quote_items")
          .update({ quote_id: quoteId })
          .in("id", validItems.map((i: any) => i.id));

        if (itemsError) {
          console.error("Error linking items:", itemsError);
          return NextResponse.json(
            { success: false, message: "Failed to link items", error: itemsError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true, data: quoteData });
  } catch (err) {
    console.error("Unexpected error POST /quotes:", err);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(err) },
      { status: 500 }
    );
  }
}


// --------------------
// PATCH → update draft (quotes + recipients + items + admin_data + customers)
// --------------------

function sanitizeDates<T extends Record<string, any>>(obj: any, keys: any[]): T {
  const copy = { ...obj }
  for (const key of keys) {
    if (copy[key] === "") copy[key] = null
  }
  return copy
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      items,
      admin_data,
      status,
      subject,
      body: emailBody,
      from_email,
      recipients,
      customers,
      payment_terms,
      include_terms,
      custom_terms,
      userEmail,
      ...restQuote
    } = body;

    const numericId = Number(id);

    if (!id || isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "Skipping update because quote has no valid ID yet" },
        { status: 200 }
      );
    }

    // Status seguro
    const allowedStatuses = new Set(["Not Sent", "Sent", "Accepted", "DRAFT", 'Declined']);
    const safeStatus = allowedStatuses.has(status) ? status : "DRAFT";

    // County flexible
    let countyValue: string | null = null;
    if (typeof admin_data?.county === "string") countyValue = admin_data.county;
    else if (typeof admin_data?.county === "object" && admin_data?.county?.country)
      countyValue = admin_data.county.country;


    let quoteUpdate: any = {
      status: safeStatus,
      subject: subject ?? null,
      body: emailBody ?? null,
      from_email: from_email ?? null,
      updated_at: new Date().toISOString(),
      county: countyValue,
      payment_terms: payment_terms ?? 'NET30',
      custom_terms_conditions: custom_terms ?? null,
      standard_terms: include_terms?.["standard-terms"] ?? false,
      rental_agreements: include_terms?.["rental-agreements"] ?? false,
      equipment_sale: include_terms?.["equipment-sale"] ?? false,
      flagging_terms: include_terms?.["flagging-terms"] ?? false,
      ...restQuote,
    };

    if (status === 'Sent') {
      quoteUpdate.user_sent = userEmail;
      quoteUpdate.date_sent = new Date();
    } else {
      quoteUpdate.user_sent = '';
      quoteUpdate.date_sent = null

    }

    quoteUpdate = sanitizeDates(quoteUpdate, ["start_date", "end_date", "bid_date"]);

    const { error: quoteError } = await supabase
      .from("quotes")
      .update(quoteUpdate)
      .eq("id", numericId);

    if (quoteError)
      return NextResponse.json(
        { success: false, message: "Failed to update quote", error: quoteError.message },
        { status: 500 }
      );

    if (admin_data) {
      const adminPayload: any = {
        contract_number: admin_data.contract_number ?? admin_data.contractNumber ?? null,
        estimator: admin_data.estimator ?? null,
        division: admin_data.division ?? null,
        bid_date: admin_data.bid_date ?? admin_data.letting_date ?? null,
        owner: admin_data.owner ?? null,
        county: admin_data.county ?? null,
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
        fuel_cost_per_gallon: admin_data.fuel_cost_per_gallon ?? admin_data.fuelCostPerGallon ?? null,
        emergency_job: admin_data.emergency_job ?? admin_data.emergencyJob ?? false,
        rated: admin_data.rated ?? null,
        emergency_fields: admin_data.emergency_fields ?? admin_data.emergencyFields ?? null,
        bid_estimate_id: body.estimate_id ?? null,
        job_id: body.job_id ?? null,
      };

      let conflictKey: "bid_estimate_id" | "job_id" | null = null;
      if (body.estimate_id) conflictKey = "bid_estimate_id";
      else if (body.job_id) conflictKey = "job_id";

      if (conflictKey) {
        await supabase
          .from("admin_data_entries")
          .upsert(adminPayload, { onConflict: conflictKey });
      }
    }

    // Customers
    if (Array.isArray(customers)) {
      await supabase.from("quotes_customers").delete().eq("quote_id", numericId);
      const customersToInsert = customers.map((c: any) => ({
        quote_id: numericId,
        contractor_id: c.id ?? c.contractor_id,
      }));
      if (customersToInsert.length > 0) await supabase.from("quotes_customers").insert(customersToInsert);
    }

    // Recipients
    if (Array.isArray(recipients)) {
      await supabase.from("quote_recipients").delete().eq("quote_id", numericId);
      const recipientsToInsert = recipients.map((r: any) => ({
        quote_id: numericId,
        email: r.email ?? null,
        cc: r.cc ?? false,
        bcc: r.bcc ?? false,
        point_of_contact: r.point_of_contact ?? false,
        customer_contacts_id: r.customer_contacts_id ?? null,
      }));
      if (recipientsToInsert.length > 0) await supabase.from("quote_recipients").insert(recipientsToInsert);
    }

    return NextResponse.json({ success: true, message: "Quote draft saved" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}

// --------------------
// DELETE → desvincular y borrar admin_data de una quote
// --------------------
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Quote ID is required" },
        { status: 400 }
      );
    }

    const numericId = Number(id);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "Invalid quote ID" },
        { status: 400 }
      );
    }

    const { data: quoteRow, error: fetchErr } = await supabase
      .from("quotes")
      .select("estimate_id, job_id")
      .eq("id", numericId)
      .maybeSingle();

    if (fetchErr || !quoteRow) {
      return NextResponse.json(
        { success: false, message: "Quote not found", error: fetchErr?.message },
        { status: 404 }
      );
    }

    const { error: updateErr } = await supabase
      .from("quotes")
      .update({
        estimate_id: null,
        job_id: null,
        county: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", numericId);

    if (updateErr) {
      return NextResponse.json(
        { success: false, message: "Failed to update quote", error: updateErr.message },
        { status: 500 }
      );
    }

    if (quoteRow.estimate_id) {
      await supabase.from("admin_data_entries").delete().eq("bid_estimate_id", quoteRow.estimate_id);
    }
    if (quoteRow.job_id) {
      await supabase.from("admin_data_entries").delete().eq("job_id", quoteRow.job_id);
    }

    return NextResponse.json({ success: true, message: "Admin data removed from quote" });
  } catch (error) {
    console.error("💥 [DELETE /quotes] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}
