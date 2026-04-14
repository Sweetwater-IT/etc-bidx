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

function getVisibleItemNumber(item: SovPickerItem) {
  const display = String(item.display_item_number || '').trim()
  const raw = String(item.item_number || '').trim()
  return display || raw
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
      const heading = normalize(item.work_type) || 'OTHER'
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
      .sort((a, b) => a.heading.localeCompare(b.heading))
  }, [items])

  return {
    items,
    groupedItems,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  }
}
