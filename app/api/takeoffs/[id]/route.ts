import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Takeoff ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('takeoffs_l')
      .select(`
        id,
        title,
        work_type,
        status,
        created_at,
        updated_at,
        install_date,
        pickup_date,
        needed_by_date,
        work_order_number,
        job_id,
        contracted_or_additional,
        priority,
        notes,
        crew_notes,
        build_shop_notes,
        pm_notes,
        active_sections,
        sign_rows,
        default_sign_material
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching takeoff:', error);
      return NextResponse.json({ error: 'Takeoff not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}