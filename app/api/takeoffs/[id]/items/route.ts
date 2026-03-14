import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: takeoffId } = await params;
    const body = await request.json();

    if (!takeoffId) {
      return NextResponse.json({ error: 'Takeoff ID is required' }, { status: 400 });
    }

    const { itemId, return_details, return_condition, damage_photos } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (return_details !== undefined) updateData.return_details = return_details;
    if (return_condition !== undefined) updateData.return_condition = return_condition;
    if (damage_photos !== undefined) updateData.damage_photos = damage_photos;

    const { data, error } = await supabase
      .from('takeoff_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('takeoff_id', takeoffId)
      .select()
      .single();

    if (error) {
      console.error('Error updating takeoff item:', error);
      return NextResponse.json({ error: 'Failed to update takeoff item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}