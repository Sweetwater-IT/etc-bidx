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

    let takeoffItems: any[] = [];

    if (takeoff.is_pickup) {
      // This is a pickup takeoff - query pickup tables and join with parent items
      console.log('🔍 [DATA API] Fetching pickup takeoff items for:', takeoffId);

      // First get the pickup takeoff entry ID
      const { data: pickupTakeoffEntry, error: pickupTakeoffEntryError } = await supabase
        .from("pickup_takeoffs_l")
        .select("id")
        .eq("parent_takeoff_id", takeoffId)
        .single();

      if (pickupTakeoffEntryError || !pickupTakeoffEntry) {
        console.error("Error finding pickup takeoff entry:", pickupTakeoffEntryError);
        return NextResponse.json({ error: "Pickup takeoff entry not found" }, { status: 404 });
      }

      const { data: pickupItems, error: pickupItemsError } = await supabase
        .from("pickup_takeoff_items_l")
        .select(`
          id,
          pickup_takeoff_id,
          parent_item_id,
          sign_condition,
          structure_condition,
          light_condition,
          pickup_images,
          return_details,
          notes,
          created_at,
          updated_at,
          takeoff_items_l!inner (
            id,
            product_name,
            category,
            unit,
            quantity,
            requisition_type,
            notes,
            in_stock_qty,
            to_order_qty,
            inventory_status,
            material,
            sign_details,
            sign_description,
            sheeting,
            width_inches,
            height_inches,
            sqft,
            total_sqft,
            load_order,
            cover,
            secondary_signs
          )
        `)
        .eq("pickup_takeoff_id", pickupTakeoffEntry.id)
        .order("created_at");

      if (pickupItemsError) {
        console.error("Error fetching pickup takeoff items:", pickupItemsError);
        return NextResponse.json({ error: "Failed to fetch pickup takeoff items" }, { status: 500 });
      }

      // Transform the data to match the expected format
      takeoffItems = (pickupItems || []).map((item: any) => ({
        id: item.id,
        product_name: item.takeoff_items_l.product_name,
        category: item.takeoff_items_l.category,
        unit: item.takeoff_items_l.unit,
        quantity: item.takeoff_items_l.quantity,
        requisition_type: item.takeoff_items_l.requisition_type,
        notes: item.takeoff_items_l.notes,
        in_stock_qty: item.takeoff_items_l.in_stock_qty,
        to_order_qty: item.takeoff_items_l.to_order_qty,
        inventory_status: item.takeoff_items_l.inventory_status,
        material: item.takeoff_items_l.material,
        sign_details: item.takeoff_items_l.sign_details,
        sign_description: item.takeoff_items_l.sign_description,
        sheeting: item.takeoff_items_l.sheeting,
        width_inches: item.takeoff_items_l.width_inches,
        height_inches: item.takeoff_items_l.height_inches,
        sqft: item.takeoff_items_l.sqft,
        total_sqft: item.takeoff_items_l.total_sqft,
        load_order: item.takeoff_items_l.load_order,
        cover: item.takeoff_items_l.cover,
        secondary_signs: item.takeoff_items_l.secondary_signs,
        // Pickup-specific fields
        return_details: item.return_details || {},
        return_condition: null, // Legacy field, not used
        damage_photos: item.pickup_images || {},
        pickup_condition: null, // Legacy field, not used
        pickup_images: item.pickup_images || [],
        sign_condition: item.sign_condition,
        structure_condition: item.structure_condition,
        light_condition: item.light_condition,
      }));

      console.log('🔍 [DATA API] Found pickup items:', takeoffItems.length);
    } else {
      // Regular takeoff - query regular items table
      console.log('🔍 [DATA API] Fetching regular takeoff items for:', takeoffId);

      const { data: items, error: itemsError } = await supabase
        .from("takeoff_items_l")
        .select("*")
        .eq("takeoff_id", takeoffId)
        .order("created_at");

      if (itemsError) {
        console.error("Error fetching takeoff items:", itemsError);
        return NextResponse.json({ error: "Failed to fetch takeoff items" }, { status: 500 });
      }

      takeoffItems = items || [];
      console.log('🔍 [DATA API] Found regular items:', takeoffItems.length);
    }

    return NextResponse.json({
      takeoff,
      takeoffItems,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
