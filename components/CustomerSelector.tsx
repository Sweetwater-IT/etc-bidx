"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Customer } from "@/types/Customer"
import { cn } from "@/lib/utils"
import { CustomerModal } from "@/components/CustomerModal"

interface CustomerSelectorProps {
  customers: Customer[]
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void | Promise<void>
  onCustomerCreated?: (customer: {
    id: number
    name?: string | null
    display_name?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    zip?: string | null
    main_phone?: string | null
  }) => void | Promise<void>
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  createLabel?: string
  createDescription?: string
  className?: string
}

export function CustomerSelector({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onCustomerCreated,
  disabled = false,
  placeholder = "Select customer...",
  searchPlaceholder = "Search customer...",
  emptyMessage = "No customer found.",
  createLabel = "Add new customer",
  createDescription,
  className,
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const filteredCustomers = useMemo(
    () => [...customers].sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name)),
    [customers]
  )

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("w-full justify-between bg-muted/50 font-normal", className)}
          >
            <span className="truncate text-left">
              {selectedCustomer?.displayName || selectedCustomer?.name || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup className="max-h-[240px] overflow-y-auto">
                {onCustomerCreated && (
                  <CommandItem
                    value="__add_new_customer__"
                    className="font-medium text-primary"
                    onSelect={() => {
                      setOpen(false)
                      setCreateOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createLabel}
                  </CommandItem>
                )}

                {filteredCustomers.map(customer => (
                  <CommandItem
                    key={customer.id}
                    value={`${customer.displayName} ${customer.name} ${customer.mainPhone || ""}`.trim()}
                    onSelect={async () => {
                      await onSelectCustomer(customer)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{customer.displayName || customer.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {onCustomerCreated && (
        <CustomerModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          description={createDescription}
          onSuccess={async customer => {
            if (customer) {
              await onCustomerCreated(customer)
            }
          }}
        />
      )}
    </>
  )
}
