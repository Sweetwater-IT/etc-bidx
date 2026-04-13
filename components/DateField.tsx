"use client"

import { Input } from "@/components/ui/input"

interface DateFieldProps {
  id?: string
  value?: Date | string | null
  onChange: (value: string) => void
  className?: string
}

function formatDateValue(value?: Date | string | null) {
  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    if (value.includes("T")) {
      return value.split("T")[0]
    }

    return value
  }

  return value.toISOString().split("T")[0]
}

export function DateField({ id, value, onChange, className }: DateFieldProps) {
  return (
    <Input
      id={id}
      type="date"
      value={formatDateValue(value)}
      onChange={event => onChange(event.target.value)}
      className={className}
    />
  )
}
