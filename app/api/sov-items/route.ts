import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workType = searchParams.get('work_type');
    const search = searchParams.get('search');

    let query = supabase
      .from('sov_items')
      .select('*')
      .order('item_number', { ascending: true });

    // Filter by work type if provided
    if (workType) {
      query = query.eq('work_type', workType);
    }

    // Search by item number or description if provided
    if (search) {
      query = query.or(`item_number.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SOV items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SOV items' },
        { status: 500 }
      );
    }

    // Transform the data to include a uom field using the first non-null uom from uom_1 to uom_7
    const transformedData = (data || []).map(item => ({
      ...item,
      uom: item.uom_1 || item.uom_2 || item.uom_3 || item.uom_4 || item.uom_5 || item.uom_6 || item.uom_7
    }));

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('Error in SOV items GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
