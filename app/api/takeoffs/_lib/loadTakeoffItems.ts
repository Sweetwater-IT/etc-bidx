import { supabase } from "@/lib/supabase";

type TakeoffRecord = {
  id: string;
  is_pickup?: boolean | null;
  parent_takeoff_id?: string | null;
};

const PICKUP_ITEM_SELECT = `
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
`;

const PARENT_ITEM_SELECT = `
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
`;

export async function loadTakeoffItems(takeoff: TakeoffRecord) {
  if (takeoff.is_pickup) {
    return loadPickupTakeoffItems(takeoff);
  }

  const { data, error } = await supabase
    .from("takeoff_items_l")
    .select("*")
    .eq("takeoff_id", takeoff.id)
    .is("deleted_at", null)
    .order("load_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch regular takeoff items: ${error.message}`);
  }

  return data || [];
}

async function loadPickupTakeoffItems(takeoff: TakeoffRecord) {
  if (!takeoff.parent_takeoff_id) {
    return [];
  }

  const { data: pickupTakeoffEntry, error: pickupTakeoffEntryError } = await supabase
    .from("pickup_takeoffs_l")
    .select("id")
    .eq("parent_takeoff_id", takeoff.parent_takeoff_id)
    .maybeSingle();

  if (pickupTakeoffEntryError) {
    throw new Error(`Failed to fetch pickup takeoff entry: ${pickupTakeoffEntryError.message}`);
  }

  if (!pickupTakeoffEntry?.id) {
    return [];
  }

  const { data: pickupItemsData, error: pickupItemsError } = await supabase
    .from("pickup_takeoff_items_l")
    .select(PICKUP_ITEM_SELECT)
    .eq("pickup_takeoff_id", pickupTakeoffEntry.id)
    .order("created_at", { ascending: true });

  if (pickupItemsError) {
    throw new Error(`Failed to fetch pickup takeoff items: ${pickupItemsError.message}`);
  }

  let pickupItems = pickupItemsData || [];

  if ((pickupItems || []).length === 0) {
    const { data: parentTakeoffItems, error: parentTakeoffItemsError } = await supabase
      .from("takeoff_items_l")
      .select("id")
      .eq("takeoff_id", takeoff.parent_takeoff_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (parentTakeoffItemsError) {
      throw new Error(`Failed to fetch parent takeoff items: ${parentTakeoffItemsError.message}`);
    }

    if ((parentTakeoffItems || []).length > 0) {
      const fallbackRows = parentTakeoffItems.map((item) => ({
        pickup_takeoff_id: pickupTakeoffEntry.id,
        parent_item_id: item.id,
        sign_condition: null,
        structure_condition: null,
        light_condition: null,
        pickup_images: {},
        return_details: {},
        notes: null,
      }));

      const { data: insertedPickupItems, error: insertedPickupItemsError } = await supabase
        .from("pickup_takeoff_items_l")
        .insert(fallbackRows)
        .select(PICKUP_ITEM_SELECT);

      if (insertedPickupItemsError) {
        throw new Error(`Failed to create pickup takeoff items: ${insertedPickupItemsError.message}`);
      }

      pickupItems = insertedPickupItems || [];
    }
  }

  const parentItemIds = Array.from(
    new Set((pickupItems || []).map((item) => item.parent_item_id).filter(Boolean))
  );

  if (parentItemIds.length === 0) {
    return [];
  }

  const { data: parentItems, error: parentItemsError } = await supabase
    .from("takeoff_items_l")
    .select(PARENT_ITEM_SELECT)
    .in("id", parentItemIds)
    .is("deleted_at", null);

  if (parentItemsError) {
    throw new Error(`Failed to fetch parent takeoff items: ${parentItemsError.message}`);
  }

  const parentItemsById = new Map<string, any>(
    (parentItems || []).map((item): [string, any] => [String(item.id), item])
  );

  return (pickupItems || [])
    .map((item: any) => {
      const parentItem = parentItemsById.get(String(item.parent_item_id));
      if (!parentItem) return null;

      return {
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
        return_details: item.return_details || {},
        return_condition: null,
        damage_photos: item.pickup_images || {},
        pickup_images: item.pickup_images || {},
        sign_condition: item.sign_condition,
        structure_condition: item.structure_condition,
        light_condition: item.light_condition,
      };
    })
    .filter(Boolean);
}
