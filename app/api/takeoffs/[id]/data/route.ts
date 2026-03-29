import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { loadTakeoffItems } from "@/app/api/takeoffs/_lib/loadTakeoffItems";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: takeoffId } = await context.params;

    if (!takeoffId) {
      return NextResponse.json({ error: "Takeoff ID is required" }, { status: 400 });
    }

    // First check if this is a pickup takeoff
    const { data: takeoff, error: takeoffError } = await supabase
      .from("takeoffs_l")
      .select("*")
      .eq("id", takeoffId)
      .single();

    if (takeoffError) {
      console.error("Error fetching takeoff:", takeoffError);
      return NextResponse.json({ error: "Takeoff not found" }, { status: 404 });
    }

    const takeoffItems = await loadTakeoffItems(takeoff);

    return NextResponse.json({
      takeoff,
      takeoffItems,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
