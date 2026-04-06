"use client"

import { useState, useEffect } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"
import { supabaseSignAnalytics } from "@/lib/supabase-sign-analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

type ProductivityClient = SupabaseClient<any, "public", any>

async function fetchAllEntries(client: ProductivityClient) {
  let allEntries: ProductivityEntry[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data: entries, error } = await client
      .from("sign_production")
      .select("*")
      .order("date", { ascending: false })
      .range(from, from + batchSize - 1)

    if (error) {
      return { data: allEntries, error }
    }

    if (entries && entries.length > 0) {
      allEntries = [...allEntries, ...entries]
      from += batchSize
      hasMore = entries.length === batchSize
    } else {
      hasMore = false
    }
  }

  return { data: allEntries, error: null }
}

async function insertEntriesWithFallback(entries: ProductivityEntry[]) {
  const primaryResult = await supabaseSignAnalytics.from("sign_production").insert(entries)
  if (!primaryResult.error) {
    return
  }

  console.warn("[daily-tracker] insert failed against analytics database, retrying with primary database", primaryResult.error)

  const fallbackSupabase = getSupabaseBrowserClient()
  const fallbackResult = await fallbackSupabase.from("sign_production").insert(entries)

  if (fallbackResult.error) {
    console.error("[daily-tracker] insert failed against both analytics and primary databases", fallbackResult.error)
    throw fallbackResult.error
  }

  console.info("[daily-tracker] insert succeeded using primary database fallback")
}

export function useProductivityData() {
  const [data, setData] = useState<ProductivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const analyticsResult = await fetchAllEntries(supabaseSignAnalytics)
      const fallbackSupabase = getSupabaseBrowserClient()

      if (analyticsResult.error) {
        console.warn("[daily-tracker] analytics fetch failed, retrying with primary database", analyticsResult.error)
        const fallbackResult = await fetchAllEntries(fallbackSupabase)

        if (fallbackResult.error) {
          console.error("[daily-tracker] primary fallback fetch also failed", fallbackResult.error)
          setData([])
          return
        }

        console.info("[daily-tracker] fetched productivity data using primary database fallback", {
          rows: fallbackResult.data.length,
        })
        setData(fallbackResult.data)
        return
      }

      if (analyticsResult.data.length > 0) {
        setData(analyticsResult.data)
        return
      }

      const fallbackResult = await fetchAllEntries(fallbackSupabase)
      if (fallbackResult.error) {
        console.error("[daily-tracker] fallback fetch failed after analytics returned no rows", fallbackResult.error)
        setData([])
        return
      }

      if (fallbackResult.data.length > 0) {
        console.info("[daily-tracker] analytics database returned no rows, using primary database rows instead", {
          rows: fallbackResult.data.length,
        })
      } else {
        console.warn("[daily-tracker] no productivity rows found in either analytics or primary database")
      }

      setData(fallbackResult.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const addEntry = async (entry: ProductivityEntry) => {
    // Ensure date is a simple string in YYYY-MM-DD format, not a Date object
    if (typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      throw new Error(`Invalid date format: ${entry.date}. Expected YYYY-MM-DD string.`)
    }

    console.log("[v0] addEntry - Original date string:", entry.date)

    // Parse the date string and create a Date object at noon local time to avoid timezone boundary issues
    const [year, month, day] = entry.date.split('-').map(Number)
    const localDate = new Date(year, month - 1, day, 12, 0, 0) // Noon local time

    // Format as ISO string which includes timezone - PostgreSQL will handle this correctly
    const dateWithTimezone = localDate.toISOString().split('T')[0] // Extract just YYYY-MM-DD

    console.log("[v0] addEntry - Transformed date for DB:", dateWithTimezone)
    console.log("[v0] addEntry - Local date object:", localDate.toString())

    const entryToInsert = {
      ...entry,
      date: dateWithTimezone
    }

    await insertEntriesWithFallback([entryToInsert])

    console.log("[v0] addEntry - Successfully inserted")
    await fetchData()
  }

  const importCsv = async (entries: ProductivityEntry[]) => {
    await insertEntriesWithFallback(entries)

    await fetchData()
  }

  const getLastEntryDate = () => {
    if (data.length === 0) return null
    const dates = data.map((entry) => new Date(entry.date).getTime())
    return new Date(Math.max(...dates)).toISOString().split("T")[0]
  }

  return { data, addEntry, importCsv, getLastEntryDate, isLoading, refetch: fetchData }
}
