import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; id: string }> }
) {
  try {
    const { jobId, id } = await params;
    const body = await request.json();
    const { item_number, description, uom, quantity, unit_price, retainage_type, retainage_value, notes, sort_order } = body;

    // Calculate extended price and retainage amount
    const extended_price = quantity * unit_price;
    const retainage_amount = retainage_type === 'percent'
      ? extended_price * (retainage_value / 100)
      : retainage_value;

    const { data, error } = await supabase
      .from('sov_items_l')
      .update({
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
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('job_id', jobId) // Extra security check
      .select()
      .single();

    if (error) {
      console.error('Error updating SOV item:', error);
      return NextResponse.json(
        { error: 'Failed to update SOV item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in SOV items PUT:', error);
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
      .from('sov_items_l')
      .delete()
      .eq('id', id)
      .eq('job_id', jobId); // Extra security check

    if (error) {
      console.error('Error deleting SOV item:', error);
      return NextResponse.json(
        { error: 'Failed to delete SOV item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in SOV items DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}