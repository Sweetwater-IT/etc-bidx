// app/api/estimates/[id]/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: any
) {

  const resolvedParams = await params
  const estimateId = parseInt(resolvedParams.id)
  
  try {
    const tables = [
      { name: "sale_items", columns: "id, item_number, name, quantity, quote_price, uom, notes" },
      { name: "equipment_rental_entries", columns: "id, name, quantity, rent_price" },
      { name: "service_work_entries", columns: "id, standard_lump_sum, number_trucks, additional_equipment_cost" },
      { name: "flagging_entries", columns: "id, standard_lump_sum, number_trucks, additional_equipment_cost" },
    ];

    const allItems: any[] = [];

    for (const t of tables) {
      const { data, error } = await supabase
        .from(t.name)
        .select(t.columns)
        .eq("bid_estimate_id", estimateId);

      if (error) throw error;

      if (data) {
        const mapped = data.map((row: any) => ({
          id: row.id,
          itemNumber: row.item_number || "",
          description: row.name || row.notes || "N/A",
          uom: row.uom || "EA",
          quantity: row.quantity || row.number_trucks || 1,
          unitPrice:
            row.quote_price ||
            row.rent_price ||
            row.standard_lump_sum ||
            row.additional_equipment_cost ||
            0,
          discount: 0,
          discountType: "dollar",
          notes: row.notes || "",
          associatedItems: [],
        }));
        allItems.push(...mapped);
      }
    }

    return NextResponse.json(allItems, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error fetching estimate items:", err);
    return NextResponse.json(
      { error: "Failed to fetch estimate items", details: err.message },
      { status: 500 }
    );
  }
}
