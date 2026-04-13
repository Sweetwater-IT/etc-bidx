"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface OwnerOption {
  id: string | number
  name: string
}

interface OwnerSelectorProps {
  owners: OwnerOption[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function OwnerSelector({
  owners,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select owner...",
  className,
}: OwnerSelectorProps) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {owners.map(owner => (
          <SelectItem key={owner.id} value={owner.name}>
            {owner.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
