import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Work order ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("build_requests_l")
      .select("*")
      .eq("work_order_id", id)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Error fetching work order build requests:", error);
      return NextResponse.json({ error: "Failed to fetch build requests" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Unexpected error fetching work order build requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
