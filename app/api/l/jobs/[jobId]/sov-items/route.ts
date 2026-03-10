rimport { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { data, error } = await supabase
      .from('sov_entries')
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
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching SOV entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SOV entries' },
        { status: 500 }
      );
    }

    // Transform the data to match expected format
    const transformedData = (data || []).map((entry: any) => ({
      id: entry.id,
      job_id: entry.job_id,
      sov_item_id: entry.sov_item_id,
      item_number: (entry as any).sov_items?.item_number,
      display_item_number: (entry as any).sov_items?.display_item_number,
      description: (entry as any).sov_items?.description,
      display_name: (entry as any).sov_items?.display_name,
      work_type: (entry as any).sov_items?.work_type,
      quantity: entry.quantity,
      unit_price: entry.unit_price,
      extended_price: entry.extended_price,
      retainage_type: entry.retainage_type,
      retainage_value: entry.retainage_value,
      retainage_amount: entry.retainage_amount,
      notes: entry.notes,
      sort_order: entry.sort_order,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    }));

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('Error in SOV entries GET:', error);
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
    const {
      sov_item_id,
      item_number,
      description,
      uom,
      quantity,
      unit_price,
      retainage_type,
      retainage_value,
      notes,
      sort_order
    } = body;

    let finalSovItemId = sov_item_id;

    // If no sov_item_id provided, try to find existing master item or create one
    if (!finalSovItemId && item_number) {
      // First, try to find existing master item
      const { data: existingItem } = await supabase
        .from('sov_items')
        .select('id')
        .eq('item_number', item_number)
        .single();

      if (existingItem) {
        finalSovItemId = existingItem.id;
      } else {
        // Create new master item for custom item
        const { data: newItem, error: createError } = await supabase
          .from('sov_items')
          .insert({
            item_number,
            display_item_number: item_number,
            description: description || '',
            display_name: description || item_number,
            work_type: 'OTHER',
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating master SOV item:', createError);
          return NextResponse.json(
            { error: 'Failed to create master SOV item' },
            { status: 500 }
          );
        }

        finalSovItemId = newItem.id;
      }
    }

    // Validate we have a sov_item_id
    if (!finalSovItemId) {
      return NextResponse.json(
        { error: 'Missing sov_item_id or item_number' },
        { status: 400 }
      );
    }

    // Calculate extended price and retainage amount
    const extended_price = quantity * unit_price;
    const retainage_amount = retainage_type === 'percent'
      ? extended_price * (retainage_value / 100)
      : retainage_value;

    // Get next sort order if not provided
    let finalSortOrder = sort_order;
    if (!finalSortOrder) {
      const { data: maxSort } = await supabase
        .from('sov_entries')
        .select('sort_order')
        .eq('job_id', jobId)
        .order('sort_order', { ascending: false })
        .limit(1);

      finalSortOrder = maxSort && maxSort.length > 0 ? maxSort[0].sort_order + 1 : 1;
    }

    const { data, error } = await supabase
      .from('sov_entries')
      .insert({
        job_id: jobId,
        sov_item_id: finalSovItemId,
        quantity,
        unit_price,
        extended_price,
        retainage_type,
        retainage_value,
        retainage_amount,
        notes,
        sort_order: finalSortOrder,
      })
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
      console.error('Error creating SOV entry:', error);
      return NextResponse.json(
        { error: 'Failed to create SOV entry' },
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
    console.error('Error in SOV entries POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
