import { supabase } from '@/lib/supabase';

export class SovUpsertError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'SovUpsertError';
    this.status = status;
    this.details = details;
  }
}

export type UpsertSovEntryInput = {
  jobId: string;
  sov_item_id?: string | null;
  item_number?: string | null;
  description?: string | null;
  uom?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  retainage_type?: string | null;
  retainage_value?: number | null;
  notes?: string | null;
  sort_order?: number | null;
};

export async function upsertSovEntry(input: UpsertSovEntryInput) {
  const {
    jobId,
    sov_item_id,
    item_number,
    description,
    uom,
    quantity,
    unit_price,
    retainage_type,
    retainage_value,
    notes,
    sort_order,
  } = input;

  let finalSovItemId = sov_item_id ?? null;

  if (!finalSovItemId && item_number) {
    const { data: existingItem, error: findError } = await supabase
      .from('sov_items')
      .select('id')
      .eq('item_number', item_number)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw new SovUpsertError('Failed to lookup master SOV item', 500, findError);
    }

    if (existingItem) {
      finalSovItemId = existingItem.id;
    } else {
      const { data: newItem, error: createError } = await supabase
        .from('sov_items')
        .insert({
          item_number,
          display_item_number: item_number,
          description: description ?? '',
          display_name: description || item_number,
          work_type: 'OTHER',
        })
        .select('id')
        .single();

      if (createError) {
        throw new SovUpsertError('Failed to create master SOV item', 500, createError);
      }

      finalSovItemId = newItem.id;
    }
  }

  if (!finalSovItemId) {
    throw new SovUpsertError('Missing sov_item_id or item_number', 400);
  }

  const normalizedQuantity = Number(quantity ?? 0);
  const normalizedUnitPrice = Number(unit_price ?? 0);
  const normalizedRetainageValue = Number(retainage_value ?? 0);
  const normalizedRetainageType = retainage_type ?? 'percent';

  const extended_price = normalizedQuantity * normalizedUnitPrice;
  const retainage_amount = normalizedRetainageType === 'percent'
    ? extended_price * (normalizedRetainageValue / 100)
    : normalizedRetainageValue;

  let finalSortOrder = sort_order ?? null;

  if (finalSortOrder == null) {
    const { data: maxSort, error: sortError } = await supabase
      .from('sov_entries')
      .select('sort_order')
      .eq('job_id', jobId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (sortError) {
      throw new SovUpsertError('Failed to determine SOV sort order', 500, sortError);
    }

    finalSortOrder = maxSort && maxSort.length > 0 ? maxSort[0].sort_order + 1 : 1;
  }

  const writePayload = {
    job_id: jobId,
    sov_item_id: finalSovItemId,
    quantity: normalizedQuantity,
    unit_price: normalizedUnitPrice,
    extended_price,
    retainage_type: normalizedRetainageType,
    retainage_value: normalizedRetainageValue,
    retainage_amount,
    notes: notes ?? null,
    sort_order: finalSortOrder,
  };

  let { data, error } = await supabase
    .from('sov_entries')
    .insert(writePayload)
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

  if (error && error.code === '23505' && error.message?.includes('sov_entries_job_id_sov_item_id_key')) {
    const { sort_order: _ignoredSort, ...updatePayload } = writePayload;
    const { data: updatedData, error: updateError } = await supabase
      .from('sov_entries')
      .update(updatePayload)
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

    if (updateError) {
      throw new SovUpsertError('Failed to update existing SOV entry', 500, updateError);
    }

    data = updatedData;
    error = null;
  }

  if (error) {
    throw new SovUpsertError('Failed to create SOV entry', 500, error);
  }

  if (!data) {
    throw new SovUpsertError('No data returned from database operation', 500);
  }

  return {
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
}
