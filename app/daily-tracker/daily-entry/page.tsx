"use client"

import { useRouter } from "next/navigation"
import { DailyEntryForm } from "@/components/daily-tracker/daily-entry-form"
import { useProductivityData } from "@/hooks/daily-tracker/use-productivity-data"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"

export default function DailyEntryPage() {
  const router = useRouter()
  const { addEntry } = useProductivityData()

  const handleDailyEntries = async (entries: ProductivityEntry[]) => {
    for (const entry of entries) {
      await addEntry(entry)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/daily-tracker")}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-semibold">Add Daily Production Report</h1>
          <p className="text-muted-foreground mt-2">
            Enter all sign production for a specific date. Add multiple entries for different employees.
          </p>
        </div>

        <DailyEntryForm onSubmit={handleDailyEntries} onCancel={() => router.push("/daily-tracker")} />
      </div>
    </div>
  )
}