// app/api/workorders/from-takeoff/[takeoffId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type SOVLookupItem = {
  id: number;
  item_number: string;
  description: string;
  work_type?: string | null;
  uom?: string | null;
  quantity?: number | null;
};

const WORK_TYPE_GROUPS: Record<string, string[]> = {
  MPT: ['MPT', 'LANE_CLOSURE'],
  LANE_CLOSURE: ['MPT', 'LANE_CLOSURE'],
  FLAGGING: ['FLAGGING'],
  PERMANENT_SIGNS: ['PERMANENT_SIGNS'],
  SERVICE: ['SERVICE'],
  DELIVERY: ['DELIVERY'],
  RENTAL: ['RENTAL'],
  CUSTOM: ['CUSTOM'],
};

function getRelevantWorkTypes(workType: unknown): string[] {
  const normalized = normalizeUpper(workType);
  return WORK_TYPE_GROUPS[normalized] || (normalized ? [normalized] : []);
}

const normalize = (value: unknown): string => String(value || '').trim();
const normalizeUpper = (value: unknown): string => normalize(value).toUpperCase();

const VEHICLE_LABEL_BY_ID: Record<string, string> = {
  pickup_truck: 'Pick Up Truck',
  tma: 'TMA',
  message_board: 'Message Board',
  arrow_panel: 'Arrow Panel',
  speed_trailer: 'Speed Trailer',
};

function resolveSov(
  candidates: Array<unknown>,
  sovItems: SOVLookupItem[]
): { item_number: string; sov_item_id: number | null } {
  const sovByItemNumber = new Map<string, SOVLookupItem>();
  const sovByDescription = new Map<string, SOVLookupItem>();

  for (const s of sovItems) {
    const numKey = normalizeUpper(s.item_number);
    if (numKey) sovByItemNumber.set(numKey, s);

    const descKey = normalizeUpper(s.description);
    if (descKey && !sovByDescription.has(descKey)) sovByDescription.set(descKey, s);
  }

  for (const candidate of candidates) {
    const key = normalizeUpper(candidate);
    if (!key) continue;

    const byNum = sovByItemNumber.get(key);
    if (byNum) {
      return { item_number: byNum.item_number, sov_item_id: byNum.id };
    }

    const byDesc = sovByDescription.get(key);
    if (byDesc) {
      return { item_number: byDesc.item_number, sov_item_id: byDesc.id };
    }
  }

  // Loose description contains fallback
  const nonEmptyCandidates = candidates.map((c) => normalizeUpper(c)).filter(Boolean);
  for (const candidate of nonEmptyCandidates) {
    const found = sovItems.find((s) => {
      const desc = normalizeUpper(s.description);
      return desc.includes(candidate) || candidate.includes(desc);
    });
    if (found) return { item_number: found.item_number, sov_item_id: found.id };
  }

  return { item_number: '', sov_item_id: null };
}

export async function POST(request: NextRequest) {
  console.log('🔍 [API] Starting work order creation from takeoff...');

  // Log environment variables availability
  console.log('🔍 [API] Environment variables check:', {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing',
    NODE_ENV: process.env.NODE_ENV
  });

  try {
    const requestBody = await request.json();
    console.log('🔍 [API] Request body:', requestBody);

    const {
      userEmail,
      is_pickup,
      parentWorkOrderId,
      title,
      description,
      notes,
      scheduled_date,
      assigned_to,
      contracted_or_additional,
      customer_poc_phone,
      install_date,
      pickup_date,
      crewNotes,
      buildShopNotes,
      pmNotes,
    } = requestBody;

    if (!userEmail) {
      console.log('🔍 [API] Missing userEmail, returning 400');
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    const isPickup = Boolean(is_pickup);
    console.log('🔍 [API] Parsed parameters:', {
      userEmail,
      isPickup,
      parentWorkOrderId,
      title
    });

    // Extract takeoffId from the URL path (bypasses params Promise entirely)
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean); // remove empty parts
    // Route is /api/workorders/from-takeoff/{takeoffId}
    // So segments: ['api', 'workorders', 'from-takeoff', '{takeoffId}']
    const takeoffId = segments[segments.length - 1]; // last segment = takeoffId

    if (!takeoffId || takeoffId === 'from-takeoff') {
      return NextResponse.json({ error: 'Missing or invalid takeoffId' }, { status: 400 });
    }

    console.log('Extracted takeoffId:', takeoffId); // ← add for debugging

    // Fetch the takeoff
    const { data: takeoff, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .select('*')
      .eq('id', takeoffId)
      .single();

    if (takeoffError || !takeoff) {
      console.error('Takeoff fetch error:', takeoffError);
      return NextResponse.json({ error: 'Takeoff not found' }, { status: 404 });
    }

    console.log('Takeoff:', { id: takeoff.id, job_id: takeoff.job_id, work_type: takeoff.work_type, isPickup });

    let sourceTakeoff = takeoff;
    let workingTakeoffId = takeoffId;
    let parentTakeoffId: string | null = null;

    if (isPickup) {
      const resolvedParentWorkOrderId = parentWorkOrderId || takeoff.work_order_id || null;
      if (!resolvedParentWorkOrderId) {
        return NextResponse.json({ error: 'Parent work order is required for pickup creation' }, { status: 400 });
      }

      if (!['MPT', 'RENTAL'].includes(String(takeoff.work_type || '').toUpperCase())) {
        return NextResponse.json({ error: 'Pickup work orders are only supported for MPT or RENTAL takeoffs' }, { status: 400 });
      }

      const { data: existingPickupWO } = await supabase
        .from('work_orders_l')
        .select('id, takeoff_id, wo_number')
        .eq('parent_work_order_id', resolvedParentWorkOrderId)
        .eq('is_pickup', true)
        .maybeSingle();

      if (existingPickupWO?.id) {
        return NextResponse.json(
          {
            error: 'Pickup work order already exists',
            code: 'PICKUP_EXISTS',
            existingWorkOrderId: existingPickupWO.id,
            existingTakeoffId: existingPickupWO.takeoff_id,
          },
          { status: 409 }
        );
      }

      parentTakeoffId = takeoff.id;

      const pickupTakeoffPayload = {
        job_id: takeoff.job_id,
        work_type: takeoff.work_type,
        title: title || `PU-${takeoff.title}`,
        status: 'draft',
        notes: notes || takeoff.notes || null,
        install_date: null,
        pickup_date: pickup_date || takeoff.pickup_date || null,
        contracted_or_additional: contracted_or_additional || takeoff.contracted_or_additional || 'contracted',
        needed_by_date: takeoff.needed_by_date || null,
        revision_of_takeoff_id: null,
        revision_number: 1,
        chain_root_takeoff_id: null,
        destination: takeoff.destination || null,
        default_sign_material: takeoff.default_sign_material || null,
        priority: takeoff.priority || 'standard',
        crew_notes: crewNotes || takeoff.crew_notes || null,
        build_shop_notes: buildShopNotes || takeoff.build_shop_notes || null,
        canceled_at: null,
        canceled_by: null,
        cancel_reason: null,
        cancel_notes: null,
        active_sections: takeoff.active_sections || [],
        sign_rows: takeoff.sign_rows || {},
        pm_notes: pmNotes || takeoff.pm_notes || null,
        is_multi_day_job: false,
        end_date: null,
        active_permanent_items: takeoff.active_permanent_items || [],
        permanent_sign_rows: takeoff.permanent_sign_rows || {},
        permanent_entry_rows: takeoff.permanent_entry_rows || {},
        default_permanent_sign_material: takeoff.default_permanent_sign_material || 'ALUMINUM',
        vehicle_items: takeoff.vehicle_items || [],
        rolling_stock_items: takeoff.rolling_stock_items || [],
        additional_items: takeoff.additional_items || [],
        is_pickup: true,
        parent_takeoff_id: parentTakeoffId,
      };

      const { data: pickupTakeoff, error: pickupTakeoffError } = await supabase
        .from('takeoffs_l')
        .insert(pickupTakeoffPayload)
        .select()
        .single();

      if (pickupTakeoffError || !pickupTakeoff) {
        console.error('Pickup takeoff insert error:', pickupTakeoffError);
        return NextResponse.json({ error: 'Failed to create pickup takeoff', details: pickupTakeoffError }, { status: 500 });
      }

      sourceTakeoff = pickupTakeoff;
      workingTakeoffId = pickupTakeoff.id;

      // Copy takeoff items from parent takeoff to pickup takeoff
      console.log('🔍 [PICKUP] Starting item copy process...');
      console.log('🔍 [PICKUP] Parent takeoff ID:', parentTakeoffId);
      console.log('🔍 [PICKUP] Pickup takeoff ID:', pickupTakeoff.id);

      const { data: parentItems, error: parentItemsError } = await supabase
        .from('takeoff_items_l')
        .select('*')
        .eq('takeoff_id', parentTakeoffId)
        .is('deleted_at', null);

      console.log('🔍 [PICKUP] Parent items query result:', {
        error: parentItemsError,
        itemCount: parentItems?.length || 0,
        items: parentItems?.map(item => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity
        })) || []
      });

      if (parentItemsError) {
        console.error('🔍 [PICKUP] Error fetching parent takeoff items:', parentItemsError);
        return NextResponse.json({ error: 'Failed to fetch parent takeoff items', details: parentItemsError }, { status: 500 });
      }

      if (parentItems && parentItems.length > 0) {
        console.log('🔍 [PICKUP] Processing parent items for pickup takeoff...');

        const pickupItems = parentItems.map(item => ({
          takeoff_id: pickupTakeoff.id,
          product_name: item.product_name,
          category: item.category,
          unit: item.unit,
          quantity: item.quantity,
          requisition_type: item.requisition_type,
          notes: item.notes,
          in_stock_qty: item.in_stock_qty,
          to_order_qty: item.to_order_qty,
          inventory_status: item.inventory_status,
          material: item.material,
          sign_details: item.sign_details,
          sign_description: item.sign_description,
          sheeting: item.sheeting,
          width_inches: item.width_inches,
          height_inches: item.height_inches,
          sqft: item.sqft,
          total_sqft: item.total_sqft,
          load_order: item.load_order,
          cover: item.cover,
          secondary_signs: item.secondary_signs,
          // Reset pickup-specific fields
          pickup_condition: null,
          pickup_images: [],
          return_details: {},
          return_condition: null,
          damage_photos: {},
        }));

        console.log('🔍 [PICKUP] Prepared pickup items:', pickupItems.map(item => ({
          takeoff_id: item.takeoff_id,
          product_name: item.product_name,
          quantity: item.quantity
        })));

        const { data: insertedItems, error: insertItemsError } = await supabase
          .from('takeoff_items_l')
          .insert(pickupItems)
          .select();

        console.log('🔍 [PICKUP] Insert result:', {
          error: insertItemsError,
          insertedCount: insertedItems?.length || 0,
          insertedItems: insertedItems?.map(item => ({
            id: item.id,
            takeoff_id: item.takeoff_id,
            product_name: item.product_name
          })) || []
        });

        if (insertItemsError) {
          console.error('🔍 [PICKUP] Error copying takeoff items to pickup:', insertItemsError);
          return NextResponse.json({ error: 'Failed to copy takeoff items to pickup', details: insertItemsError }, { status: 500 });
        }

        console.log(`🔍 [PICKUP] Successfully copied ${pickupItems.length} items from parent takeoff to pickup takeoff`);
      } else {
        console.log('🔍 [PICKUP] No parent items found to copy');
      }
    }

    // Fetch takeoff data to determine which SOV work types should appear on the work order
    const { data: takeoffData, error: takeoffDataError } = await supabase
      .from('takeoffs_l')
      .select('work_type')
      .eq('id', workingTakeoffId)
      .single();

    if (takeoffDataError) {
      console.error('Takeoff data fetch error:', takeoffDataError);
      return NextResponse.json({ error: 'Failed to fetch takeoff data' }, { status: 500 });
    }

    const relevantWorkTypes = getRelevantWorkTypes(takeoffData.work_type);

    // Fetch SOV items for this job and derive work order items directly from matching SOV entries.
    const { data: sovEntries } = await supabase
      .from('sov_entries')
      .select('quantity, sort_order, sov_items!inner(id, item_number, description, work_type, uom)')
      .eq('job_id', sourceTakeoff.job_id)
      .order('sort_order', { ascending: true });

    const sovItems: SOVLookupItem[] = (sovEntries || [])
      .map((entry: any) => ({
        id: Number(entry?.sov_items?.id),
        item_number: String(entry?.sov_items?.item_number || ''),
        description: String(entry?.sov_items?.description || ''),
        work_type: entry?.sov_items?.work_type ?? null,
        uom: entry?.sov_items?.uom ?? null,
        quantity: entry?.quantity ?? null,
        sort_order: entry?.sort_order ?? null,
      }))
      .filter((s: any) => Boolean(s.id));

    const matchedSovItems = sovItems.filter((item) => {
      const itemWorkType = normalizeUpper(item.work_type);
      return relevantWorkTypes.length === 0 || relevantWorkTypes.includes(itemWorkType);
    });

    // Create work order items from SOV entries only.
    const workOrderItems: Array<{
      work_order_id: string | null;
      item_number: string;
      description: string;
      contract_quantity: number;
      work_order_quantity: number;
      uom: string;
      sort_order: number;
      sov_item_id: number | null;
    }> = [];

    matchedSovItems.forEach((item, index) => {
      const quantity = Number(item.quantity || 0);
      workOrderItems.push({
        work_order_id: null,
        item_number: item.item_number,
        description: item.description,
        contract_quantity: quantity,
        work_order_quantity: quantity,
        uom: item.uom || 'EA',
        sort_order: index,
        sov_item_id: item.id,
      });
    });

    console.log('Generated work order items:', workOrderItems.map(i => ({
      item_number: i.item_number,
      description: i.description.substring(0,50)+'...',
      qty: i.work_order_quantity
    })));

    // Generate sequential work order number per takeoff
    const { data: maxWO } = await supabase
      .from('work_orders_l')
      .select('wo_number')
      .eq('takeoff_id', workingTakeoffId)
      .order('wo_number', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = (maxWO?.wo_number || 0) + 1;
    const workOrderNumber = nextNumber;

    // Create the work order header
    const { data: workOrder, error: insertError } = await supabase
      .from('work_orders_l')
      .insert({
        job_id: sourceTakeoff.job_id,
        takeoff_id: workingTakeoffId,
        wo_number: workOrderNumber,
        title: title || sourceTakeoff.title,
        description: description || null,
        notes: notes || null,
        scheduled_date: scheduled_date || null,
        assigned_to: assigned_to || null,
        contracted_or_additional: contracted_or_additional || sourceTakeoff.contracted_or_additional || 'contracted',
        customer_poc_phone: customer_poc_phone || null,
        created_by: userEmail,
        status: 'draft',
        is_pickup: isPickup,
        parent_work_order_id: isPickup ? (parentWorkOrderId || takeoff.work_order_id || null) : null,
      })
      .select()
      .single();

    if (insertError || !workOrder) {
      console.error('Work order insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create work order', details: insertError }, { status: 500 });
    }

    // Update the takeoff with the work order number AND work order ID
    const { error: updateTakeoffError } = await supabase
      .from('takeoffs_l')
      .update({
        work_order_number: workOrderNumber,
        work_order_id: workOrder.id
      })
      .eq('id', workingTakeoffId);

    if (updateTakeoffError) {
      console.error('Error updating takeoff with WO number:', updateTakeoffError);
      // Don't fail, but log
    }

    // Create work order items
    let itemsError: any = null;
    if (workOrderItems.length > 0) {
      const itemsWithWorkOrderId = workOrderItems.map(item => ({
        ...item,
        work_order_id: workOrder.id
      }));

      const result = await supabase
        .from('work_order_items_l')
        .insert(itemsWithWorkOrderId);

      itemsError = result.error;

      if (itemsError) {
        console.error('Work order items insert error:', itemsError);
        // Don't fail the whole request, but log the error
      }
    }

    console.log('Items insert error:', itemsError);
    console.log('Response itemCount:', workOrderItems.length);

    return NextResponse.json({
      success: true,
      workOrder: {
        id: workOrder.id,
        title: workOrder.title,
        workOrderNumber,
        itemCount: workOrderItems.length,
        isPickup,
      },
      takeoff: {
        id: workingTakeoffId,
        parentTakeoffId,
        isPickup,
      },
    });
  } catch (error) {
    console.error('Unexpected error in work order generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
