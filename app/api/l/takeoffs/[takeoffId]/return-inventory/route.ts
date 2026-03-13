import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { takeoffId: string } }
) {
  try {
    const takeoffId = params.takeoffId;

    const { data, error } = await supabase
      .from("takeoff_items")
      .select("id, product_name, category, quantity, return_condition, return_details, damage_photos, notes")
      .eq("takeoff_id", takeoffId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error('Error fetching return inventory:', error);
      return NextResponse.json({ error: 'Failed to fetch return inventory' }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { takeoffId: string } }
) {
  try {
    const takeoffId = params.takeoffId;
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 });
    }

    const updatePromises = updates.map(({ id, return_details, return_condition, damage_photos }) =>
      supabase
        .from("takeoff_items")
        .update({
          return_details,
          return_condition,
          damage_photos,
        })
        .eq("id", id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors updating return inventory:', errors);
      return NextResponse.json({ error: 'Failed to update some items' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}