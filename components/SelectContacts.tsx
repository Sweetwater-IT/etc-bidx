import { ContactSelector as SharedContactSelector } from "@/components/ContactSelector"
import { Customer } from "@/types/Customer"

interface IContact {
  id: number
  name: string
  email: string
  phone: string
  role: string
}

interface ContactSelectorProps {
  localCustomer: Customer | null
  localContact: IContact | null
  setLocalCustomer: (customer: Customer) => void
  setLocalContact: (contact: IContact | null) => void
  contactModalOpen?: boolean
  setContactModalOpen?: (open: boolean) => void
}

export function ContactSelector({
  localCustomer,
  localContact,
  setLocalCustomer,
  setLocalContact,
}: ContactSelectorProps) {
  return (
    <SharedContactSelector
      customer={localCustomer}
      selectedContact={localContact}
      onSelectContact={setLocalContact}
      onCustomerChange={setLocalCustomer}
    />
  )
}
