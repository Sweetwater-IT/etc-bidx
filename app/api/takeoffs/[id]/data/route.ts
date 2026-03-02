import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const takeoffId = params.id;

    if (!takeoffId) {
      return NextResponse.json({ error: "Takeoff ID is required" }, { status: 400 });
    }

    const [tRes, tiRes] = await Promise.all([
      supabase.from("takeoffs").select("*").eq("id", takeoffId).single(),
      supabase.from("takeoff_items").select("*").eq("takeoff_id", takeoffId).order("created_at"),
    ]);

    if (tRes.error) {
      console.error("Error fetching takeoff:", tRes.error);
      return NextResponse.json({ error: "Takeoff not found" }, { status: 404 });
    }

    if (tiRes.error) {
      console.error("Error fetching takeoff items:", tiRes.error);
      return NextResponse.json({ error: "Failed to fetch takeoff items" }, { status: 500 });
    }

    return NextResponse.json({
      takeoff: tRes.data,
      takeoffItems: tiRes.data || [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}