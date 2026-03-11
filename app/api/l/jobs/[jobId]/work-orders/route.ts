import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('work_orders_l')
      .select('id, wo_number, title, status, updated_at')
      .eq('job_id', jobId)
      .in('status', ['completed', 'ready', 'scheduled', 'draft'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching work orders:', error);
      return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in work orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}