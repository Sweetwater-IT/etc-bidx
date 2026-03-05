// app/api/workorders/from-takeoff/[takeoffId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface WorkOrderItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    const {
      userEmail,
      title,
      description,
      notes,
      scheduled_date,
      assigned_to,
      contracted_or_additional,
      customer_poc_phone,
      install_date,
      pickup_date
    } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

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

    // Fetch SOV items for this job
    const { data: sovItems, error: sovError } = await supabase
      .from('sov_items_l')
      .select('*')
      .eq('job_id', takeoff.job_id)
      .order('sort_order', { ascending: true });

    if (sovError) {
      console.error('Error fetching SOV items:', sovError);
      return NextResponse.json({ error: 'Failed to fetch SOV items' }, { status: 500 });
    }

    // Process SOV items → work order items
    const workOrderItems: Array<{
      work_order_id: string | null;
      item_number: number;
      description: string;
      contract_quantity: number;
      work_order_quantity: number;
      uom: string;
      sort_order: number;
    }> = [];

    if (takeoff.work_type === 'MPT') {
      // For MPT takeoffs, create one work order item for MPT SOV item
      const mptSovItem = sovItems?.find(item => item.item_number?.startsWith('0901'));
      if (mptSovItem) {
        // Calculate total sign quantity from takeoff
        const signRowsData = takeoff.sign_rows || {};
        let totalSignQuantity = 0;
        for (const sectionName of Object.keys(signRowsData)) {
          const sectionRows = signRowsData[sectionName] || [];
          for (const row of sectionRows) {
            totalSignQuantity += row.quantity || 1;
          }
        }

        workOrderItems.push({
          work_order_id: null, // will be set after work order creation
          item_number: 1,
          description: mptSovItem.description || 'Maintenance and Protection of Traffic',
          contract_quantity: totalSignQuantity,
          work_order_quantity: totalSignQuantity,
          uom: mptSovItem.uom || 'each',
          sort_order: 1,
        });
      }
    } else {
      // For other work types, create work order items from relevant SOV items
      // This logic may need to be expanded based on work type
      let itemNumber = 1;
      sovItems?.forEach((sovItem) => {
        workOrderItems.push({
          work_order_id: null, // will be set after work order creation
          item_number: itemNumber++,
          description: sovItem.description,
          contract_quantity: sovItem.quantity || 0,
          work_order_quantity: sovItem.quantity || 0,
          uom: sovItem.uom || 'each',
          sort_order: itemNumber - 1,
        });
      });
    }

    // Generate sequential work order number per job
    const { data: maxWO } = await supabase
      .from('work_orders_l')
      .select('wo_number')
      .eq('job_id', takeoff.job_id)
      .order('wo_number', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = (maxWO?.wo_number ? parseInt(maxWO.wo_number) : 0) + 1;
    const workOrderNumber = nextNumber.toString().padStart(3, '0');

    // Create the work order header
    const { data: workOrder, error: insertError } = await supabase
      .from('work_orders_l')
      .insert({
        job_id: takeoff.job_id,
        takeoff_id: takeoffId,
        wo_number: workOrderNumber,
        title: title || takeoff.title,
        description: description || null,
        notes: notes || null,
        scheduled_date: scheduled_date || null,
        assigned_to: assigned_to || null,
        contracted_or_additional: contracted_or_additional || 'contracted',
        customer_poc_phone: customer_poc_phone || null,
        created_by: userEmail,
        status: 'draft'
      })
      .select()
      .single();

    if (insertError || !workOrder) {
      console.error('Work order insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create work order', details: insertError }, { status: 500 });
    }

    // Update the takeoff with the work order number
    const { error: updateTakeoffError } = await supabase
      .from('takeoffs_l')
      .update({ work_order_number: workOrderNumber })
      .eq('id', takeoffId);

    if (updateTakeoffError) {
      console.error('Error updating takeoff with WO number:', updateTakeoffError);
      // Don't fail, but log
    }

    // Create work order items
    if (workOrderItems.length > 0) {
      const itemsWithWorkOrderId = workOrderItems.map(item => ({
        ...item,
        work_order_id: workOrder.id
      }));

      const { error: itemsError } = await supabase
        .from('work_order_items_l')
        .insert(itemsWithWorkOrderId);

      if (itemsError) {
        console.error('Work order items insert error:', itemsError);
        // Don't fail the whole request, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      workOrder: {
        id: workOrder.id,
        title: workOrder.title,
        workOrderNumber,
        itemCount: workOrderItems.length
      }
    });
  } catch (error) {
    console.error('Unexpected error in work order generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
