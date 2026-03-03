import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; workOrderId: string }> }
) {
  try {
    const { jobId, workOrderId } = await params;

    // Get dispatch data for this work order
    const { data: dispatch, error } = await supabase
      .from('work_order_dispatches')
      .select('*')
      .eq('work_order_id', workOrderId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching dispatch:', error);
      return NextResponse.json({ error: 'Failed to fetch dispatch data' }, { status: 500 });
    }

    return NextResponse.json(dispatch || null);
  } catch (error) {
    console.error('Error in dispatch GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; workOrderId: string }> }
) {
  try {
    const { jobId, workOrderId } = await params;
    const { scheduledDate } = await request.json();

    if (!scheduledDate) {
      return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 });
    }

    // Check if dispatch already exists
    const { data: existingDispatch } = await supabase
      .from('work_order_dispatches')
      .select('id')
      .eq('work_order_id', workOrderId)
      .single();

    if (existingDispatch) {
      return NextResponse.json({ error: 'Dispatch already scheduled for this work order' }, { status: 400 });
    }

    // Create new dispatch
    const { data: dispatch, error } = await supabase
      .from('work_order_dispatches')
      .insert({
        work_order_id: workOrderId,
        scheduled_date: scheduledDate,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dispatch:', error);
      return NextResponse.json({ error: 'Failed to schedule dispatch' }, { status: 500 });
    }

    return NextResponse.json(dispatch);
  } catch (error) {
    console.error('Error in dispatch POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}