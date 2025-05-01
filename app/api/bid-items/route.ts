import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { bidEstimateId, items } = await request.json();

    if (!bidEstimateId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Insert all items in a single batch operation
    const { data, error } = await supabase
      .from('bid_estimate_items')
      .insert(items);

    if (error) {
      console.error("Error inserting bid items:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: `${items.length} item(s) saved successfully` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in bid-items API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
