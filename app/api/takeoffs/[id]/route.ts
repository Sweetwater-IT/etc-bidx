import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RelatedTakeoffSummary = {
  id: string;
  title: string;
  work_type: string;
  work_order_id: string | null;
  work_order_number: string | null;
  is_pickup: boolean;
  parent_takeoff_id: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API: Fetching takeoff with ID:', id);

    if (!id) {
      console.log('API: No takeoff ID provided');
      return NextResponse.json({ error: 'Takeoff ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('takeoffs_l')
      .select(`
        id,
        title,
        work_type,
        is_pickup,
        parent_takeoff_id,
        status,
        created_at,
        updated_at,
        install_date,
        pickup_date,
        needed_by_date,
        is_multi_day_job,
        end_date,
        work_order_number,
        work_order_id,
        job_id,
        contracted_or_additional,
        priority,
        notes,
        crew_notes,
        build_shop_notes,
        pm_notes,
        active_sections,
        sign_rows,
        default_sign_material,
        active_permanent_items,
        permanent_sign_rows,
        permanent_entry_rows,
        default_permanent_sign_material,
        vehicle_items,
        rolling_stock_items,
        additional_items
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('API: Error fetching takeoff:', error);
      console.error('API: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ error: 'Takeoff not found' }, { status: 404 });
    }

    // Auto-backfill work_order_id/work_order_number if missing but work orders exist
    // (Older records may have work_orders_l rows without the takeoff header fields being populated)
    if (!data.work_order_id) {
      const { data: latestWO, error: latestWOError } = await supabase
        .from('work_orders_l')
        .select('id, wo_number')
        .eq('takeoff_id', id)
        .order('wo_number', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (latestWOError) {
        console.error('API: Error looking up latest work order for takeoff:', latestWOError);
      } else if (latestWO?.id) {
        const backfill: { work_order_id: string; work_order_number?: string } = {
          work_order_id: latestWO.id,
        };

        // takeoffs_l.work_order_number is TEXT in the current schema
        if (latestWO.wo_number !== null && latestWO.wo_number !== undefined) {
          backfill.work_order_number = String(latestWO.wo_number);
        }

        const { error: backfillError } = await supabase
          .from('takeoffs_l')
          .update(backfill)
          .eq('id', id);

        if (backfillError) {
          console.error('API: Failed to backfill takeoff work order fields:', backfillError);
        } else {
          data.work_order_id = latestWO.id;
          if (backfill.work_order_number) {
            data.work_order_number = backfill.work_order_number;
          }
        }
      }
    }

    let parentTakeoff: RelatedTakeoffSummary | null = null;
    let pickupTakeoff: RelatedTakeoffSummary | null = null;

    if (data.parent_takeoff_id) {
      const { data: parent } = await supabase
        .from('takeoffs_l')
        .select('id, title, work_type, work_order_id, work_order_number, is_pickup, parent_takeoff_id')
        .eq('id', data.parent_takeoff_id)
        .maybeSingle();
      parentTakeoff = parent || null;
    }

    if (!data.is_pickup) {
      const { data: child } = await supabase
        .from('takeoffs_l')
        .select('id, title, work_type, work_order_id, work_order_number, is_pickup, parent_takeoff_id')
        .eq('parent_takeoff_id', id)
        .eq('is_pickup', true)
        .maybeSingle();
      pickupTakeoff = child || null;
    }

    let takeoffItems: any[] = [];

    if (data.is_pickup) {
      const { data: pickupTakeoffEntry, error: pickupTakeoffEntryError } = await supabase
        .from('pickup_takeoffs_l')
        .select('id')
        .eq('parent_takeoff_id', data.parent_takeoff_id)
        .maybeSingle();

      if (pickupTakeoffEntryError) {
        console.error('API: Error fetching pickup takeoff entry:', pickupTakeoffEntryError);
      } else if (pickupTakeoffEntry?.id) {
        const { data: pickupItems, error: pickupItemsError } = await supabase
          .from('pickup_takeoff_items_l')
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
          .eq('pickup_takeoff_id', pickupTakeoffEntry.id)
          .order('created_at', { ascending: true });

        if (pickupItemsError) {
          console.error('API: Error fetching pickup takeoff items:', pickupItemsError);
        } else {
          const parentItemIds = Array.from(
            new Set((pickupItems || []).map((item) => item.parent_item_id).filter(Boolean))
          );

          const { data: parentItems, error: parentItemsError } = parentItemIds.length > 0
            ? await supabase
                .from('takeoff_items_l')
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
                .in('id', parentItemIds)
                .is('deleted_at', null)
            : { data: [], error: null };

          if (parentItemsError) {
            console.error('API: Error fetching parent takeoff items:', parentItemsError);
          } else {
            const parentItemsById = new Map<string, any>(
              (parentItems || []).map((item): [string, any] => [String(item.id), item])
            );

            takeoffItems = (pickupItems || [])
              .map((item: any) => {
                const parentItem = parentItemsById.get(item.parent_item_id) as any;
                if (!parentItem) {
                  console.warn('API: Missing parent takeoff item for pickup row:', {
                    pickupItemId: item.id,
                    parent_item_id: item.parent_item_id,
                  });
                  return null;
                }

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
                  pickup_images: item.pickup_images || [],
                  sign_condition: item.sign_condition,
                  structure_condition: item.structure_condition,
                  light_condition: item.light_condition,
                };
              })
              .filter(Boolean);
          }
        }
      }
    } else {
      const { data: regularTakeoffItems, error: takeoffItemsError } = await supabase
        .from('takeoff_items_l')
        .select('*')
        .eq('takeoff_id', id)
        .is('deleted_at', null)
        .order('load_order', { ascending: true });

      if (takeoffItemsError) {
        console.error('API: Error fetching takeoff items:', takeoffItemsError);
      } else {
        takeoffItems = regularTakeoffItems || [];
      }
    }

    console.log('API: Successfully fetched takeoff:', data);
    return NextResponse.json({
      ...data,
      parent_takeoff: parentTakeoff,
      pickup_takeoff: pickupTakeoff,
      takeoff_items: takeoffItems || [],
    });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
