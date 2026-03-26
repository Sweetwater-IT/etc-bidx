import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isRepeatableCloneItemNumber } from '@/lib/server/sov/masterItems';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workType = searchParams.get('work_type');
    const search = searchParams.get('search');
    const jobId = searchParams.get('job_id');

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

    let customItems: any[] = [];
    if (jobId) {
      let customQuery = supabase
        .from('custom_sov_items')
        .select('*')
        .eq('job_id', jobId)
        .order('item_number', { ascending: true });

      if (search) {
        customQuery = customQuery.or(`item_number.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: customData, error: customError } = await customQuery;

      if (customError) {
        console.error('Error fetching custom SOV items:', customError);
        return NextResponse.json(
          { error: 'Failed to fetch custom SOV items' },
          { status: 500 }
        );
      }

      customItems = (customData || [])
        .filter((item) => !isRepeatableCloneItemNumber(item.item_number))
        .map((item) => ({
          ...item,
          item_number: item.display_item_number || item.item_number,
          work_type: 'CUSTOM',
          is_custom: true,
          uom: item.uom_1 || item.uom_2 || item.uom_3 || item.uom_4 || item.uom_5 || item.uom_6 || item.uom_7,
        }));
    }

    // Transform the data to include a uom field using the first non-null uom from uom_1 to uom_7
    const transformedData = (data || []).map(item => ({
      ...item,
      item_number: item.display_item_number || item.item_number,
      is_custom: false,
      uom: item.uom_1 || item.uom_2 || item.uom_3 || item.uom_4 || item.uom_5 || item.uom_6 || item.uom_7
    }));

    return NextResponse.json({ data: [...transformedData, ...customItems] });
  } catch (error) {
    console.error('Error in SOV items GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
