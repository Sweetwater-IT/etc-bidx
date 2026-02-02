import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Query to get the most recent order_date for each contractor_id
    const { data, error } = await supabase
      .from('sign_orders')
      .select('contractor_id, order_date')
      .not('contractor_id', 'is', null)
      .not('order_date', 'is', null)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching last ordered data:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Group by contractor_id and get the most recent order_date for each
    const lastOrderedMap: Record<number, string> = {};

    data?.forEach(order => {
      const contractorId = order.contractor_id;
      const orderDate = order.order_date;

      // Only set if we haven't seen this contractor yet (since we're ordered by date desc)
      if (contractorId && orderDate && !lastOrderedMap[contractorId]) {
        lastOrderedMap[contractorId] = orderDate;
      }
    });

    return NextResponse.json({
      success: true,
      data: lastOrderedMap
    });

  } catch (error: any) {
    console.error('Error in last-ordered API:', error);
    return NextResponse.json({ success: false, error: error.message || 'An error occurred' }, { status: 500 });
  }
}