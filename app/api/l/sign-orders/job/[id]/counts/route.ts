import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sign_orders')
      .select('status')
      .eq('job_id', id);

    if (error) {
      console.error('Error fetching sign orders:', error);
      return NextResponse.json({ error: 'Failed to fetch sign orders' }, { status: 500 });
    }

    const counts = { submitted: 0, in_production: 0, complete: 0, closed: 0 };

    if (data) {
      data.forEach((order: any) => {
        if (order.status === 'submitted' || order.status === 'draft') counts.submitted++;
        else if (order.status === 'in_production' || order.status === 'partial_complete') counts.in_production++;
        else if (order.status === 'complete') counts.complete++;
        else if (order.status === 'closed') counts.closed++;
      });
    }

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error in sign orders counts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}