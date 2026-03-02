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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ takeoffId: string }> }
) {
  try {
    const params = await context.params;
    const { takeoffId } = params;

    // Fetch the takeoff data
    const { data: takeoff, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .select('*')
      .eq('id', takeoffId)
      .single();

    if (takeoffError || !takeoff) {
      console.error('Takeoff fetch error:', takeoffError);
      return NextResponse.json(
        { error: 'Takeoff not found' },
        { status: 404 }
      );
    }

    // Process sign rows into work order items
    const signRows = takeoff.sign_rows || [];
    const workOrderItems: WorkOrderItem[] = [];

    for (const row of signRows) {
      const description = `${row.signDesignation || 'Custom Sign'} - ${row.signDescription || ''} ${row.dimensionLabel ? `(${row.dimensionLabel})` : ''} ${row.signLegend ? `- ${row.signLegend}` : ''}`.trim();
      const quantity = row.quantity || 1;
      const unit = row.sqft > 0 ? 'sqft' : 'each';
      const unitPrice = row.sqft > 0 ? 5.00 : 50.00; // Default pricing - can be adjusted
      const total = unit === 'sqft' ? (row.sqft * quantity * unitPrice) : (quantity * unitPrice);

      workOrderItems.push({
        description,
        quantity,
        unit,
        unit_price: unitPrice,
        total
      });
    }

    // Create work order
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
      return NextResponse.json(
        { error: 'Failed to create work order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workOrder: {
        id: workOrder.id,
        title: workOrder.title,
        items: workOrderItems
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
