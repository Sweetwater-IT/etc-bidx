"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  value: { from: Date; to: Date }
  onChange: (range: { from: Date; to: Date }) => void
  preset?: string
  onPresetChange?: (preset: string) => void
}

export function DateRangePicker({ value, onChange, preset, onPresetChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalPreset, setInternalPreset] = useState<string>("Year to Date")

  const selectedPreset = preset !== undefined ? preset : internalPreset
  const setSelectedPreset = (p: string) => {
    if (onPresetChange) {
      onPresetChange(p)
    } else {
      setInternalPreset(p)
    }
  }

  const presets = [
    { label: "Today", days: 0 },
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
    { label: "Year to Date", days: -1 },
    { label: "2025", days: -3 },
    { label: "All Time", days: -2 },
  ]

  const handlePreset = (days: number, label: string) => {
    try {
      const to = new Date()
      let from: Date

      if (days === 0) {
        from = new Date(to)
      } else if (days === -1) {
        from = new Date(to.getFullYear(), 0, 1)
      } else if (days === -2) {
        from = new Date(2020, 0, 1)
      } else if (days === -3) {
        // 2025 - full year (Jan 1 to Dec 31)
        from = new Date(2025, 0, 1)
        const end2025 = new Date(2025, 11, 31)
        // If we're past 2025, use Dec 31, 2025 as the end date
        if (to > end2025) {
          // from: Jan 1, 2025, to: Dec 31, 2025
          setSelectedPreset(label)
          onChange({ from, to: end2025 })
          setIsOpen(false)
          return
        }
      } else {
        from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
      }

      setSelectedPreset(label)
      onChange({ from, to })
      setIsOpen(false)
    } catch (error) {
      console.error("[v0] Error in handlePreset:", error)
    }
  }

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      setSelectedPreset("")
      onChange({
        from: range.from,
        to: range.to || range.from,
      })
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start text-left font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedPreset ? (
            selectedPreset
          ) : value?.from ? (
            value.to ? (
              <>
                {value.from.toLocaleDateString()} - {value.to.toLocaleDateString()}
              </>
            ) : (
              value.from.toLocaleDateString()
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r p-3 flex flex-col gap-2 min-w-[140px]">
            <p className="text-sm font-semibold mb-1">Quick Select</p>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                onClick={() => handlePreset(preset.days, preset.label)}
                className="justify-start text-sm h-8"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="p-3">
            <p className="text-sm font-medium mb-2 text-center">Select Date Range</p>
            <p className="text-xs text-muted-foreground mb-3 text-center">Click start date, then end date</p>
            <Calendar
              mode="range"
              selected={{ from: value.from, to: value.to }}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              initialFocus
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}