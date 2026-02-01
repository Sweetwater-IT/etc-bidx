"use client"

import * as React from "react"
import { User } from "@/types/User"
import { Combobox } from "@/components/ui/combobox"

interface ChooseRequestorProps {
  users: User[]
  value?: User | null
  onChange: (user: User | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ChooseRequestor({
  users,
  value,
  onChange,
  placeholder = "Select requestor...",
  disabled = false,
  className,
}: ChooseRequestorProps) {
  const options = users
    .filter((user) => user.id !== undefined)
    .map((user) => ({
      value: user.id!.toString(),
      label: user.name,
      user,
    }))

  const handleValueChange = (selectedValue: string) => {
    if (!selectedValue) {
      onChange(null)
      return
    }

    const selectedOption = options.find((option) => option.value === selectedValue)
    onChange(selectedOption?.user || null)
  }

  return (
    <Combobox
      options={options}
      value={value?.id?.toString()}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search requestor..."
      emptyMessage="No requestor found."
      disabled={disabled}
      className={className}
    />
  )
}
