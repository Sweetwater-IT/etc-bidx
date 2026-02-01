"use client"

import * as React from "react"
import { Customer } from "@/types/Customer"
import { Combobox, ComboboxItem } from "@/components/ui/combobox"
import { useCustomers } from "@/hooks/use-customers"

interface ChooseCustomerComponentProps {
  value?: Customer | null
  onValueChange: (customer: Customer | null) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  showAddNew?: boolean
  onAddNew?: () => void
}

export function ChooseCustomerComponent({
  value,
  onValueChange,
  placeholder = "Select customer...",
  disabled = false,
  required = false,
  showAddNew = true,
  onAddNew,
}: ChooseCustomerComponentProps) {
  const { customers, getCustomers, isLoading } = useCustomers()

  // Fetch customers on mount
  React.useEffect(() => {
    getCustomers()
  }, [getCustomers])

  // Convert customers to combobox items
  const customerItems: ComboboxItem[] = React.useMemo(() => {
    const items = customers.map(customer => ({
      value: customer.id.toString(),
      label: customer.displayName,
      customer: customer, // Store the full customer object
    }))

    // Add "Add new customer" option if enabled
    if (showAddNew) {
      items.unshift({
        value: "__add_new__",
        label: "+ Add new customer",
        customer: null,
      })
    }

    return items
  }, [customers, showAddNew])

  const handleValueChange = (selectedValue: string) => {
    if (!selectedValue) {
      onValueChange(null)
      return
    }

    if (selectedValue === "__add_new__") {
      onAddNew?.()
      return
    }

    const selectedItem = customerItems.find(item => item.value === selectedValue)
    if (selectedItem && selectedItem.customer) {
      onValueChange(selectedItem.customer)
    }
  }

  const currentValue = value ? value.id.toString() : ""

  return (
    <Combobox
      items={customerItems}
      value={currentValue}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search customers..."
      emptyMessage="No customers found."
      disabled={disabled || isLoading}
    />
  )
}