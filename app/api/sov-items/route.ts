import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isRepeatableCloneItemNumber } from '@/lib/server/sov/masterItems';

function resolvePrimaryUom(item: Record<string, unknown>) {
  return (
    item.uom ||
    item.uom_1 ||
    item.uom_2 ||
    item.uom_3 ||
    item.uom_4 ||
    item.uom_5 ||
    item.uom_6 ||
    item.uom_7 ||
    'EA'
  );
}

function normalizeCustomDedupKey(item: {
  item_number?: string | null;
  display_item_number?: string | null;
  description?: string | null;
  display_name?: string | null;
  work_type?: string | null;
}) {
  return [
    String(item.item_number || '').trim().toUpperCase(),
    String(item.display_item_number || '').trim().toUpperCase(),
    String(item.description || '').trim().toUpperCase(),
    String(item.display_name || '').trim().toUpperCase(),
    String(item.work_type || '').trim().toUpperCase(),
  ].join('::');
}

function mapCustomItem(item: any) {
  return {
    ...item,
    is_custom: true,
    work_type: item.work_type || 'CUSTOM',
    uom: resolvePrimaryUom(item),
    uom_1: item.uom_1 || null,
    uom_2: item.uom_2 || null,
    uom_3: item.uom_3 || null,
    uom_4: item.uom_4 || null,
    uom_5: item.uom_5 || null,
    uom_6: item.uom_6 || null,
    uom_7: item.uom_7 || null,
  };
}

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

    // Search across the fields exposed in the selector
    if (search) {
      query = query.or(
        `item_number.ilike.%${search}%,display_item_number.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%,work_type.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SOV items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SOV items' },
        { status: 500 }
      );
    }

    let customQuery = supabase
      .from('custom_sov_items')
      .select('*')
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (jobId) {
      customQuery = customQuery.eq('job_id', jobId);
    }

    if (search) {
      customQuery = customQuery.or(
        `item_number.ilike.%${search}%,display_item_number.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%,work_type.ilike.%${search}%`
      );
    }

    const { data: customData, error: customError } = await customQuery;

    if (customError) {
      console.error('Error fetching custom SOV items:', customError);
      return NextResponse.json(
        { error: 'Failed to fetch custom SOV items' },
        { status: 500 }
      );
    }

    const customItems = (customData || [])
      .filter((item) => !isRepeatableCloneItemNumber(item.item_number))
      .map(mapCustomItem)
      .reduce<any[]>((acc, item) => {
        const key = normalizeCustomDedupKey(item);
        if (!acc.some((existing) => normalizeCustomDedupKey(existing) === key)) {
          acc.push(item);
        }
        return acc;
      }, [])
      .sort((a, b) => String(a.item_number || '').localeCompare(String(b.item_number || '')));

    const transformedData = (data || []).map(item => ({
      ...item,
      is_custom: false,
      uom: resolvePrimaryUom(item),
      work_type: item.work_type || 'OTHER',
      uom_1: item.uom_1 || null,
      uom_2: item.uom_2 || null,
      uom_3: item.uom_3 || null,
      uom_4: item.uom_4 || null,
      uom_5: item.uom_5 || null,
      uom_6: item.uom_6 || null,
      uom_7: item.uom_7 || null,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const itemNumber = String(body.itemNumber || '').trim();
    const description = String(body.description || '').trim();
    const workType = String(body.workType || 'CUSTOM').trim();
    const uom = String(body.uom || 'EA').trim();
    const contractNumber = String(body.contractNumber || '').trim();

    if (!itemNumber || !description) {
      return NextResponse.json(
        { error: 'Item number and description are required' },
        { status: 400 }
      );
    }

    if (!contractNumber) {
      return NextResponse.json(
        { error: 'Select a project or contract first to save a shared custom SOV item.' },
        { status: 400 }
      );
    }

    const { data: existingItem } = await supabase
      .from('custom_sov_items')
      .select('id')
      .ilike('item_number', itemNumber)
      .limit(1);

    if (existingItem && existingItem.length > 0) {
      return NextResponse.json(
        { error: `A custom SOV item with item number ${itemNumber} already exists.` },
        { status: 409 }
      );
    }

    const { data: matchingJob, error: jobError } = await supabase
      .from('jobs_l')
      .select('id, contract_number')
      .eq('contract_number', contractNumber)
      .limit(1)
      .maybeSingle();

    if (jobError) {
      console.error('Error resolving jobs_l contract for custom SOV item:', jobError);
      return NextResponse.json(
        { error: 'Failed to resolve project context for custom SOV item.' },
        { status: 500 }
      );
    }

    if (!matchingJob?.id) {
      return NextResponse.json(
        { error: 'No matching contract was found in the contract SOV system for this quote.' },
        { status: 400 }
      );
    }

    const { data: createdItem, error: createError } = await supabase
      .from('custom_sov_items')
      .insert({
        job_id: matchingJob.id,
        item_number: itemNumber,
        display_item_number: itemNumber,
        description,
        display_name: description,
        work_type: workType || 'CUSTOM',
        uom_1: uom || 'EA',
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating custom SOV item:', createError);
      return NextResponse.json(
        { error: 'Failed to create custom SOV item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, item: mapCustomItem(createdItem) });
  } catch (error) {
    console.error('Error in SOV items POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
