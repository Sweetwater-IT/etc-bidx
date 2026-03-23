import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const selectEntryFields = `
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
      .select('sov_item_id')
      .eq('id', entryId)
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

    const { data: masterItem, error: masterError } = await supabase
      .from('sov_items')
      .select('id, item_number, display_item_number, description, display_name, work_type, uom_1, uom_2, uom_3, uom_4, uom_5, uom_6')
      .eq('id', data.sov_item_id)
      .single();

    if (masterError || !masterItem) {
      return NextResponse.json({ error: 'Failed to fetch SOV master item', details: masterError }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        id: data.id,
        job_id: data.job_id,
        sov_item_id: data.sov_item_id,
        item_number: masterItem.item_number,
        display_item_number: masterItem.display_item_number,
        description: masterItem.description,
        display_name: masterItem.display_name,
        work_type: masterItem.work_type,
        uom: masterItem.uom_1 || masterItem.uom_2 || masterItem.uom_3 || masterItem.uom_4 || masterItem.uom_5 || masterItem.uom_6,
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
