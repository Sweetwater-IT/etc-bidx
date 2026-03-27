import { supabase } from "@/lib/supabase";

type TakeoffRecord = {
  id: string;
  is_pickup?: boolean | null;
  parent_takeoff_id?: string | null;
  job_id?: string | null;
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

  const { data: parentItems, error: parentItemsError } = await supabase
    .from("takeoff_items_l")
    .select(PARENT_ITEM_SELECT)
    .eq("takeoff_id", takeoff.parent_takeoff_id)
    .is("deleted_at", null)
    .order("load_order", { ascending: true });

  if (parentItemsError) {
    throw new Error(`Failed to fetch parent takeoff items: ${parentItemsError.message}`);
  }

  const currentParentItems = parentItems || [];
  const currentParentItemIds = new Set(currentParentItems.map((item) => String(item.id)));

  if (currentParentItems.length === 0) {
    return [];
  }

  const { data: pickupTakeoffEntries, error: pickupTakeoffEntriesError } = await supabase
    .from("pickup_takeoffs_l")
    .select("id, created_at")
    .eq("parent_takeoff_id", takeoff.parent_takeoff_id)
    .order("created_at", { ascending: false });

  if (pickupTakeoffEntriesError) {
    throw new Error(`Failed to fetch pickup takeoff entries: ${pickupTakeoffEntriesError.message}`);
  }

  let selectedEntry = (pickupTakeoffEntries || [])[0] || null;
  let pickupItems: any[] = [];

  if ((pickupTakeoffEntries || []).length > 0) {
    const entryIds = pickupTakeoffEntries!.map((entry) => entry.id);

    const { data: allPickupItems, error: pickupItemsError } = await supabase
      .from("pickup_takeoff_items_l")
      .select(PICKUP_ITEM_SELECT)
      .in("pickup_takeoff_id", entryIds)
      .order("created_at", { ascending: true });

    if (pickupItemsError) {
      throw new Error(`Failed to fetch pickup takeoff items: ${pickupItemsError.message}`);
    }

    const rowsByEntryId = new Map<string, any[]>();
    for (const row of allPickupItems || []) {
      const entryRows = rowsByEntryId.get(row.pickup_takeoff_id) || [];
      entryRows.push(row);
      rowsByEntryId.set(row.pickup_takeoff_id, entryRows);
    }

    const rankedEntries = pickupTakeoffEntries!.map((entry) => {
      const rows = rowsByEntryId.get(entry.id) || [];
      const matchingRows = rows.filter((row) => currentParentItemIds.has(String(row.parent_item_id)));
      return {
        entry,
        rows,
        matchingRows,
        overlapCount: matchingRows.length,
      };
    }).sort((a, b) => {
      if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;
      if (b.matchingRows.length !== a.matchingRows.length) return b.matchingRows.length - a.matchingRows.length;
      return String(b.entry.created_at || "").localeCompare(String(a.entry.created_at || ""));
    });

    if (rankedEntries.length > 0) {
      selectedEntry = rankedEntries[0].entry;
      pickupItems = rankedEntries[0].matchingRows;
    }
  }

  if (!selectedEntry) {
    if (!takeoff.job_id) {
      return [];
    }

    const { data: createdEntry, error: createdEntryError } = await supabase
      .from("pickup_takeoffs_l")
      .insert({
        parent_takeoff_id: takeoff.parent_takeoff_id,
        job_id: takeoff.job_id,
      })
      .select("id, created_at")
      .single();

    if (createdEntryError || !createdEntry) {
      throw new Error(`Failed to create pickup takeoff entry: ${createdEntryError?.message || "Unknown error"}`);
    }

    selectedEntry = createdEntry;
  }

  const selectedParentItemIds = new Set(pickupItems.map((item) => String(item.parent_item_id)));
  const missingParentItems = currentParentItems.filter((item) => !selectedParentItemIds.has(String(item.id)));

  if (missingParentItems.length > 0) {
    const missingRows = missingParentItems.map((item) => ({
      pickup_takeoff_id: selectedEntry.id,
      parent_item_id: item.id,
      sign_condition: null,
      structure_condition: null,
      light_condition: null,
      pickup_images: [],
      return_details: {},
      notes: null,
    }));

    const { data: insertedPickupItems, error: insertedPickupItemsError } = await supabase
      .from("pickup_takeoff_items_l")
      .insert(missingRows)
      .select(PICKUP_ITEM_SELECT);

    if (insertedPickupItemsError) {
      throw new Error(`Failed to create missing pickup takeoff items: ${insertedPickupItemsError.message}`);
    }

    pickupItems = [...pickupItems, ...(insertedPickupItems || [])];
  }

  const parentItemsById = new Map<string, any>(
    currentParentItems.map((item): [string, any] => [String(item.id), item])
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
        pickup_images: item.pickup_images || [],
        sign_condition: item.sign_condition,
        structure_condition: item.structure_condition,
        light_condition: item.light_condition,
      };
    })
    .filter(Boolean);
}
