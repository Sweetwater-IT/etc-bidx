import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API: Fetching takeoff with ID:', id);

    if (!id) {
      console.log('API: No takeoff ID provided');
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
        is_multi_day_job,
        end_date,
        work_order_number,
        work_order_id,
        job_id,
        contracted_or_additional,
        priority,
        notes,
        crew_notes,
        build_shop_notes,
        pm_notes,
        active_sections,
        sign_rows,
        default_sign_material,
        active_permanent_items,
        permanent_sign_rows,
        permanent_entry_rows,
        default_permanent_sign_material,
        vehicle_items,
        rolling_stock_items,
        additional_items
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('API: Error fetching takeoff:', error);
      console.error('API: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ error: 'Takeoff not found' }, { status: 404 });
    }

    const { data: takeoffItems, error: takeoffItemsError } = await supabase
      .from('takeoff_items_l')
      .select('*')
      .eq('takeoff_id', id)
      .is('deleted_at', null)
      .order('load_order', { ascending: true });

    if (takeoffItemsError) {
      console.error('API: Error fetching takeoff items:', takeoffItemsError);
    }

    console.log('API: Successfully fetched takeoff:', data);
    return NextResponse.json({
      ...data,
      takeoff_items: takeoffItems || [],
    });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
