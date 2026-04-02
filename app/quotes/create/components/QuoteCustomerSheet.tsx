"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Check, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CustomerForm } from "@/components/customer-form"

type QuoteCustomer = {
  id: number
  name: string
  display_name?: string | null
  customer_contacts?: QuoteContact[]
  email?: string
  main_phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  customer_number?: string | number
  payment_terms?: string
  web?: string
  bill_to_street?: string
  bill_to_city?: string
  bill_to_state?: string
  bill_to_zip?: string
  would_like_to_apply_for_credit?: boolean
}

type QuoteContact = {
  id: number
  name: string
  role?: string
  email?: string
  phone?: string
}

type SheetView =
  | "root"
  | "select-customer"
  | "add-customer"
  | "edit-customer"
  | "select-contact"
  | "add-contact"
  | "edit-contact"

interface QuoteCustomerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: QuoteCustomer[]
  selectedCustomer: QuoteCustomer | null
  selectedContact: QuoteContact | null
  loading: boolean
  onSelectCustomer: (customerId: string, contactId?: string) => void
  onSelectContact: (contactId: string) => void
  onCustomerUpsert: (customer: QuoteCustomer) => void
  refreshCustomers: () => Promise<QuoteCustomer[]>
}

const EMPTY_CONTACT_FORM = {
  name: "",
  role: "",
  email: "",
  phone: "",
}

export function QuoteCustomerSheet({
  open,
  onOpenChange,
  customers,
  selectedCustomer,
  selectedContact,
  loading,
  onSelectCustomer,
  onSelectContact,
  onCustomerUpsert,
  refreshCustomers,
}: QuoteCustomerSheetProps) {
  const [view, setView] = useState<SheetView>("root")
  const [customerSearch, setCustomerSearch] = useState("")
  const [contactSearch, setContactSearch] = useState("")
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT_FORM)
  const [savingContact, setSavingContact] = useState(false)
  const [editCustomerData, setEditCustomerData] = useState<QuoteCustomer | null>(null)

  useEffect(() => {
    if (!open) {
      setView("root")
      setCustomerSearch("")
      setContactSearch("")
      setContactForm(EMPTY_CONTACT_FORM)
      setEditCustomerData(null)
    }
  }, [open])

  useEffect(() => {
    if (view === "edit-contact" && selectedContact) {
      setContactForm({
        name: selectedContact.name || "",
        role: selectedContact.role || "",
        email: selectedContact.email || "",
        phone: selectedContact.phone || "",
      })
      return
    }

    if (view === "add-contact") {
      setContactForm(EMPTY_CONTACT_FORM)
    }
  }, [selectedContact, view])

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase()
    if (!query) return customers

    return customers.filter(customer =>
      (customer.name || "").toLowerCase().includes(query) ||
      (customer.display_name || "").toLowerCase().includes(query)
    )
  }, [customerSearch, customers])

  const filteredContacts = useMemo(() => {
    const contacts = selectedCustomer?.customer_contacts || []
    const query = contactSearch.trim().toLowerCase()
    if (!query) return contacts

    return contacts.filter(contact =>
      (contact.name || "").toLowerCase().includes(query) ||
      (contact.email || "").toLowerCase().includes(query) ||
      (contact.role || "").toLowerCase().includes(query)
    )
  }, [contactSearch, selectedCustomer])

  const loadEditableCustomer = async () => {
    if (!selectedCustomer?.id) return

    try {
      const response = await fetch(`/api/contractors/${selectedCustomer.id}`)
      const result = await response.json()

      if (!response.ok || !result?.customer) {
        throw new Error(result?.error || "Failed to load customer")
      }

      setEditCustomerData(result.customer)
      setView("edit-customer")
    } catch (error) {
      console.error("Failed to load customer for edit:", error)
      toast.error("Failed to load customer")
    }
  }

  const refreshAndReselectCustomer = async (
    customerId: number,
    nextContactId?: number | null
  ) => {
    const refreshedCustomers = await refreshCustomers()
    const refreshedCustomer =
      refreshedCustomers.find(customer => customer.id === customerId) || null

    if (refreshedCustomer) {
      onCustomerUpsert(refreshedCustomer)
      onSelectCustomer(
        refreshedCustomer.id.toString(),
        nextContactId ? nextContactId.toString() : undefined
      )
    }
  }

  const handleContactSave = async () => {
    if (!selectedCustomer?.id || !contactForm.name.trim()) {
      toast.error("Contact name is required")
      return
    }

    setSavingContact(true)

    try {
      const isEdit = view === "edit-contact" && selectedContact?.id
      const endpoint = isEdit
        ? `/api/customer-contacts/${selectedContact.id}`
        : "/api/customer-contacts"
      const method = isEdit ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractor_id: selectedCustomer.id,
          name: contactForm.name.trim(),
          role: contactForm.role.trim() || null,
          email: contactForm.email.trim() || null,
          phone: contactForm.phone.trim() || null,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || (!isEdit && !result?.success)) {
        throw new Error(result?.error || "Failed to save contact")
      }

      const savedContactId = isEdit ? selectedContact?.id || null : result?.data?.id || null
      await refreshAndReselectCustomer(selectedCustomer.id, savedContactId)
      setView("root")
      toast.success(isEdit ? "Contact updated" : "Contact created")
    } catch (error) {
      console.error("Failed to save contact:", error)
      toast.error("Failed to save contact")
    } finally {
      setSavingContact(false)
    }
  }

  const getTitle = () => {
    switch (view) {
      case "select-customer":
        return "Select Customer"
      case "add-customer":
        return "Add Customer"
      case "edit-customer":
        return "Edit Customer"
      case "select-contact":
        return "Select Contact"
      case "add-contact":
        return "Add Contact"
      case "edit-contact":
        return "Edit Contact"
      default:
        return "Customer & Contact"
    }
  }

  const renderHeader = () => (
    <SheetHeader className="border-b px-6 py-4">
      <div className="flex items-center gap-3">
        {view !== "root" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("root")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <SheetTitle className="text-xl">{getTitle()}</SheetTitle>
      </div>
    </SheetHeader>
  )

  const renderRoot = () => (
    <div className="space-y-6 px-6 py-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
        <p className="mt-2 text-base font-semibold">{selectedCustomer?.name || "No customer selected"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedCustomer
            ? [selectedCustomer.address, selectedCustomer.city, selectedCustomer.state, selectedCustomer.zip]
                .filter(Boolean)
                .join(", ")
            : "Select or create a customer for this quote."}
        </p>
      </div>

      <div className="grid gap-3">
        <Button type="button" variant="outline" className="justify-between" onClick={() => setView("select-customer")}>
          Select Customer
          <Check className={cn("h-4 w-4", selectedCustomer ? "opacity-100" : "opacity-0")} />
        </Button>
        <Button type="button" variant="outline" className="justify-between" onClick={() => setView("add-customer")}>
          Add Customer
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="justify-between"
          onClick={() => void loadEditableCustomer()}
          disabled={!selectedCustomer}
        >
          Edit Customer
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
        <p className="mt-2 text-base font-semibold">{selectedContact?.name || "No contact selected"}</p>
        <div className="mt-1 space-y-1 text-sm text-muted-foreground">
          <p>{selectedContact?.role || "Select or create a contact for this quote."}</p>
          {selectedContact?.email && <p>{selectedContact.email}</p>}
          {selectedContact?.phone && <p>{selectedContact.phone}</p>}
        </div>
      </div>

      <div className="grid gap-3">
        <Button
          type="button"
          variant="outline"
          className="justify-between"
          onClick={() => setView("select-contact")}
          disabled={!selectedCustomer}
        >
          Select Contact
          <Check className={cn("h-4 w-4", selectedContact ? "opacity-100" : "opacity-0")} />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="justify-between"
          onClick={() => setView("add-contact")}
          disabled={!selectedCustomer}
        >
          Add Contact
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="justify-between"
          onClick={() => setView("edit-contact")}
          disabled={!selectedContact}
        >
          Edit Contact
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderCustomerList = () => (
    <div className="px-6 py-4">
      <Command className="rounded-lg border">
        <CommandInput
          value={customerSearch}
          placeholder="Search customers..."
          onValueChange={setCustomerSearch}
        />
        <CommandList>
          <CommandEmpty>No customers found.</CommandEmpty>
          <CommandGroup>
            {filteredCustomers.map(customer => (
              <CommandItem
                key={customer.id}
                value={`${customer.name} ${customer.display_name || ""}`}
                onSelect={() => {
                  onSelectCustomer(customer.id.toString())
                  setView("root")
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0")} />
                <div className="flex flex-col">
                  <span>{customer.name}</span>
                  {customer.display_name && customer.display_name !== customer.name && (
                    <span className="text-xs text-muted-foreground">{customer.display_name}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )

  const renderContactList = () => (
    <div className="px-6 py-4">
      <Command className="rounded-lg border">
        <CommandInput
          value={contactSearch}
          placeholder="Search contacts..."
          onValueChange={setContactSearch}
        />
        <CommandList>
          <CommandEmpty>No contacts found.</CommandEmpty>
          <CommandGroup>
            {filteredContacts.map(contact => (
              <CommandItem
                key={contact.id}
                value={`${contact.name} ${contact.email || ""} ${contact.role || ""}`}
                onSelect={() => {
                  onSelectContact(contact.id.toString())
                  setView("root")
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", selectedContact?.id === contact.id ? "opacity-100" : "opacity-0")} />
                <div className="flex flex-col">
                  <span>{contact.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[contact.role, contact.email].filter(Boolean).join(" • ") || "No details"}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )

  const renderContactForm = () => (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            value={contactForm.name}
            onChange={(event) => setContactForm(current => ({ ...current, name: event.target.value }))}
            placeholder="Enter contact name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-role">Role</Label>
          <Input
            id="contact-role"
            value={contactForm.role}
            onChange={(event) => setContactForm(current => ({ ...current, role: event.target.value }))}
            placeholder="Enter contact role"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={contactForm.email}
            onChange={(event) => setContactForm(current => ({ ...current, email: event.target.value }))}
            placeholder="Enter email address"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            value={contactForm.phone}
            onChange={(event) => setContactForm(current => ({ ...current, phone: event.target.value }))}
            placeholder="Enter phone number"
          />
        </div>
        {selectedCustomer && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
            <p className="mt-2 font-medium">{selectedCustomer.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {[selectedCustomer.address, selectedCustomer.city, selectedCustomer.state, selectedCustomer.zip]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="border-t px-6 py-4">
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setView("root")} disabled={savingContact}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleContactSave()} disabled={savingContact}>
            {savingContact ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-[560px] flex-col p-0 sm:max-w-[560px]">
        {renderHeader()}

        <div className="min-h-0 flex-1 overflow-hidden">
          {view === "root" && renderRoot()}
          {view === "select-customer" && renderCustomerList()}
          {view === "select-contact" && renderContactList()}
          {(view === "add-contact" || view === "edit-contact") && renderContactForm()}
          {view === "add-customer" && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <CustomerForm
                onCancel={() => setView("root")}
                onSuccess={async (customer) => {
                  if (!customer?.id) {
                    setView("root")
                    return
                  }

                  await refreshAndReselectCustomer(customer.id)
                  setView("root")
                }}
              />
            </div>
          )}
          {view === "edit-customer" && editCustomerData && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <CustomerForm
                mode="edit"
                customerId={editCustomerData.id}
                initialData={editCustomerData}
                onCancel={() => setView("root")}
                onSuccess={async (customer) => {
                  const targetCustomerId = customer?.id || editCustomerData.id
                  await refreshAndReselectCustomer(targetCustomerId, selectedContact?.id || null)
                  setView("root")
                }}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
