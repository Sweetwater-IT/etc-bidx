// app/api/workorders/from-takeoff/[takeoffId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type SOVLookupItem = {
  id: number;
  item_number: string;
  description: string;
  work_type?: string | null;
};

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
  try {
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
    } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    const isPickup = Boolean(is_pickup);

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
        title: title || `${takeoff.title} - Pickup`,
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
    }

    // Fetch takeoff data with all sections to create work order items
    const { data: takeoffData, error: takeoffDataError } = await supabase
      .from('takeoffs_l')
      .select('sign_rows, vehicle_items, additional_items, rolling_stock_items, work_type')
      .eq('id', workingTakeoffId)
      .single();

    if (takeoffDataError) {
      console.error('Takeoff data fetch error:', takeoffDataError);
      return NextResponse.json({ error: 'Failed to fetch takeoff data' }, { status: 500 });
    }

    // Fetch SOV items for lookup/carry-over mapping
    const { data: sovEntries } = await supabase
      .from('sov_entries')
      .select('sov_items!inner(id, item_number, description, work_type)')
      .eq('job_id', sourceTakeoff.job_id);

    const sovItems: SOVLookupItem[] = (sovEntries || [])
      .map((entry: any) => entry?.sov_items)
      .filter(Boolean)
      .map((s: any) => ({
        id: Number(s.id),
        item_number: String(s.item_number || ''),
        description: String(s.description || ''),
        work_type: s.work_type ?? null,
      }));

    // Create work order items from takeoff sign designations
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

    const signRowsData = takeoffData.sign_rows || {};
    let sortOrder = 0;

    // Process each section (trailblazers, type_iii, sign_stands)
    for (const [sectionKey, sectionRows] of Object.entries(signRowsData)) {
      if (Array.isArray(sectionRows)) {
        for (const row of sectionRows) {
          // Create description from sign details
          const descriptionParts = [
            row.signDesignation || 'Custom Sign',
            row.signDescription || '',
            row.dimensionLabel ? `(${row.dimensionLabel})` : '',
            row.signLegend ? `- ${row.signLegend}` : ''
          ].filter(Boolean);

          const description = descriptionParts.join(' ').trim();
          const quantity = row.quantity || 1;
          const uom = row.sqft > 0 ? 'SF' : 'SF'; // All signs use SF
          const resolved = resolveSov(
            [
              row.itemNumber,
              row.item_number,
              row.sovItemNumber,
              row.sov_item_number,
              row.signDesignation,
              description,
            ],
            sovItems
          );

          workOrderItems.push({
            work_order_id: null, // will be set after work order creation
            item_number: resolved.item_number,
            description,
            contract_quantity: quantity,
            work_order_quantity: quantity, // Start with takeoff quantity
            uom,
            sort_order: sortOrder++,
            sov_item_id: resolved.sov_item_id,
          });
        }
      }
    }

    // Vehicles -> work order items
    const vehicleItems = Array.isArray(takeoffData.vehicle_items) ? takeoffData.vehicle_items : [];
    for (const vehicle of vehicleItems) {
      const vehicleType = normalize(vehicle?.vehicleType);
      const vehicleLabel = VEHICLE_LABEL_BY_ID[vehicleType] || vehicleType || 'Vehicle';
      const quantity = Number(vehicle?.quantity || 1) || 1;
      const description = `Vehicle: ${vehicleLabel}`;
      const resolved = resolveSov(
        [vehicle?.itemNumber, vehicle?.item_number, vehicleType, vehicleLabel, description],
        sovItems
      );

      workOrderItems.push({
        work_order_id: null,
        item_number: resolved.item_number,
        description,
        contract_quantity: quantity,
        work_order_quantity: quantity,
        uom: 'EA',
        sort_order: sortOrder++,
        sov_item_id: resolved.sov_item_id,
      });
    }

    // Additional items -> work order items
    const additionalItems = Array.isArray(takeoffData.additional_items) ? takeoffData.additional_items : [];
    for (const item of additionalItems) {
      const name = normalize(item?.name);
      const customName = name === '__custom' ? normalize(item?.description) : '';
      const displayName = customName || name || 'Additional Item';
      const descriptionNote = normalize(item?.description);
      const description = descriptionNote && descriptionNote !== customName
        ? `${displayName} — ${descriptionNote}`
        : displayName;
      const quantity = Number(item?.quantity || 1) || 1;
      const resolved = resolveSov(
        [item?.itemNumber, item?.item_number, name, customName, description],
        sovItems
      );

      workOrderItems.push({
        work_order_id: null,
        item_number: resolved.item_number,
        description,
        contract_quantity: quantity,
        work_order_quantity: quantity,
        uom: 'EA',
        sort_order: sortOrder++,
        sov_item_id: resolved.sov_item_id,
      });
    }

    // Rolling stock is intentionally read-only/disabled right now, but preserve legacy rows if present
    const rollingStockItems = Array.isArray(takeoffData.rolling_stock_items) ? takeoffData.rolling_stock_items : [];
    for (const rs of rollingStockItems) {
      const label = normalize(rs?.equipmentLabel) || normalize(rs?.equipmentId) || 'Rolling Stock';
      const description = `Rolling Stock: ${label}`;
      const resolved = resolveSov([rs?.itemNumber, rs?.item_number, label, description], sovItems);

      workOrderItems.push({
        work_order_id: null,
        item_number: resolved.item_number,
        description,
        contract_quantity: 1,
        work_order_quantity: 1,
        uom: 'EA',
        sort_order: sortOrder++,
        sov_item_id: resolved.sov_item_id,
      });
    }

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
