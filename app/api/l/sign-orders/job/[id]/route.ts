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
      .select('id, order_number, status, submitted_date')
      .eq('job_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sign orders:', error);
      return NextResponse.json({ error: 'Failed to fetch sign orders' }, { status: 500 });
    }

    // Get item counts for each order
    const ordersWithCounts = await Promise.all(
      (data || []).map(async (order: any) => {
        const { count } = await supabase
          .from('sign_order_items')
          .select('id', { count: 'exact', head: true })
          .eq('sign_order_id', order.id);

        return {
          ...order,
          item_count: count || 0
        };
      })
    );

    return NextResponse.json(ordersWithCounts);
  } catch (error) {
    console.error('Error in sign orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}