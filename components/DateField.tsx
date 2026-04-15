"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { restorePointerEvents } from "@/lib/pointer-events-fix"

interface DateFieldProps {
  id?: string
  value?: Date | string | null
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

function parseDateValue(value?: Date | string | null) {
  if (!value) {
    return undefined
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }

  const normalized = value.includes("T") ? value.split("T")[0] : value
  const [year, month, day] = normalized.split("-").map(Number)
  const parsed = new Date(year, month - 1, day)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function formatDateValue(value?: Date | string | null) {
  const parsed = parseDateValue(value)
  if (!parsed) {
    return ""
  }

  return format(parsed, "dd-MM-yyyy")
}

export function DateField({
  id,
  value,
  onChange,
  className,
  placeholder = "Select date",
}: DateFieldProps) {
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
          {displayValue || placeholder}
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
