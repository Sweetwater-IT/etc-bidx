"use client"

import { Input } from "@/components/ui/input"

interface DueDateSelectorProps {
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
    return value.includes("T") ? value.split("T")[0] : value
  }

  return value.toISOString().split("T")[0]
}

export function DueDateSelector({
  id,
  value,
  onChange,
  className,
}: DueDateSelectorProps) {
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
