import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: takeoffId } = await context.params;

    if (!takeoffId) {
      return NextResponse.json({ error: "Takeoff ID is required" }, { status: 400 });
    }

    const { data: takeoff, error: takeoffError } = await supabase
      .from("takeoffs_l")
      .select("*")
      .eq("id", takeoffId)
      .single();

    if (takeoffError) {
      console.error("Error fetching takeoff:", takeoffError);
      return NextResponse.json({ error: "Takeoff not found" }, { status: 404 });
    }

    // Items are stored in sign_rows JSONB column, no separate query needed
    return NextResponse.json({
      takeoff: takeoff,
      takeoffItems: [], // Empty array for backward compatibility
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}