import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchSovMastersForEntries, getPrimaryUom, getVisibleSovItemNumber, isRepeatableCloneItemNumber, isRepeatableSovItemNumber, resolveEntryMaster } from '@/lib/server/sov/masterItems';

const selectEntryFields = `
  id,
  job_id,
  sov_item_id,
  custom_sov_item_id,
  quantity,
  unit_price,
  extended_price,
  retainage_type,
  retainage_value,
  retainage_amount,
  notes,
  sort_order,
  created_at,
  updated_at
`;

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

    let targetEntryId = id;

    let { data: entryData, error: entryError } = await supabase
      .from('sov_entries')
      .select('sov_item_id, custom_sov_item_id')
      .eq('id', id)
      .eq('job_id', jobId)
      .single();

    if ((entryError || !entryData) && item_number && !isRepeatableSovItemNumber(item_number)) {
      const normalizedItemNumber = String(item_number).trim();
      let standardMasterQuery = supabase
        .from('sov_items')
        .select('id')
        .eq('item_number', normalizedItemNumber);

      if (work_type) {
        standardMasterQuery = standardMasterQuery.eq('work_type', work_type);
      }

      const [{ data: standardMasterRows }, { data: customMaster }] = await Promise.all([
        standardMasterQuery.limit(2),
        supabase
          .from('custom_sov_items')
          .select('id')
          .eq('job_id', jobId)
          .eq('item_number', normalizedItemNumber)
          .maybeSingle(),
      ]);

      const standardMaster = standardMasterRows?.[0] ?? null;

      let fallbackQuery = supabase
        .from('sov_entries')
        .select('id, sov_item_id, custom_sov_item_id')
        .eq('job_id', jobId);

      if (customMaster?.id) {
        fallbackQuery = fallbackQuery.eq('custom_sov_item_id', customMaster.id);
      } else if (standardMaster?.id) {
        fallbackQuery = fallbackQuery.eq('sov_item_id', standardMaster.id);
      }

      const { data: fallbackEntry, error: fallbackError } = await fallbackQuery.maybeSingle();

      if (!fallbackError && fallbackEntry) {
        targetEntryId = String(fallbackEntry.id);
        entryData = {
          sov_item_id: fallbackEntry.sov_item_id,
          custom_sov_item_id: fallbackEntry.custom_sov_item_id,
        };
        entryError = null;
      }
    }

    if (entryError || (!entryData?.sov_item_id && !entryData?.custom_sov_item_id)) {
      return NextResponse.json(
        { error: 'Failed to resolve SOV master item', details: entryError },
        { status: 500 }
      );
    }

    if (item_number || description || uom || work_type) {
      const masterTable = entryData.custom_sov_item_id ? 'custom_sov_items' : 'sov_items';
      const masterId = entryData.custom_sov_item_id ?? entryData.sov_item_id;
      let preserveInternalItemNumber = false;

      if (entryData.custom_sov_item_id) {
        const { data: currentCustomMaster } = await supabase
          .from('custom_sov_items')
          .select('item_number, display_item_number')
          .eq('id', masterId)
          .maybeSingle();

        preserveInternalItemNumber = Boolean(
          currentCustomMaster &&
          isRepeatableCloneItemNumber(currentCustomMaster.item_number) &&
          isRepeatableSovItemNumber(item_number ?? currentCustomMaster.display_item_number ?? currentCustomMaster.item_number)
        );
      }

      const { error: masterUpdateError } = await supabase
        .from(masterTable)
        .update({
          item_number: preserveInternalItemNumber ? undefined : item_number ?? undefined,
          display_item_number: item_number ?? undefined,
          description: description ?? undefined,
          display_name: description || item_number || undefined,
          work_type: work_type ?? undefined,
          uom_1: uom ?? undefined,
        })
        .eq('id', masterId);

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
      .eq('id', targetEntryId)
      .eq('job_id', jobId) // Extra security check
      .select(selectEntryFields)
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

    let masterMaps;
    try {
      masterMaps = await fetchSovMastersForEntries([data]);
    } catch (masterError) {
      return NextResponse.json(
        { error: 'Failed to fetch SOV master item', details: masterError },
        { status: 500 }
      );
    }
    const masterItem = resolveEntryMaster(data, masterMaps);
    if (!masterItem) {
      return NextResponse.json(
        { error: 'Failed to fetch SOV master item' },
        { status: 500 }
      );
    }

    // Transform response to match expected format
    const transformedData = {
      id: data.id,
      job_id: data.job_id,
      sov_item_id: data.sov_item_id,
      custom_sov_item_id: data.custom_sov_item_id,
      item_number: getVisibleSovItemNumber(masterItem),
      display_item_number: masterItem.display_item_number,
      description: masterItem.description,
      display_name: masterItem.display_name,
      work_type: masterItem.work_type,
      uom: getPrimaryUom(masterItem),
      is_custom: masterItem.source === 'custom' && !isRepeatableCloneItemNumber(masterItem.item_number),
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
