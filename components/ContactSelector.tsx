"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, Pencil, Plus } from "lucide-react"

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
import { CustomerContactModal } from "@/components/CustomerContactModal"

export interface ContactOption {
  id: number
  name: string
  email: string
  phone: string
  role: string
}

interface ContactSelectorProps {
  customer: Customer | null
  selectedContact: ContactOption | null
  onSelectContact: (contact: ContactOption | null) => void | Promise<void>
  onCustomerChange?: (customer: Customer) => void | Promise<void>
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  showEditButton?: boolean
}

function toCustomerContact(customer: Customer | null) {
  if (!customer) {
    return null
  }

  return {
    name: customer.name,
    displayName: customer.displayName,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
    paymentTerms: customer.paymentTerms,
    url: customer.url,
  }
}

function getContacts(customer: Customer | null): ContactOption[] {
  if (!customer) {
    return []
  }

  return (customer.contactIds || [])
    .map((id, index) => ({
      id,
      name: customer.names?.[index] || "",
      email: customer.emails?.[index] || "",
      phone: customer.phones?.[index] || "",
      role: customer.roles?.[index] || "",
    }))
    .filter(
      contact =>
        Boolean(contact.id) ||
        Boolean(contact.name) ||
        Boolean(contact.email) ||
        Boolean(contact.phone)
    )
}

function upsertContact(customer: Customer, contact: ContactOption): Customer {
  const existingIndex = (customer.contactIds || []).findIndex(id => id === contact.id)

  if (existingIndex === -1) {
    return {
      ...customer,
      contactIds: [...(customer.contactIds || []), contact.id],
      names: [...(customer.names || []), contact.name],
      emails: [...(customer.emails || []), contact.email],
      phones: [...(customer.phones || []), contact.phone],
      roles: [...(customer.roles || []), contact.role],
    }
  }

  return {
    ...customer,
    names: (customer.names || []).map((value, index) =>
      index === existingIndex ? contact.name : value
    ),
    emails: (customer.emails || []).map((value, index) =>
      index === existingIndex ? contact.email : value
    ),
    phones: (customer.phones || []).map((value, index) =>
      index === existingIndex ? contact.phone : value
    ),
    roles: (customer.roles || []).map((value, index) =>
      index === existingIndex ? contact.role : value
    ),
  }
}

export function ContactSelector({
  customer,
  selectedContact,
  onSelectContact,
  onCustomerChange,
  disabled = false,
  placeholder,
  searchPlaceholder = "Search contact...",
  emptyMessage = "No contact found.",
  showEditButton = false,
}: ContactSelectorProps) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const contacts = useMemo(() => getContacts(customer), [customer])

  const handleSavedContact = async (contactId?: number, contactData?: any) => {
    if (!customer || typeof contactId !== "number" || !contactData) {
      return
    }

    const savedContact: ContactOption = {
      id: contactId,
      name: contactData.name || "",
      email: contactData.email || "",
      phone: contactData.phone || "",
      role: contactData.role || "",
    }

    const nextCustomer = upsertContact(customer, savedContact)
    await onCustomerChange?.(nextCustomer)
    await onSelectContact(savedContact)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || !customer}
            className="w-full justify-between bg-muted/50 font-normal"
          >
            <span className="truncate text-left">
              {selectedContact?.name ||
                placeholder ||
                (customer ? "Select contact..." : "Select customer first")}
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
                {customer && (
                  <CommandItem
                    value="__add_new_contact__"
                    className="font-medium text-primary"
                    onSelect={() => {
                      setOpen(false)
                      setCreateOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new contact
                  </CommandItem>
                )}

                {contacts.map(contact => (
                  <CommandItem
                    key={contact.id}
                    value={`${contact.name} ${contact.email} ${contact.phone} ${contact.role}`.trim()}
                    onSelect={async () => {
                      await onSelectContact(contact)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedContact?.id === contact.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">
                      {contact.name || contact.email || `Contact #${contact.id}`}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showEditButton && selectedContact && customer && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Edit Contact
        </Button>
      )}

      {customer && (
        <>
          <CustomerContactModal
            customerId={customer.id}
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
            onSuccess={async (contactId, contactData) => {
              setCreateOpen(false)
              await handleSavedContact(contactId, contactData)
            }}
            customer={toCustomerContact(customer)!}
          />

          <CustomerContactModal
            customerId={customer.id}
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            onSuccess={async (contactId, contactData) => {
              setEditOpen(false)
              await handleSavedContact(contactId, contactData)
            }}
            contactToEdit={selectedContact}
            customer={toCustomerContact(customer)!}
          />
        </>
      )}
    </div>
  )
}
