import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; id: string }> }
) {
  console.log('[SOV API PUT] Starting PUT request');
  try {
    const { jobId, id } = await params;
    console.log('[SOV API PUT] Job ID:', jobId, 'Entry ID:', id);

    const body = await request.json();
    console.log('[SOV API PUT] Request body:', JSON.stringify(body, null, 2));

    const { item_number, description, uom, work_type, quantity, unit_price, retainage_type, retainage_value, notes, sort_order } = body;
    console.log('[SOV API PUT] Extracted fields:', {
      quantity,
      unit_price,
      retainage_type,
      retainage_value,
      notes,
      sort_order
    });

    // Calculate extended price and retainage amount
    const extended_price = quantity * unit_price;
    const retainage_amount = retainage_type === 'percent'
      ? extended_price * (retainage_value / 100)
      : retainage_value;

    console.log('[SOV API PUT] Calculated values:', {
      extended_price,
      retainage_amount,
      calculation: retainage_type === 'percent'
        ? `${extended_price} * (${retainage_value} / 100) = ${retainage_amount}`
        : `fixed amount: ${retainage_amount}`
    });

    const { data: entryData, error: entryError } = await supabase
      .from('sov_entries')
      .select('sov_item_id')
      .eq('id', id)
      .eq('job_id', jobId)
      .single();

    if (entryError || !entryData?.sov_item_id) {
      return NextResponse.json(
        { error: 'Failed to resolve SOV master item', details: entryError },
        { status: 500 }
      );
    }

    if (item_number || description || uom || work_type) {
      const { error: masterUpdateError } = await supabase
        .from('sov_items')
        .update({
          item_number: item_number ?? undefined,
          display_item_number: item_number ?? undefined,
          description: description ?? undefined,
          display_name: description || item_number || undefined,
          work_type: work_type ?? undefined,
          uom_1: uom ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryData.sov_item_id);

      if (masterUpdateError) {
        return NextResponse.json(
          { error: 'Failed to update SOV master item', details: masterUpdateError },
          { status: 500 }
        );
      }
    }

    const updateData = {
      quantity,
      unit_price,
      extended_price,
      retainage_type,
      retainage_value,
      retainage_amount,
      notes,
      sort_order,
      updated_at: new Date().toISOString(),
    };

    console.log('[SOV API PUT] Updating SOV entry with data:', JSON.stringify(updateData, null, 2));

    const { data, error } = await supabase
      .from('sov_entries')
      .update(updateData)
      .eq('id', id)
      .eq('job_id', jobId) // Extra security check
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
          work_type,
          uom_1,
          uom_2,
          uom_3,
          uom_4,
          uom_5,
          uom_6
        )
      `)
      .single();

    console.log('[SOV API PUT] Supabase update result:', { data: !!data, error });

    if (error) {
      console.error('[SOV API PUT] Error updating SOV entry:', error);
      return NextResponse.json(
        { error: 'Failed to update SOV entry', details: error },
        { status: 500 }
      );
    }

    console.log('[SOV API PUT] Raw data from update:', JSON.stringify(data, null, 2));

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
      uom: (data as any).sov_items?.uom_1 || (data as any).sov_items?.uom_2 || (data as any).sov_items?.uom_3 || (data as any).sov_items?.uom_4 || (data as any).sov_items?.uom_5 || (data as any).sov_items?.uom_6,
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

    console.log('[SOV API PUT] Transformed response data:', JSON.stringify(transformedData, null, 2));
    console.log('[SOV API PUT] PUT request completed successfully');

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('[SOV API PUT] Unexpected error in PUT handler:', error);
    console.error('[SOV API PUT] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; id: string }> }
) {
  console.log('[SOV API DELETE] Starting DELETE request');
  try {
    const { jobId, id } = await params;
    console.log('[SOV API DELETE] Job ID:', jobId, 'Entry ID:', id);

    console.log('[SOV API DELETE] Deleting SOV entry...');
    const { error } = await supabase
      .from('sov_entries')
      .delete()
      .eq('id', id)
      .eq('job_id', jobId); // Extra security check

    console.log('[SOV API DELETE] Supabase delete result:', { error });

    if (error) {
      console.error('[SOV API DELETE] Error deleting SOV entry:', error);
      return NextResponse.json(
        { error: 'Failed to delete SOV entry', details: error },
        { status: 500 }
      );
    }

    console.log('[SOV API DELETE] DELETE request completed successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SOV API DELETE] Unexpected error in DELETE handler:', error);
    console.error('[SOV API DELETE] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
