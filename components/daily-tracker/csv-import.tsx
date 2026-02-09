"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ProductivityEntry } from "@/types/daily-tracker/productivity"

interface CsvImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: ProductivityEntry[]) => void
}

export function CsvImport({ open, onOpenChange, onImport }: CsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setError(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split("\n")
      const entries: ProductivityEntry[] = []

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [date, employee, dimension_l, dimension_w, sqft, type, quantity, total_sqft] = line.split(",")

        // Skip rows with missing critical data
        if (!date || !employee || !dimension_l || !dimension_w || !sqft || !type || !quantity || !total_sqft) {
          console.warn(`Skipping row ${i + 1}: missing required fields`)
          continue
        }

        const parsedQuantity = Number.parseInt(quantity.trim())
        const parsedDimensionL = Number.parseFloat(dimension_l.trim())
        const parsedDimensionW = Number.parseFloat(dimension_w.trim())
        const parsedSqft = Number.parseFloat(sqft.trim())
        const parsedTotalSqft = Number.parseFloat(total_sqft.trim())

        // Validate that all numeric fields are valid numbers
        if (
          Number.isNaN(parsedQuantity) ||
          Number.isNaN(parsedDimensionL) ||
          Number.isNaN(parsedDimensionW) ||
          Number.isNaN(parsedSqft) ||
          Number.isNaN(parsedTotalSqft)
        ) {
          console.warn(`Skipping row ${i + 1}: invalid numeric values`)
          continue
        }

        entries.push({
          date: date.trim(),
          employee: employee.trim().toLowerCase(),
          dimension_l: parsedDimensionL,
          dimension_w: parsedDimensionW,
          sqft: parsedSqft,
          type: type.trim().toLowerCase() as "sale" | "mpt",
          quantity: parsedQuantity,
          total_sqft: parsedTotalSqft,
        })
      }

      if (entries.length === 0) {
        setError("No valid entries found in CSV file")
        setIsImporting(false)
        return
      }

      try {
        await onImport(entries)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        onOpenChange(false)
      } catch (error) {
        console.error("Error importing CSV:", error)
        setError(error instanceof Error ? error.message : "Failed to import CSV")
      } finally {
        setIsImporting(false)
      }
    }

    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import CSV Data</DialogTitle>
          <DialogDescription>
            Upload your sign production CSV file with the following columns: date, employee, dimension_l, dimension_w,
            sqft, type, quantity, total sqft
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? "Importing..." : "Choose File"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}