import { supabase } from '@/lib/supabase';
import {
  fetchSovMastersForEntries,
  getPrimaryUom,
  resolveEntryMaster,
} from '@/lib/server/sov/masterItems';

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
  custom_sov_item_id?: string | null;
  item_number?: string | null;
  description?: string | null;
  work_type?: string | null;
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
    custom_sov_item_id,
    item_number,
    description,
    work_type,
    uom,
    quantity,
    unit_price,
    retainage_type,
    retainage_value,
    notes,
    sort_order,
  } = input;

  let finalSovItemId = sov_item_id ?? null;
  let finalCustomSovItemId = custom_sov_item_id ?? null;

  if (!finalSovItemId && !finalCustomSovItemId && item_number) {
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
        .from('custom_sov_items')
        .insert({
          job_id: jobId,
          item_number,
          display_item_number: item_number,
          description: description ?? '',
          display_name: description || item_number,
          work_type: work_type ?? 'OTHER',
          uom_1: uom ?? 'UNKNOWN',
        })
        .select('id')
        .single();

      if (createError) {
        throw new SovUpsertError('Failed to create custom SOV item', 500, createError);
      }

      finalCustomSovItemId = newItem.id;
    }
  }

  if (!finalSovItemId && !finalCustomSovItemId) {
    throw new SovUpsertError('Missing sov_item_id, custom_sov_item_id, or item_number', 400);
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
    custom_sov_item_id: finalCustomSovItemId,
    quantity: normalizedQuantity,
    unit_price: normalizedUnitPrice,
    extended_price,
    retainage_type: normalizedRetainageType,
    retainage_value: normalizedRetainageValue,
    retainage_amount,
    notes: notes ?? null,
    sort_order: finalSortOrder,
  };

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

  const hydrateResponse = async (entry: any) => {
    const masterMaps = await fetchSovMastersForEntries([entry]);
    const masterItem = resolveEntryMaster(entry, masterMaps);

    if (!masterItem) {
      throw new SovUpsertError('Failed to fetch SOV master item after save', 500);
    }

    return {
      id: entry.id,
      job_id: entry.job_id,
      sov_item_id: entry.sov_item_id,
      custom_sov_item_id: entry.custom_sov_item_id,
      item_number: masterItem.item_number,
      display_item_number: masterItem.display_item_number,
      description: masterItem.description,
      display_name: masterItem.display_name,
      work_type: masterItem.work_type,
      uom: getPrimaryUom(masterItem),
      is_custom: masterItem.source === 'custom',
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
    };
  };

  let { data, error } = await supabase
    .from('sov_entries')
    .insert(writePayload)
    .select(selectEntryFields)
    .single();

  const duplicateStandard = error && error.code === '23505' && error.message?.includes('sov_entries_job_id_sov_item_id_key');
  const duplicateCustom = error && error.code === '23505' && error.message?.includes('sov_entries_job_id_custom_sov_item_id_key');

  if (duplicateStandard || duplicateCustom) {
    const { sort_order: _ignoredSort, ...updatePayload } = writePayload;
    let updateQuery = supabase
      .from('sov_entries')
      .update(updatePayload)
      .eq('job_id', jobId);

    if (finalCustomSovItemId) {
      updateQuery = updateQuery.eq('custom_sov_item_id', finalCustomSovItemId);
    } else {
      updateQuery = updateQuery.eq('sov_item_id', finalSovItemId);
    }

    const { data: updatedData, error: updateError } = await updateQuery
      .select(selectEntryFields)
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

  return await hydrateResponse(data);
}
