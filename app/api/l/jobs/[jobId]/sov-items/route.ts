import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabaseResult = await supabase
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

    const { data, error } = supabaseResult;

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
  console.log('[SOV API POST] Starting POST request');
  try {
    const { jobId } = await params;
    console.log('[SOV API POST] Job ID:', jobId);

    const body = await request.json();
    console.log('[SOV API POST] Request body:', JSON.stringify(body, null, 2));

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

    console.log('[SOV API POST] Extracted fields:', {
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
    });

    let finalSovItemId = sov_item_id;
    console.log('[SOV API POST] Initial sov_item_id:', finalSovItemId);

    // If no sov_item_id provided, try to find existing master item or create one
    if (!finalSovItemId && item_number) {
      console.log('[SOV API POST] No sov_item_id provided, looking for existing master item with item_number:', item_number);

      // First, try to find existing master item
      const { data: existingItem, error: findError } = await supabase
        .from('sov_items')
        .select('id')
        .eq('item_number', item_number)
        .single();

      console.log('[SOV API POST] Existing item search result:', { existingItem, findError });

      if (existingItem) {
        finalSovItemId = existingItem.id;
        console.log('[SOV API POST] Found existing master item:', finalSovItemId);
      } else {
        console.log('[SOV API POST] Creating new master item for custom item');
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

        console.log('[SOV API POST] Master item creation result:', { newItem, createError });

        if (createError) {
          console.error('[SOV API POST] Error creating master SOV item:', createError);
          return NextResponse.json(
            { error: 'Failed to create master SOV item', details: createError },
            { status: 500 }
          );
        }

        finalSovItemId = newItem.id;
        console.log('[SOV API POST] Created new master item:', finalSovItemId);
      }
    }

    // Validate we have a sov_item_id
    if (!finalSovItemId) {
      console.error('[SOV API POST] Missing sov_item_id or item_number - validation failed');
      return NextResponse.json(
        { error: 'Missing sov_item_id or item_number' },
        { status: 400 }
      );
    }

    console.log('[SOV API POST] Final sov_item_id:', finalSovItemId);

    // Calculate extended price and retainage amount
    const extended_price = quantity * unit_price;
    const retainage_amount = retainage_type === 'percent'
      ? extended_price * (retainage_value / 100)
      : retainage_value;

    console.log('[SOV API POST] Calculated values:', {
      extended_price,
      retainage_amount,
      calculation: retainage_type === 'percent'
        ? `${extended_price} * (${retainage_value} / 100) = ${retainage_amount}`
        : `fixed amount: ${retainage_amount}`
    });

    // Get next sort order if not provided
    let finalSortOrder = sort_order;
    if (!finalSortOrder) {
      console.log('[SOV API POST] No sort_order provided, calculating next sort order');
      const { data: maxSort, error: sortError } = await supabase
        .from('sov_entries')
        .select('sort_order')
        .eq('job_id', jobId)
        .order('sort_order', { ascending: false })
        .limit(1);

      console.log('[SOV API POST] Sort order query result:', { maxSort, sortError });

      finalSortOrder = maxSort && maxSort.length > 0 ? maxSort[0].sort_order + 1 : 1;
      console.log('[SOV API POST] Calculated final sort order:', finalSortOrder);
    }

    const insertData = {
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
    };

    console.log('[SOV API POST] Inserting SOV entry with data:', JSON.stringify(insertData, null, 2));

    let { data, error } = await supabase
      .from('sov_entries')
      .insert(insertData)
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

    // Handle duplicate key constraint violation - try to update existing entry instead
    if (error && error.code === '23505' && error.message?.includes('sov_entries_job_id_sov_item_id_key')) {
      console.log('[SOV API POST] Duplicate key violation detected, attempting to update existing entry');

      // Remove sort_order from update data since we're updating an existing entry
      const { sort_order, ...updateData } = insertData;

      const { data: updateDataResult, error: updateError } = await supabase
        .from('sov_entries')
        .update(updateData)
        .eq('job_id', jobId)
        .eq('sov_item_id', finalSovItemId)
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

      console.log('[SOV API POST] Update result:', { data: !!updateDataResult, error: updateError });

      if (updateError) {
        console.error('[SOV API POST] Error updating existing SOV entry:', updateError);
        return NextResponse.json(
          { error: 'Failed to update SOV entry', details: updateError },
          { status: 500 }
        );
      }

      data = updateDataResult;
      console.log('[SOV API POST] Successfully updated existing SOV entry');
    } else if (error) {
      console.error('[SOV API POST] Error creating SOV entry:', error);
      return NextResponse.json(
        { error: 'Failed to create SOV entry', details: error },
        { status: 500 }
      );
    }



    console.log('[SOV API POST] Raw data from insert:', JSON.stringify(data, null, 2));

    if (!data) {
      console.error('[SOV API POST] No data returned from database operation');
      return NextResponse.json(
        { error: 'No data returned from database operation' },
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

    console.log('[SOV API POST] Transformed response data:', JSON.stringify(transformedData, null, 2));
    console.log('[SOV API POST] POST request completed successfully');

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('[SOV API POST] Unexpected error in POST handler:', error);
    console.error('[SOV API POST] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
