import { supabase } from '@/lib/supabase';

export const SOV_MASTER_SELECT_FIELDS = `
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
  uom_6,
  uom_7
`;

export type SovMasterSource = 'standard' | 'custom';
export const REPEATABLE_SOV_ITEM_NUMBERS = ['SERVICE', 'DELIVERY'] as const;
const REPEATABLE_CLONE_MARKER = '__ROW__';

export interface SovMasterItemRecord {
  id: number;
  item_number: string;
  display_item_number: string;
  description: string;
  display_name: string;
  work_type: string;
  uom_1: string | null;
  uom_2: string | null;
  uom_3: string | null;
  uom_4: string | null;
  uom_5: string | null;
  uom_6: string | null;
  uom_7: string | null;
  source: SovMasterSource;
}

export function normalizeSovItemNumber(value: string | null | undefined): string {
  return String(value || '').trim().toUpperCase();
}

export function isRepeatableSovItemNumber(value: string | null | undefined): boolean {
  return REPEATABLE_SOV_ITEM_NUMBERS.includes(normalizeSovItemNumber(value) as (typeof REPEATABLE_SOV_ITEM_NUMBERS)[number]);
}

export function buildRepeatableCloneItemNumber(value: string | null | undefined): string {
  const base = normalizeSovItemNumber(value);
  return `${base}${REPEATABLE_CLONE_MARKER}${crypto.randomUUID()}`;
}

export function isRepeatableCloneItemNumber(value: string | null | undefined): boolean {
  return normalizeSovItemNumber(value).includes(REPEATABLE_CLONE_MARKER);
}

export function getVisibleSovItemNumber(item: Partial<SovMasterItemRecord> | null | undefined): string {
  return item?.display_item_number || item?.item_number || '';
}

type EntryWithMasterIds = {
  sov_item_id?: number | null;
  custom_sov_item_id?: number | null;
};

function attachSource<T extends Omit<SovMasterItemRecord, 'source'>>(row: T, source: SovMasterSource): SovMasterItemRecord {
  return {
    ...row,
    source,
  };
}

export function getPrimaryUom(item: Partial<SovMasterItemRecord> | null | undefined): string {
  return (
    item?.uom_1 ||
    item?.uom_2 ||
    item?.uom_3 ||
    item?.uom_4 ||
    item?.uom_5 ||
    item?.uom_6 ||
    item?.uom_7 ||
    'EA'
  );
}

export async function fetchSovMastersByIds(
  sovItemIds: number[],
  customSovItemIds: number[]
): Promise<{
  standardById: Map<number, SovMasterItemRecord>;
  customById: Map<number, SovMasterItemRecord>;
}> {
  const uniqueStandardIds = Array.from(new Set(sovItemIds.filter((id): id is number => Number.isFinite(id))));
  const uniqueCustomIds = Array.from(new Set(customSovItemIds.filter((id): id is number => Number.isFinite(id))));

  const [standardRes, customRes] = await Promise.all([
    uniqueStandardIds.length > 0
      ? supabase.from('sov_items').select(SOV_MASTER_SELECT_FIELDS).in('id', uniqueStandardIds)
      : Promise.resolve({ data: [], error: null }),
    uniqueCustomIds.length > 0
      ? supabase.from('custom_sov_items').select(SOV_MASTER_SELECT_FIELDS).in('id', uniqueCustomIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (standardRes.error) throw standardRes.error;
  if (customRes.error) throw customRes.error;

  const standardById = new Map<number, SovMasterItemRecord>(
    ((standardRes.data || []) as Array<Omit<SovMasterItemRecord, 'source'>>).map((item) => [
      Number(item.id),
      attachSource(item, 'standard'),
    ])
  );

  const customById = new Map<number, SovMasterItemRecord>(
    ((customRes.data || []) as Array<Omit<SovMasterItemRecord, 'source'>>).map((item) => [
      Number(item.id),
      attachSource(item, 'custom'),
    ])
  );

  return { standardById, customById };
}

export async function fetchSovMastersForEntries(entries: EntryWithMasterIds[]) {
  const sovItemIds = entries.map((entry) => Number(entry.sov_item_id)).filter((id) => Number.isFinite(id));
  const customSovItemIds = entries.map((entry) => Number(entry.custom_sov_item_id)).filter((id) => Number.isFinite(id));
  return fetchSovMastersByIds(sovItemIds, customSovItemIds);
}

export function resolveEntryMaster(
  entry: EntryWithMasterIds,
  maps: {
    standardById: Map<number, SovMasterItemRecord>;
    customById: Map<number, SovMasterItemRecord>;
  }
): SovMasterItemRecord | undefined {
  if (entry.custom_sov_item_id != null) {
    return maps.customById.get(Number(entry.custom_sov_item_id));
  }

  if (entry.sov_item_id != null) {
    return maps.standardById.get(Number(entry.sov_item_id));
  }

  return undefined;
}
