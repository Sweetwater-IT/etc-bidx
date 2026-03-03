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

    // Process sign rows → work order items
    // sign_rows is now a proper JSON object: { "sectionName": MPTSignRow[] }
    const signRowsData = takeoff.sign_rows || {};
    const workOrderItems: Array<{
      work_order_id: string | null;
      item_number: number;
      description: string;
      contract_quantity: number;
      work_order_quantity: number;
      uom: string;
      sort_order: number;
    }> = [];

    // Flatten all sign rows from all sections
    let itemNumber = 1;
    for (const sectionName of Object.keys(signRowsData)) {
      const sectionRows = signRowsData[sectionName] || [];
      for (const row of sectionRows) {
        const description = [
          row.signDesignation || 'Custom Sign',
          row.signDescription || '',
          row.dimensionLabel ? `(${row.dimensionLabel})` : '',
          row.signLegend ? `- ${row.signLegend}` : ''
        ].filter(Boolean).join(' ').trim();

        const quantity = row.quantity || 1;
        const uom = row.sqft > 0 ? 'sqft' : 'each';

        workOrderItems.push({
          work_order_id: null, // will be set after work order creation
          item_number: itemNumber++,
          description,
          contract_quantity: quantity,
          work_order_quantity: quantity,
          uom,
          sort_order: itemNumber - 1,
        });
      }
    }

    // Create the work order header
    const { data: workOrder, error: insertError } = await supabase
      .from('work_orders_l')
      .insert({
        job_id: takeoff.job_id,
        takeoff_id: takeoffId,
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
        itemCount: workOrderItems.length
      }
    });
  } catch (error) {
    console.error('Unexpected error in work order generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
