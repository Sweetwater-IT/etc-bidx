"use client"

import { useState, useEffect } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"
import { supabaseSignAnalytics } from "@/lib/supabase-sign-analytics"

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

async function insertEntries(entries: ProductivityEntry[]) {
  const { error } = await supabaseSignAnalytics.from("sign_production").insert(entries)
  if (error) {
    console.error("[daily-tracker] insert failed against analytics database", error)
    throw error
  }
}

export function useProductivityData() {
  const [data, setData] = useState<ProductivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const result = await fetchAllEntries(supabaseSignAnalytics)
      if (result.error) {
        console.error("[daily-tracker] analytics fetch failed", result.error)
        setData([])
        return
      }
      setData(result.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const addEntry = async (entry: ProductivityEntry) => {
    if (typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      throw new Error(`Invalid date format: ${entry.date}. Expected YYYY-MM-DD string.`)
    }

    console.log("[v0] addEntry - Original date string:", entry.date)

    const [year, month, day] = entry.date.split("-").map(Number)
    const localDate = new Date(year, month - 1, day, 12, 0, 0)
    const dateWithTimezone = localDate.toISOString().split("T")[0]

    console.log("[v0] addEntry - Transformed date for DB:", dateWithTimezone)
    console.log("[v0] addEntry - Local date object:", localDate.toString())

    const entryToInsert = {
      ...entry,
      date: dateWithTimezone,
    }

    await insertEntries([entryToInsert])

    console.log("[v0] addEntry - Successfully inserted")
    await fetchData()
  }

  const importCsv = async (entries: ProductivityEntry[]) => {
    await insertEntries(entries)
    await fetchData()
  }

  const getLastEntryDate = () => {
    if (data.length === 0) return null
    const dates = data.map((entry) => new Date(entry.date).getTime())
    return new Date(Math.max(...dates)).toISOString().split("T")[0]
  }

  return { data, addEntry, importCsv, getLastEntryDate, isLoading, refetch: fetchData }
}
