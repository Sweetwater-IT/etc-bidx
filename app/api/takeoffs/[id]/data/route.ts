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
      // This is a pickup takeoff - query pickup rows first, then hydrate parent items manually.
      // There is no FK between pickup_takeoff_items_l.parent_item_id and takeoff_items_l.id.
      console.log('🔍 [DATA API] Fetching pickup takeoff items for:', takeoffId);

      // First get the pickup takeoff entry ID using the parent_takeoff_id from the pickup takeoff
      const { data: pickupTakeoffEntry, error: pickupTakeoffEntryError } = await supabase
        .from("pickup_takeoffs_l")
        .select("id")
        .eq("parent_takeoff_id", takeoff.parent_takeoff_id)
        .maybeSingle();

      console.log('🔍 [DATA API] Pickup takeoff entry lookup:', {
        parent_takeoff_id: takeoffId,
        found: !!pickupTakeoffEntry,
        error: pickupTakeoffEntryError?.message
      });

      if (pickupTakeoffEntryError || !pickupTakeoffEntry) {
        console.error("🔍 [DATA API] Error finding pickup takeoff entry:", pickupTakeoffEntryError);
        return NextResponse.json({ error: "Pickup takeoff entry not found" }, { status: 404 });
      }

      console.log('🔍 [DATA API] Found pickup takeoff entry ID:', pickupTakeoffEntry.id);

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
          updated_at
        `)
        .eq("pickup_takeoff_id", pickupTakeoffEntry.id)
        .order("created_at");

      console.log('🔍 [DATA API] Pickup items query result:', {
        error: pickupItemsError?.message,
        itemCount: pickupItems?.length || 0,
        items: pickupItems?.slice(0, 3).map(item => ({
          id: item.id,
          parent_item_id: item.parent_item_id,
        })) || []
      });

      if (pickupItemsError) {
        console.error("🔍 [DATA API] Error fetching pickup takeoff items:", pickupItemsError);
        return NextResponse.json({ error: "Failed to fetch pickup takeoff items" }, { status: 500 });
      }

      const parentItemIds = Array.from(
        new Set((pickupItems || []).map((item) => item.parent_item_id).filter(Boolean))
      );

      const { data: parentItems, error: parentItemsError } = parentItemIds.length > 0
        ? await supabase
            .from("takeoff_items_l")
            .select(`
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
            `)
            .in("id", parentItemIds)
            .is("deleted_at", null)
        : { data: [], error: null };

      console.log('🔍 [DATA API] Parent item lookup result:', {
        error: parentItemsError?.message,
        parentItemCount: parentItems?.length || 0,
      });

      if (parentItemsError) {
        console.error("🔍 [DATA API] Error fetching parent takeoff items:", parentItemsError);
        return NextResponse.json({ error: "Failed to fetch parent takeoff items" }, { status: 500 });
      }

      const parentItemsById = new Map<string, any>(
        (parentItems || []).map((item): [string, any] => [String(item.id), item])
      );

      // Transform the data to match the expected format
      takeoffItems = (pickupItems || [])
        .map((item: any) => {
          const parentItem = parentItemsById.get(item.parent_item_id) as any;
          if (!parentItem) {
            console.warn('🔍 [DATA API] Missing parent takeoff item for pickup row:', {
              pickupItemId: item.id,
              parent_item_id: item.parent_item_id,
            });
            return null;
          }

          const transformed = {
            id: item.id,
            product_name: parentItem.product_name,
            category: parentItem.category,
            unit: parentItem.unit,
            quantity: parentItem.quantity,
            requisition_type: parentItem.requisition_type,
            notes: parentItem.notes,
            in_stock_qty: parentItem.in_stock_qty,
            to_order_qty: parentItem.to_order_qty,
            inventory_status: parentItem.inventory_status,
            material: parentItem.material,
            sign_details: parentItem.sign_details,
            sign_description: parentItem.sign_description,
            sheeting: parentItem.sheeting,
            width_inches: parentItem.width_inches,
            height_inches: parentItem.height_inches,
            sqft: parentItem.sqft,
            total_sqft: parentItem.total_sqft,
            load_order: parentItem.load_order,
            cover: parentItem.cover,
            secondary_signs: parentItem.secondary_signs,
            // Pickup-specific fields
            return_details: item.return_details || {},
            return_condition: null,
            damage_photos: item.pickup_images || {},
            pickup_condition: null,
            pickup_images: item.pickup_images || [],
            sign_condition: item.sign_condition,
            structure_condition: item.structure_condition,
            light_condition: item.light_condition,
          };

          console.log('🔍 [DATA API] Transformed item:', {
            id: transformed.id,
            product_name: transformed.product_name,
            category: transformed.category,
            hasReturnDetails: Object.keys(transformed.return_details).length > 0
          });

          return transformed;
        })
        .filter(Boolean);

      console.log('🔍 [DATA API] Final transformed pickup items:', takeoffItems.length);
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
