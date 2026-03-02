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
    const workOrderItems: WorkOrderItem[] = [];

    // Flatten all sign rows from all sections
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
        const unit = row.sqft > 0 ? 'sqft' : 'each';
        const unitPrice = row.sqft > 0 ? 5.00 : 50.00; // placeholder — consider pulling from config/DB later
        const total = unit === 'sqft' ? (row.sqft * quantity * unitPrice) : (quantity * unitPrice);

        workOrderItems.push({ description, quantity, unit, unit_price: unitPrice, total });
      }
    }

    // Create the work order
    const { data: workOrder, error: insertError } = await supabase
      .from('work_orders')
      .insert({
        job_id: takeoff.job_id,
        takeoff_id: takeoffId,
        title: takeoff.title,
        work_type: takeoff.work_type,
        items: workOrderItems,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError || !workOrder) {
      console.error('Work order insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create work order', details: insertError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      workOrder: {
        id: workOrder.id,
        title: workOrder.title,
        items: workOrderItems // or just return workOrder if items are stored
      }
    });
  } catch (error) {
    console.error('Unexpected error in work order generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
