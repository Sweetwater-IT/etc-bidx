"use client"

import * as React from "react"
import { Customer } from "@/types/Customer"
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"

interface ChooseCustomerProps {
  customers: Customer[]
  value?: Customer | null
  onChange: (customer: Customer | null) => void
  onAddNew?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ChooseCustomer({
  customers,
  value,
  onChange,
  onAddNew,
  placeholder = "Select contractor...",
  disabled = false,
  className,
}: ChooseCustomerProps) {
  const options = customers.map((customer) => ({
    value: customer.id.toString(),
    label: customer.displayName,
    customer,
  }))

  // Add "Add new customer" option if onAddNew is provided
  const allOptions = onAddNew
    ? [
        {
          value: "__add_new__",
          label: "+ Add new customer",
          customer: null as any,
        },
        ...options,
      ]
    : options

  const handleValueChange = (selectedValue: string) => {
    if (!selectedValue) {
      onChange(null)
      return
    }

    if (selectedValue === "__add_new__") {
      onAddNew?.()
      return
    }

    const selectedOption = options.find((option) => option.value === selectedValue)
    onChange(selectedOption?.customer || null)
  }

  const renderTrigger = ({ children }: { children: React.ReactNode }) => {
    // Custom trigger to handle truncation
    return (
      <div className="relative w-full">
        {children}
      </div>
    )
  }

  return (
    <Combobox
      options={allOptions}
      value={value?.id.toString()}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search contractor..."
      emptyMessage="No contractor found."
      disabled={disabled}
      className={className}
      renderTrigger={renderTrigger}
    />
  )
}