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
import { ArrowLeft, Check } from "lucide-react"
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
  | "select-customer"
  | "add-customer"
  | "select-contact"
  | "add-contact"

interface QuoteCustomerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialView: SheetView
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
  initialView,
  customers,
  selectedCustomer,
  selectedContact,
  loading,
  onSelectCustomer,
  onSelectContact,
  onCustomerUpsert,
  refreshCustomers,
}: QuoteCustomerSheetProps) {
  const [view, setView] = useState<SheetView>(initialView)
  const [customerSearch, setCustomerSearch] = useState("")
  const [contactSearch, setContactSearch] = useState("")
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT_FORM)
  const [savingContact, setSavingContact] = useState(false)

  useEffect(() => {
    if (open) {
      setView(initialView)
      setCustomerSearch("")
      setContactSearch("")
      return
    }

    setContactForm(EMPTY_CONTACT_FORM)
  }, [initialView, open])

  useEffect(() => {
    if (view === "add-contact") {
      setContactForm(EMPTY_CONTACT_FORM)
    }
  }, [view])

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
      const response = await fetch("/api/customer-contacts", {
        method: "POST",
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

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to save contact")
      }

      const savedContactId = result?.data?.id || null
      await refreshAndReselectCustomer(selectedCustomer.id, savedContactId)
      setView("select-contact")
      toast.success("Contact created")
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
      case "select-contact":
        return "Select Contact"
      case "add-contact":
        return "Add Contact"
    }
  }

  const renderHeader = () => (
    <SheetHeader className="border-b px-6 py-4">
      <div className="flex items-center gap-3">
        {view !== "select-customer" && view !== "select-contact" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setView(view === "add-contact" ? "select-contact" : "select-customer")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <SheetTitle className="text-xl">{getTitle()}</SheetTitle>
      </div>
    </SheetHeader>
  )

  const renderCustomerList = () => (
    <>
      <div className="px-6 py-4 space-y-4 border-b">
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setView("add-customer")}
          >
            Add New Customer
          </Button>
        </div>

        <div className="relative">
          <Input
            autoFocus
            placeholder="Search customers by name..."
            value={customerSearch}
            onChange={event => setCustomerSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-sm">Name</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-sm text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            ) : (
              filteredCustomers.map(customer => (
                <tr
                  key={customer.id}
                  className="cursor-pointer border-b transition-colors hover:bg-muted/40"
                  onClick={() => {
                    onSelectCustomer(customer.id.toString())
                    onOpenChange(false)
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Check className={cn("h-4 w-4", selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0")} />
                      <span>{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(", ") || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )

  const renderContactList = () => (
    <>
      <div className="px-6 py-4 space-y-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setView("select-customer")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setView("add-contact")}
          >
            Add New Contact
          </Button>
        </div>

        <div className="relative">
          <Input
            autoFocus
            placeholder="Search contacts by name or email..."
            value={contactSearch}
            onChange={event => setContactSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-sm">Name</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Email</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-sm text-muted-foreground">
                  No contacts found.
                </td>
              </tr>
            ) : (
              filteredContacts.map(contact => (
                <tr
                  key={contact.id}
                  className="cursor-pointer border-b transition-colors hover:bg-muted/40"
                  onClick={() => {
                    onSelectContact(contact.id.toString())
                    onOpenChange(false)
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Check className={cn("h-4 w-4", selectedContact?.id === contact.id ? "opacity-100" : "opacity-0")} />
                      <span>{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {contact.email || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
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
          <Button type="button" variant="outline" onClick={() => setView("select-contact")} disabled={savingContact}>
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
          {view === "select-customer" && renderCustomerList()}
          {view === "select-contact" && renderContactList()}
          {view === "add-contact" && renderContactForm()}
          {view === "add-customer" && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <CustomerForm
                onCancel={() => setView("select-customer")}
                onSuccess={async (customer) => {
                  if (!customer?.id) {
                    setView("select-customer")
                    return
                  }

                  await refreshAndReselectCustomer(customer.id)
                  setView("select-contact")
                }}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
