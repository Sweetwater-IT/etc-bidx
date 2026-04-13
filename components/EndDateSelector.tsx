"use client"

import { Input } from "@/components/ui/input"

interface EndDateSelectorProps {
  id?: string
  value?: Date | string | null
  onChange: (value: string) => void
  className?: string
  min?: Date | string | null
  max?: Date | string | null
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

export function EndDateSelector({
  id,
  value,
  onChange,
  className,
  min,
  max,
}: EndDateSelectorProps) {
  return (
    <Input
      id={id}
      type="date"
      value={formatDateValue(value)}
      min={formatDateValue(min)}
      max={formatDateValue(max)}
      onChange={event => onChange(event.target.value)}
      className={className}
    />
  )
}
