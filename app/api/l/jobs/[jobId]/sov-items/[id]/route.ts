import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; id: string }> }
) {
  try {
    const { jobId, id } = await params;
    const body = await request.json();
    const { quantity, unit_price, retainage_type, retainage_value, notes, sort_order } = body;

    // Calculate extended price and retainage amount
    const extended_price = quantity * unit_price;
    const retainage_amount = retainage_type === 'percent'
      ? extended_price * (retainage_value / 100)
      : retainage_value;

    const { data, error } = await supabase
      .from('sov_entries')
      .update({
        quantity,
        unit_price,
        extended_price,
        retainage_type,
        retainage_value,
        retainage_amount,
        notes,
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('job_id', jobId) // Extra security check
      .select(`
        id,
        job_id,
        sov_item_id,
        quantity,
        unit_price,
        extended_price,
        retainage_type,
        retainage_value,
        retainage_amount,
        notes,
        sort_order,
        created_at,
        updated_at,
        sov_items (
          id,
          item_number,
          display_item_number,
          description,
          display_name,
          work_type
        )
      `)
      .single();

    if (error) {
      console.error('Error updating SOV entry:', error);
      return NextResponse.json(
        { error: 'Failed to update SOV entry' },
        { status: 500 }
      );
    }

    // Transform response to match expected format
    const transformedData = {
      id: data.id,
      job_id: data.job_id,
      sov_item_id: data.sov_item_id,
      item_number: (data as any).sov_items?.item_number,
      display_item_number: (data as any).sov_items?.display_item_number,
      description: (data as any).sov_items?.description,
      display_name: (data as any).sov_items?.display_name,
      work_type: (data as any).sov_items?.work_type,
      quantity: data.quantity,
      unit_price: data.unit_price,
      extended_price: data.extended_price,
      retainage_type: data.retainage_type,
      retainage_value: data.retainage_value,
      retainage_amount: data.retainage_amount,
      notes: data.notes,
      sort_order: data.sort_order,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('Error in SOV entries PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; id: string }> }
) {
  try {
    const { jobId, id } = await params;
    const { error } = await supabase
      .from('sov_entries')
      .delete()
      .eq('id', id)
      .eq('job_id', jobId); // Extra security check

    if (error) {
      console.error('Error deleting SOV entry:', error);
      return NextResponse.json(
        { error: 'Failed to delete SOV entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in SOV entries DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
