import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { quantity, unit_price, retainage_type, retainage_value, notes, sort_order } = body;

    const normalizedQuantity = Number(quantity ?? 0);
    const normalizedUnitPrice = Number(unit_price ?? 0);
    const normalizedRetainageValue = Number(retainage_value ?? 0);
    const normalizedRetainageType = retainage_type ?? 'percent';

    const extended_price = normalizedQuantity * normalizedUnitPrice;
    const retainage_amount =
      normalizedRetainageType === 'percent'
        ? extended_price * (normalizedRetainageValue / 100)
        : normalizedRetainageValue;

    const updateData = {
      quantity: normalizedQuantity,
      unit_price: normalizedUnitPrice,
      extended_price,
      retainage_type: normalizedRetainageType,
      retainage_value: normalizedRetainageValue,
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
      .select(
        `
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
          uom
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update SOV entry', details: error }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        id: data.id,
        job_id: data.job_id,
        sov_item_id: data.sov_item_id,
        item_number: (data as any).sov_items?.item_number,
        display_item_number: (data as any).sov_items?.display_item_number,
        description: (data as any).sov_items?.description,
        display_name: (data as any).sov_items?.display_name,
        work_type: (data as any).sov_items?.work_type,
        uom: (data as any).sov_items?.uom,
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
