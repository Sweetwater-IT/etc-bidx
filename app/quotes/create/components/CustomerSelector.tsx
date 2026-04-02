import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCustomerSelection } from '@/hooks/use-csutomers-selection'
import { useQuoteForm } from '@/app/quotes/create/QuoteFormProvider'
import { ChevronRight, Pencil, Users } from 'lucide-react'
import type { Customer as QuoteCustomer } from '@/types/Customer'
import { QuoteCustomerSheet } from './QuoteCustomerSheet'

const CustomerSelect = ({
  data,
  setData,
  direction = 'row',
  columnCustomerTitle,
  columnContactTitle,
}: {
  data: any
  setData: React.Dispatch<any>
  direction?: 'row' | 'column'
  columnCustomerTitle?: string
  columnContactTitle?: string
}) => {
  const { setSelectedCustomers, setPointOfContact } = useQuoteForm()
  const {
    customers,
    selectedCustomer,
    selectedContact,
    selectCustomer,
    selectContact,
    refreshCustomers,
    loading,
    upsertCustomer,
  } = useCustomerSelection()
  const [sheetOpen, setSheetOpen] = useState(false)

  const toQuoteCustomer = (customer: any): QuoteCustomer => ({
    id: customer.id,
    name: customer.name || customer.display_name || '',
    displayName: customer.display_name || customer.displayName || customer.name || '',
    emails: Array.isArray(customer.customer_contacts)
      ? customer.customer_contacts.map((contact: any) => contact.email || '')
      : [],
    address: customer.address || '',
    phones: Array.isArray(customer.customer_contacts)
      ? customer.customer_contacts.map((contact: any) => contact.phone || '')
      : [],
    roles: Array.isArray(customer.customer_contacts)
      ? customer.customer_contacts.map((contact: any) => contact.role || '')
      : [],
    names: Array.isArray(customer.customer_contacts)
      ? customer.customer_contacts.map((contact: any) => contact.name || '')
      : [],
    contactIds: Array.isArray(customer.customer_contacts)
      ? customer.customer_contacts.map((contact: any) => contact.id || 0)
      : [],
    url: customer.web || customer.url || '',
    created: customer.created || '',
    updated: customer.updated || '',
    city: customer.city || '',
    state: customer.state || '',
    zip: customer.zip || '',
    customerNumber: customer.customer_number || customer.customerNumber || 0,
    mainPhone: customer.main_phone || customer.mainPhone || '',
    paymentTerms: customer.payment_terms || customer.paymentTerms || '',
    lastOrdered: customer.lastOrdered || null,
  })

  useEffect(() => {
    if (!data.customer || customers.length === 0) return

    const customer = customers.find(c => c.id.toString() === data.customer.toString())
    if (!customer) return

    const contact =
      data.customer_contact && customer.customer_contacts?.length
        ? customer.customer_contacts.find(c => c.name === data.customer_contact) || null
        : null

    selectCustomer(customer.id.toString(), contact?.id?.toString())
  }, [customers, data.customer, data.customer_contact, selectCustomer])

  useEffect(() => {
    if (!selectedCustomer) return

    const nextAddress = [selectedCustomer.address || '', selectedCustomer.city || '', selectedCustomer.state || '', selectedCustomer.zip || '']
      .filter(Boolean)
      .join(', ')

    const newData = {
      ...data,
      customer: selectedCustomer.id || '',
      customer_name: selectedCustomer.name || '',
      customer_email: selectedContact?.email || data.customer_email || '',
      customer_phone: selectedContact?.phone || data.customer_phone || '',
      customer_address: nextAddress,
      customer_contact: selectedContact?.name || data.customer_contact || '',
    }

    const hasChanged = Object.keys(newData).some(key => newData[key] !== data[key])

    if (hasChanged) {
      setData(newData)
    }
  }, [data, selectedCustomer, selectedContact, setData])

  useEffect(() => {
    if (!selectedCustomer) {
      if (data.customer) {
        return
      }

      setSelectedCustomers([])
      setPointOfContact(undefined)
      return
    }

    setSelectedCustomers([toQuoteCustomer(selectedCustomer)])

    if (selectedContact?.email) {
      setPointOfContact({
        id: selectedContact.id,
        name: selectedContact.name || '',
        email: selectedContact.email,
      })
      return
    }

    if (!data.customer_contact) {
      setPointOfContact(undefined)
    }
  }, [data.customer, data.customer_contact, selectedContact, selectedCustomer, setPointOfContact, setSelectedCustomers])

  const handleContactClick = (contactId: string) => {
    const contact = selectedCustomer?.customer_contacts?.find(c => c.id?.toString() === contactId)
    if (!contact) return

    selectContact(contact.id.toString())
    setPointOfContact({
      id: contact.id,
      name: contact.name || '',
      email: contact.email || '',
    })
    setData((prev: any) => ({
      ...prev,
      customer_contact: contact.name || '',
      customer_email: contact.email || '',
      customer_phone: contact.phone || '',
    }))
  }

  const customerSubtitle = useMemo(() => {
    if (!selectedCustomer) {
      return 'Select or edit a customer in one sheet'
    }

    return [selectedCustomer.address, selectedCustomer.city, selectedCustomer.state, selectedCustomer.zip]
      .filter(Boolean)
      .join(', ')
  }, [selectedCustomer])

  const contactSubtitle = useMemo(() => {
    if (!selectedContact) {
      return selectedCustomer ? 'Select or edit a contact in the same sheet' : 'Select a customer first'
    }

    return [selectedContact.role, selectedContact.email, selectedContact.phone]
      .filter(Boolean)
      .join(' • ')
  }, [selectedContact, selectedCustomer])

  return (
    <div className="w-full">
      <div className={`flex ${direction === 'row' ? 'flex-row' : 'flex-col'} justify-between gap-4 mb-4 flex-1`}>
        <div className={`${direction === 'row' ? 'w-1/2' : 'w-full mb-2'} flex flex-col`}>
          <label className="font-semibold block mb-1">{columnCustomerTitle || 'Customer Selection'}</label>
          <Button variant="outline" className="justify-between" onClick={() => setSheetOpen(true)}>
            <span className="truncate text-left">
              {loading ? 'Loading...' : selectedCustomer?.name || 'Select Customer'}
            </span>
            <Users className="ml-2 h-4 w-4 opacity-60" />
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">{customerSubtitle || 'No customer selected'}</p>
        </div>

        <div className={`${direction === 'row' ? 'w-1/2' : 'w-full mb-2'} flex flex-col`}>
          <label className="font-semibold block mb-1">{columnContactTitle || 'Contact Selection'}</label>
          <Button variant="outline" className="justify-between" disabled={!selectedCustomer || loading} onClick={() => setSheetOpen(true)}>
            <span className="truncate text-left">
              {loading
                ? 'Loading...'
                : selectedContact?.name || (selectedCustomer ? 'Please select contact' : 'Select Contact')}
            </span>
            <Pencil className="ml-2 h-4 w-4 opacity-60" />
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">{contactSubtitle}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" onClick={() => setSheetOpen(true)}>
          <ChevronRight className="h-3.5 w-3.5" />
          Manage Customer & Contact
        </Button>
      </div>

      <QuoteCustomerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        customers={customers}
        selectedCustomer={selectedCustomer}
        selectedContact={selectedContact}
        loading={loading}
        onSelectCustomer={selectCustomer}
        onSelectContact={handleContactClick}
        onCustomerUpsert={(customer) => upsertCustomer(customer as any)}
        refreshCustomers={refreshCustomers}
      />
    </div>
  )
}

export default CustomerSelect
