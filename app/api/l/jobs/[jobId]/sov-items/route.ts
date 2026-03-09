import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { data, error } = await supabase
      .from('sov_items_l')
      .select('*')
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching SOV items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SOV items' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in SOV items GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { item_number, description, uom, quantity, unit_price, retainage_type, retainage_value, notes } = body;

    // Calculate extended price and retainage amount
    const extended_price = quantity * unit_price;
    const retainage_amount = retainage_type === 'percent'
      ? extended_price * (retainage_value / 100)
      : retainage_value;

    // Get next sort order
    const { data: maxSort } = await supabase
      .from('sov_items_l')
      .select('sort_order')
      .eq('job_id', jobId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = maxSort && maxSort.length > 0 ? maxSort[0].sort_order + 1 : 1;

    const { data, error } = await supabase
      .from('sov_items_l')
      .insert({
        job_id: jobId,
        item_number,
        description,
        uom,
        quantity,
        unit_price,
        extended_price,
        retainage_type,
        retainage_value,
        retainage_amount,
        notes,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating SOV item:', error);
      return NextResponse.json(
        { error: 'Failed to create SOV item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in SOV items POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}