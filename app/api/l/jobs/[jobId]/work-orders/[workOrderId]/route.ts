import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const resolvedParams = await context.params;
    const workOrderId = resolvedParams.id;

    const { data: workOrder, error } = await supabase
      .from('work_orders_l')
      .select('*')
      .eq('id', workOrderId)
      .single();

    if (error) {
      console.error('Error fetching work order:', error);
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const resolvedParams = await context.params;
    const workOrderId = resolvedParams.id;
    const patch = await request.json();

    const { data: workOrder, error } = await supabase
      .from('work_orders_l')
      .update(patch)
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating work order:', error);
      return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 });
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const resolvedParams = await context.params;
    const workOrderId = resolvedParams.id;

    // Get the job_id before deleting
    const { data: workOrder } = await supabase
      .from('work_orders_l')
      .select('job_id')
      .eq('id', workOrderId)
      .single();

    const { error } = await supabase
      .from('work_orders_l')
      .delete()
      .eq('id', workOrderId);

    if (error) {
      console.error('Error deleting work order:', error);
      return NextResponse.json({ error: 'Failed to delete work order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobId: workOrder?.job_id
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}