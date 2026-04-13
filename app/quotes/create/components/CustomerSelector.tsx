import React, { useEffect, useState } from 'react'
import { useCustomerSelection } from '@/hooks/use-csutomers-selection'
import { useQuoteForm } from '@/app/quotes/create/QuoteFormProvider'
import type { Customer as QuoteCustomer } from '@/types/Customer'
import { CustomerSelector as SharedCustomerSelector } from '@/components/CustomerSelector'
import { ContactSelector as SharedContactSelector } from '@/components/ContactSelector'

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

  const buildCustomerAddress = (customer: any) =>
    [customer?.address || '', customer?.city || '', customer?.state || '', customer?.zip || '']
      .filter(Boolean)
      .join(', ')

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

  const toHookCustomer = (customer: QuoteCustomer) => ({
    id: customer.id,
    name: customer.name,
    display_name: customer.displayName,
    email: customer.emails?.[0] || '',
    main_phone: customer.mainPhone || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    zip: customer.zip || '',
    customer_contacts: (customer.contactIds || []).map((id, index) => ({
      id,
      name: customer.names?.[index] || '',
      email: customer.emails?.[index] || '',
      phone: customer.phones?.[index] || '',
      role: customer.roles?.[index] || '',
    })),
    customer_number: customer.customerNumber || 0,
    payment_terms: customer.paymentTerms || '',
    web: customer.url || '',
    lastOrdered: customer.lastOrdered || null,
  })

  const toSharedContact = (contact: typeof selectedContact) =>
    contact
      ? {
          id: contact.id,
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          role: contact.role || '',
        }
      : null

  useEffect(() => {
    if (!data.customer || customers.length === 0) return

    const customer = customers.find(c => c.id.toString() === data.customer.toString())
    if (!customer) return

    const contact =
      customer.customer_contacts?.length
        ? customer.customer_contacts.find(c =>
            c.id?.toString() === data.customer_contact_id?.toString()
          ) ||
          customer.customer_contacts.find(c => c.name === data.customer_contact) ||
          null
        : null

    selectCustomer(customer.id.toString(), contact?.id?.toString())
  }, [customers, data.customer, data.customer_contact, data.customer_contact_id, selectCustomer])

  useEffect(() => {
    setData((prev: any) => {
      if (!selectedCustomer) {
        if (
          prev.customer ||
          prev.customer_name ||
          prev.customer_contact ||
          prev.customer_email ||
          prev.customer_phone ||
          prev.customer_address
        ) {
          return prev
        }

        return prev
      }

      const customerChanged = prev.customer?.toString() !== selectedCustomer.id.toString()
      const nextData = {
        ...prev,
        customer: selectedCustomer.id || '',
        customer_name: selectedCustomer.name || '',
        customer_address: buildCustomerAddress(selectedCustomer),
        customer_contact_id: selectedContact?.id || (customerChanged ? '' : prev.customer_contact_id || ''),
        customer_contact: selectedContact?.name || (customerChanged ? '' : prev.customer_contact || ''),
        customer_email: selectedContact?.email || (customerChanged ? '' : prev.customer_email || ''),
        customer_phone: selectedContact?.phone || (customerChanged ? '' : prev.customer_phone || ''),
      }

      const hasChanged = Object.keys(nextData).some(key => nextData[key] !== prev[key])
      return hasChanged ? nextData : prev
    })
  }, [selectedCustomer, selectedContact, setData])

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

    if (selectedContact) {
      setPointOfContact({
        id: selectedContact.id,
        name: selectedContact.name || '',
        email: selectedContact.email || '',
      })
      return
    }

    setPointOfContact(undefined)
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
      customer_contact_id: contact.id || '',
      customer_contact: contact.name || '',
      customer_email: contact.email || '',
      customer_phone: contact.phone || '',
    }))
  }

  const handleCustomerClick = (customerId: string) => {
    const nextCustomer = customers.find(customer => customer.id.toString() === customerId) || null
    const isSameCustomer = selectedCustomer?.id?.toString() === customerId
    const preservedContactId = isSameCustomer ? selectedContact?.id?.toString() : undefined

    selectCustomer(customerId, preservedContactId)

    if (!nextCustomer) {
      return
    }

    if (isSameCustomer) {
      setSelectedCustomers([toQuoteCustomer(nextCustomer)])
      return
    }

    setPointOfContact(undefined)
    setSelectedCustomers([toQuoteCustomer(nextCustomer)])
    setData((prev: any) => ({
      ...prev,
      customer: nextCustomer.id || '',
      customer_name: nextCustomer.name || '',
      customer_address: buildCustomerAddress(nextCustomer),
      customer_contact_id: '',
      customer_contact: '',
      customer_email: '',
      customer_phone: '',
    }))
  }

  return (
    <div className="w-full">
      <div className={`flex ${direction === 'row' ? 'flex-row' : 'flex-col'} justify-between gap-4 mb-4 flex-1`}>
        <div className={`${direction === 'row' ? 'w-1/2' : 'w-full mb-2'} flex flex-col`}>
          <label className="font-semibold block mb-1">{columnCustomerTitle || 'Customer'}</label>
          <SharedCustomerSelector
            customers={customers.map(toQuoteCustomer)}
            selectedCustomer={selectedCustomer ? toQuoteCustomer(selectedCustomer) : null}
            onSelectCustomer={async customer => {
              if (!customer) {
                return
              }
              handleCustomerClick(customer.id.toString())
            }}
            onCustomerCreated={async createdCustomer => {
              const refreshedCustomers = await refreshCustomers()
              const nextCustomer =
                refreshedCustomers.find(customer => customer.id === createdCustomer.id) ||
                toHookCustomer({
                  id: createdCustomer.id,
                  name: createdCustomer.name || createdCustomer.display_name || '',
                  displayName: createdCustomer.display_name || createdCustomer.name || '',
                  emails: [],
                  address: createdCustomer.address || '',
                  phones: [],
                  roles: [],
                  names: [],
                  contactIds: [],
                  url: '',
                  created: '',
                  updated: '',
                  city: createdCustomer.city || '',
                  state: createdCustomer.state || '',
                  zip: createdCustomer.zip || '',
                  customerNumber: 0,
                  mainPhone: createdCustomer.main_phone || '',
                  paymentTerms: '',
                })

              upsertCustomer(nextCustomer as any)
              handleCustomerClick(createdCustomer.id.toString())
            }}
            placeholder={loading ? 'Loading...' : 'Select Customer'}
          />
        </div>

        <div className={`${direction === 'row' ? 'w-1/2' : 'w-full mb-2'} flex flex-col`}>
          <label className="font-semibold block mb-1">{columnContactTitle || 'Contact'}</label>
          <SharedContactSelector
            customer={selectedCustomer ? toQuoteCustomer(selectedCustomer) : null}
            selectedContact={toSharedContact(selectedContact)}
            onSelectContact={async contact => {
              if (!contact) {
                return
              }
              handleContactClick(contact.id.toString())
            }}
            onCustomerChange={async customer => {
              upsertCustomer(toHookCustomer(customer) as any)
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default CustomerSelect
