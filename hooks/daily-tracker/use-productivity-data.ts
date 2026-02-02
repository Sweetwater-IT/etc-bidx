"use client"

import { useState, useEffect } from "react"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"
import { supabaseSignAnalytics } from "@/lib/supabase-sign-analytics"

export function useProductivityData() {
  const [data, setData] = useState<ProductivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)

    // Fetch all records using pagination to bypass the 1000 row default limit
    let allEntries: ProductivityEntry[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: entries, error } = await supabaseSignAnalytics
        .from("sign_production")
        .select("*")
        .order("date", { ascending: false })
        .range(from, from + batchSize - 1)

      if (error) {
        console.error("Error fetching data:", error)
        break
      }

      if (entries && entries.length > 0) {
        allEntries = [...allEntries, ...entries]
        from += batchSize
        hasMore = entries.length === batchSize
      } else {
        hasMore = false
      }
    }

    setData(allEntries)
    setIsLoading(false)
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

    const { error } = await supabaseSignAnalytics.from("sign_production").insert([entryToInsert])

    if (error) {
      console.error("[v0] Error adding entry:", error)
      throw error
    }

    console.log("[v0] addEntry - Successfully inserted")
    await fetchData()
  }

  const importCsv = async (entries: ProductivityEntry[]) => {
    const { error } = await supabaseSignAnalytics.from("sign_production").insert(entries)
    if (error) {
      console.error("Error importing CSV:", error)
      throw error
    }

    await fetchData()
  }

  const getLastEntryDate = () => {
    if (data.length === 0) return null
    const dates = data.map((entry) => new Date(entry.date).getTime())
    return new Date(Math.max(...dates)).toISOString().split("T")[0]
  }

  return { data, addEntry, importCsv, getLastEntryDate, isLoading, refetch: fetchData }
}