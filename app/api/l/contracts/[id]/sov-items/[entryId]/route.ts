import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseJobNotes, stringifyJobNotes } from '@/lib/jobNotes';
import { fetchSovMastersForEntries, getPrimaryUom, resolveEntryMaster } from '@/lib/server/sov/masterItems';

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

async function resolveJobIdFromContractId(contractId: string): Promise<string> {
  const { data, error } = await supabase
    .from('jobs_l')
    .select('id')
    .eq('id', contractId)
    .single();

  if (error || !data?.id) {
    throw new Error(`Unable to resolve contract/job id for ${contractId}`);
  }

  return data.id;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id: contractId, entryId } = await params;
    const jobId = await resolveJobIdFromContractId(contractId);
    const body = await request.json();

    const { item_number, description, uom, work_type, quantity, unit_price, retainage_type, retainage_value, notes, sort_order } = body;

    const normalizedQuantity = Number(quantity ?? 0);
    const normalizedUnitPrice = Number(unit_price ?? 0);
    const normalizedRetainageValue = Number(retainage_value ?? 0);
    const normalizedRetainageType = retainage_type ?? 'percent';

    const extended_price = normalizedQuantity * normalizedUnitPrice;
    const safeRetainageValue =
      normalizedRetainageType === 'percent'
        ? Math.min(Math.max(normalizedRetainageValue, 0), 100)
        : Math.min(Math.max(normalizedRetainageValue, 0), extended_price);
    const retainage_amount =
      normalizedRetainageType === 'percent'
        ? extended_price * (safeRetainageValue / 100)
        : safeRetainageValue;

    const { data: entryData, error: entryError } = await supabase
      .from('sov_entries')
      .select('sov_item_id, custom_sov_item_id')
      .eq('id', entryId)
      .eq('job_id', jobId)
      .single();

    if (entryError || (!entryData?.sov_item_id && !entryData?.custom_sov_item_id)) {
      return NextResponse.json(
        { error: 'Failed to resolve SOV master item', details: entryError },
        { status: 500 }
      );
    }

    if (item_number || description || uom || work_type) {
      const masterTable = entryData.custom_sov_item_id ? 'custom_sov_items' : 'sov_items';
      const masterId = entryData.custom_sov_item_id ?? entryData.sov_item_id;
      const { error: masterUpdateError } = await supabase
        .from(masterTable)
        .update({
          item_number: item_number ?? undefined,
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
      quantity: normalizedQuantity,
      unit_price: normalizedUnitPrice,
      extended_price,
      retainage_type: normalizedRetainageType,
      retainage_value: safeRetainageValue,
      retainage_amount,
      notes: notes ?? null,
      sort_order: sort_order ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sov_entries')
      .update(updateData)
      .eq('id', entryId)
      .eq('job_id', jobId)
      .select(selectEntryFields)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update SOV entry', details: error }, { status: 500 });
    }

    let masterMaps;
    try {
      masterMaps = await fetchSovMastersForEntries([data]);
    } catch (masterError) {
      return NextResponse.json({ error: 'Failed to fetch SOV master item', details: masterError }, { status: 500 });
    }
    const masterItem = resolveEntryMaster(data, masterMaps);
    if (!masterItem) {
      return NextResponse.json({ error: 'Failed to fetch SOV master item' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        id: data.id,
        job_id: data.job_id,
        sov_item_id: data.sov_item_id,
        custom_sov_item_id: data.custom_sov_item_id,
        item_number: masterItem.item_number,
        display_item_number: masterItem.display_item_number,
        description: masterItem.description,
        display_name: masterItem.display_name,
        work_type: masterItem.work_type,
        uom: getPrimaryUom(masterItem),
        is_custom: masterItem.source === 'custom',
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
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id: contractId, entryId } = await params;
    const jobId = await resolveJobIdFromContractId(contractId);
    let reason = '';

    try {
      const rawBody = await request.text();
      if (rawBody) {
        const body = JSON.parse(rawBody);
        reason = typeof body.reason === 'string' ? body.reason.trim() : '';
      }
    } catch {
      reason = '';
    }

    const { data: entry, error: entryError } = await supabase
      .from('sov_entries')
      .select('id, job_id, sov_item_id, custom_sov_item_id')
      .eq('id', entryId)
      .eq('job_id', jobId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Failed to find SOV entry', details: entryError }, { status: 404 });
    }

    if (reason) {
      const [{ data: masterItem }, { data: jobRow, error: jobError }] = await Promise.all([
        entry.custom_sov_item_id
          ? supabase
              .from('custom_sov_items')
              .select('item_number, display_item_number, description, display_name')
              .eq('id', entry.custom_sov_item_id)
              .single()
          : supabase
              .from('sov_items')
              .select('item_number, display_item_number, description, display_name')
              .eq('id', entry.sov_item_id)
              .single(),
        supabase
          .from('jobs_l')
          .select('additional_notes')
          .eq('id', jobId)
          .single(),
      ]);

      if (jobError) {
        return NextResponse.json({ error: 'Failed to load contract notes for deletion audit', details: jobError }, { status: 500 });
      }

      const itemNumber =
        masterItem?.display_item_number ||
        masterItem?.item_number ||
        'custom item';
      const itemLabel =
        masterItem?.display_name ||
        masterItem?.description ||
        itemNumber;

      const noteText = `Removed SOV item ${itemNumber}${itemLabel && itemLabel !== itemNumber ? ` - ${itemLabel}` : ''}. Reason: ${reason}`;
      const parsedNotes = parseJobNotes(jobRow?.additional_notes);
      const projectLog = [
        ...parsedNotes.projectLog,
        {
          id: crypto.randomUUID(),
          text: noteText,
          timestamp: Date.now(),
        },
      ];

      const { error: noteUpdateError } = await supabase
        .from('jobs_l')
        .update({
          additional_notes: stringifyJobNotes(parsedNotes.contractNotes, projectLog),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (noteUpdateError) {
        return NextResponse.json({ error: 'Failed to log SOV removal reason', details: noteUpdateError }, { status: 500 });
      }
    }

    const { error } = await supabase
      .from('sov_entries')
      .delete()
      .eq('id', entryId)
      .eq('job_id', jobId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete SOV entry', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
