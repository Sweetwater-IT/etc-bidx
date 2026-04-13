"use client"

import { useMemo, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { restorePointerEvents } from "@/lib/pointer-events-fix"
import { cn } from "@/lib/utils"

interface LettingDateSelectorProps {
  id?: string
  value?: Date | string | null
  onChange: (value: string) => void
  className?: string
}

function parseDateValue(value?: Date | string | null) {
  if (!value) {
    return undefined
  }

  if (value instanceof Date) {
    return value
  }

  const normalized = value.includes("T") ? value.split("T")[0] : value
  const parsed = new Date(`${normalized}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function formatDateValue(value?: Date | string | null) {
  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value
  }

  return value.toISOString().split("T")[0]
}

export function LettingDateSelector({
  id,
  value,
  onChange,
  className,
}: LettingDateSelectorProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(() => parseDateValue(value), [value])
  const displayValue = formatDateValue(value)

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        restorePointerEvents()
      }}
      modal={false}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between font-normal",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          {displayValue || "Select letting date"}
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[70] w-auto p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          restorePointerEvents()
        }}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "")
            setOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
