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

    // Fetch takeoff data
    const { data: takeoff, error: takeoffError } = await supabase
      .from("takeoffs_l")
      .select("*")
      .eq("id", takeoffId)
      .single();

    if (takeoffError) {
      console.error("Error fetching takeoff:", takeoffError);
      return NextResponse.json({ error: "Takeoff not found" }, { status: 404 });
    }

    // Fetch takeoff items from the relational table
    const { data: takeoffItems, error: itemsError } = await supabase
      .from("takeoff_items_l")
      .select("*")
      .eq("takeoff_id", takeoffId)
      .order("load_order", { ascending: true });

    if (itemsError) {
      console.error("Error fetching takeoff items:", itemsError);
      return NextResponse.json({ error: "Failed to fetch takeoff items" }, { status: 500 });
    }

    // Format items for PDF generation (generateTakeoffPdf expects this format)
    const formattedItems = (takeoffItems || []).map(item => ({
      product_name: item.product_name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      notes: item.notes, // This is already JSONB, will be serialized
      material: item.material,
    }));

    return NextResponse.json({
      takeoff: {
        ...takeoff,
        items: formattedItems, // Add items array for PDF generation
      },
      takeoffItems: takeoffItems || [], // Raw items for component use
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
