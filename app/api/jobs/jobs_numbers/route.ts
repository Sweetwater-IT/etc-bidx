import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // based on a year and two numbers, it returns jobs within that range.
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!year || !start || !end) {
        return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
    }

    const { data, error } = await supabase
        .from("job_numbers")
        .select("*")
        .eq("year", Number(year))
        .gte("sequential_number", Number(start))
        .lte("sequential_number", Number(end))

    if (error) {
        return NextResponse.json({ error: error.message, ok: false });
    }

    return NextResponse.json({ ok: true, data });

}
