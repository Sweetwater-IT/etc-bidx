import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface QuoteGridView {
  id: number;
  quote_number: string | null;
  status: "Not Sent" | "Sent" | "Accepted" | null;
  date_sent: string | null;
  customer_name: string; // queda vacío porque hay que join con quotes_customers + contractors
  point_of_contact: string; // idem con quote_recipients
  point_of_contact_email: string;
  total_items: number; // idem con quote_items
  county: string | null;
  updated_at: string | null;
  has_attachments: boolean; // idem con files
  estimate_contract_number?: string;
  job_number?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const orderBy = "date_sent";
    const ascending = searchParams.get("ascending") === "true";
    const counts = searchParams.get("counts") === "true";
    const nextNumber = searchParams.get("nextNumber") === "true";
    const detailed = searchParams.get("detailed") === "true";

    // -------------------
    // 📊 Counts
    // -------------------
    if (counts) {
      const { data: allQuotes, error: countError } = await supabase
        .from("quotes")
        .select("id, status");

      if (countError || !allQuotes) {
        return NextResponse.json(
          { error: "Failed to fetch quote counts", details: countError },
          { status: 500 }
        );
      }

      const countData = {
        all: allQuotes.length,
        not_sent: allQuotes.filter((q) => q.status === "Not Sent").length,
        sent: allQuotes.filter((q) => q.status === "Sent").length,
        accepted: allQuotes.filter((q) => q.status === "Accepted").length,
      };

      return NextResponse.json(countData);
    }

    // -------------------
    // 🔢 Next Quote Number
    // -------------------
    if (nextNumber) {
      const { data: latestQuote, error: quoteError } = await supabase
        .from("quotes")
        .select("quote_number")
        .order("quote_number", { ascending: false })
        .limit(1);

      if (quoteError) {
        return NextResponse.json(
          { error: "Failed to fetch latest quote number", details: quoteError },
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

      return NextResponse.json({ nextQuoteNumber });
    }

    // -------------------
    // 📑 Pagination
    // -------------------
    const offset = (page - 1) * limit;

    if (detailed) {
      // 🔎 Detailed → get all raw fields
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
      // 📊 Grid view (simplificado, solo con campos nativos de quotes)
      let query = supabase
        .from("quotes")
        .select("id, quote_number, status, date_sent, county, updated_at")
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
        customer_name: "", // acá deberías join con contractors via quotes_customers
        point_of_contact: "", // join con quote_recipients
        point_of_contact_email: "",
        total_items: 0, // join con quote_items
        county: row.county,
        updated_at: row.updated_at,
        has_attachments: false, // join con files
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
