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

    console.log('Takeoff:', { id: takeoff.id, job_id: takeoff.job_id, work_type: takeoff.work_type });

    // Fetch takeoff data with sign rows to create work order items
    const { data: takeoffData, error: takeoffDataError } = await supabase
      .from('takeoffs_l')
      .select('sign_rows')
      .eq('id', takeoffId)
      .single();

    if (takeoffDataError) {
      console.error('Takeoff data fetch error:', takeoffDataError);
      return NextResponse.json({ error: 'Failed to fetch takeoff data' }, { status: 500 });
    }

    // Create work order items from takeoff sign designations
    const workOrderItems: Array<{
      work_order_id: string | null;
      item_number: string; // Will be selected from SOV later
      description: string;
      contract_quantity: number;
      work_order_quantity: number;
      uom: string;
      sort_order: number;
      sov_item_id: string | null;
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

          workOrderItems.push({
            work_order_id: null, // will be set after work order creation
            item_number: '', // Empty initially, user selects SOV item
            description,
            contract_quantity: quantity,
            work_order_quantity: quantity, // Start with takeoff quantity
            uom,
            sort_order: sortOrder++,
            sov_item_id: null, // Will be set when user selects SOV item
          });
        }
      }
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
      .eq('takeoff_id', takeoffId)
      .order('wo_number', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = (maxWO?.wo_number || 0) + 1;
    const workOrderNumber = nextNumber;

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

    // Update the takeoff with the work order number AND work order ID
    const { error: updateTakeoffError } = await supabase
      .from('takeoffs_l')
      .update({
        work_order_number: workOrderNumber,
        work_order_id: workOrder.id
      })
      .eq('id', takeoffId);

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
        itemCount: workOrderItems.length
      }
    });
  } catch (error) {
    console.error('Unexpected error in work order generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
