import useSWR from 'swr'
import { useMemo } from 'react'

export type SovPickerItem = {
  id: number
  item_number: string
  display_item_number?: string | null
  description: string
  display_name?: string | null
  work_type?: string | null
  uom: string
  uom_1?: string | null
  uom_2?: string | null
  uom_3?: string | null
  uom_4?: string | null
  uom_5?: string | null
  uom_6?: string | null
  uom_7?: string | null
  is_custom: boolean
}

type SovPickerResponse = {
  data: SovPickerItem[]
}

const fetcher = async (url: string): Promise<SovPickerResponse> => {
  const response = await fetch(url)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch SOV picker items')
  }

  return result
}

const normalize = (value: string | null | undefined) => String(value || '').trim().toUpperCase()
const GROUP_ORDER = [
  'DELIVERY',
  'SERVICE',
  'LANE CLOSURE',
  'FLAGGING',
  'MPT',
  'RENTAL',
  'SALE',
  'PERMANENT SIGN',
  'CUSTOM',
] as const

function normalizeUom(uom: string) {
  const trimmed = uom.trim().replace(/\s+/g, ' ')
  const normalizedKey = trimmed.replace(/\./g, '').toUpperCase()

  if (normalizedKey === 'SQ FT' || normalizedKey === 'SQFT') return 'SQ. FT'
  if (normalizedKey === 'SF') return 'SF'
  if (normalizedKey === 'LS' || normalizedKey === 'LUMP SUM') return 'LUMP SUM'

  return trimmed.toUpperCase()
}

export function getSovPickerItemUomOptions(item: Partial<SovPickerItem>) {
  return Array.from(
    new Set(
      [
        item.uom_1,
        item.uom_2,
        item.uom_3,
        item.uom_4,
        item.uom_5,
        item.uom_6,
        item.uom_7,
        item.uom,
      ]
        .filter((value): value is string => Boolean(value && value.trim()))
        .map(normalizeUom)
    )
  )
}

function getVisibleItemNumber(item: SovPickerItem) {
  const display = String(item.display_item_number || '').trim()
  const raw = String(item.item_number || '').trim()
  return display || raw
}

function getGroupHeading(item: SovPickerItem) {
  if (item.is_custom) return 'CUSTOM'

  const normalizedWorkType = normalize(item.work_type)
  if (normalizedWorkType === 'DELIVERY') return 'DELIVERY'
  if (normalizedWorkType === 'SERVICE') return 'SERVICE'
  if (normalizedWorkType === 'LANE CLOSURE' || normalizedWorkType === 'LANE_CLOSURE') {
    return 'LANE CLOSURE'
  }
  if (normalizedWorkType === 'FLAGGING') return 'FLAGGING'
  if (normalizedWorkType === 'MPT') return 'MPT'
  if (normalizedWorkType === 'RENTAL') return 'RENTAL'
  if (normalizedWorkType === 'SALE') return 'SALE'
  if (
    normalizedWorkType === 'PERMANENT SIGN' ||
    normalizedWorkType === 'PERMANENT SIGNS' ||
    normalizedWorkType === 'PERMANENT_SIGN' ||
    normalizedWorkType === 'PERMANENT_SIGNS'
  ) {
    return 'PERMANENT SIGN'
  }

  return normalizedWorkType || 'OTHER'
}

export function useSovPickerItems(search: string) {
  const { data, error, isLoading, mutate } = useSWR<SovPickerResponse>(
    '/api/sov-items',
    fetcher,
    { revalidateOnFocus: false }
  )

  const items = useMemo(() => {
    const allItems = data?.data || []
    const normalizedSearch = normalize(search)

    return allItems.filter((item) => {
      if (!normalizedSearch) return true

      return [
        item.item_number,
        item.display_item_number,
        item.description,
        item.display_name,
        item.work_type,
        item.uom,
      ]
        .map((value) => normalize(value))
        .some((value) => value.includes(normalizedSearch))
    })
  }, [data?.data, search])

  const groupedItems = useMemo(() => {
    const groups = new Map<string, SovPickerItem[]>()

    items.forEach((item) => {
      const heading = getGroupHeading(item)
      const existing = groups.get(heading) || []
      existing.push(item)
      groups.set(heading, existing)
    })

    return Array.from(groups.entries())
      .map(([heading, groupItems]) => ({
        heading,
        items: [...groupItems].sort((a, b) =>
          getVisibleItemNumber(a).localeCompare(getVisibleItemNumber(b))
        ),
      }))
      .sort((a, b) => {
        const aIndex = GROUP_ORDER.indexOf(a.heading as (typeof GROUP_ORDER)[number])
        const bIndex = GROUP_ORDER.indexOf(b.heading as (typeof GROUP_ORDER)[number])

        if (aIndex !== -1 || bIndex !== -1) {
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        }

        return a.heading.localeCompare(b.heading)
      })
  }, [items])

  return {
    items,
    groupedItems,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  }
}
