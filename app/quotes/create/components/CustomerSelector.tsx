'use client'

import React, { useEffect, useState } from 'react'
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import CreateModal from './CreateModal'
import { useCustomerSelection } from '@/hooks/use-csutomers-selection'

const CustomerSelect = ({ data, setData }: { data: any, setData: React.Dispatch<any> }) => {
    const { customers, selectedCustomer, selectedContact, selectCustomer, selectContact, refreshCustomers, addContact, addCustomer } = useCustomerSelection();
    const [customerSearch, setCustomerSearch] = useState('')
    const [contactSearch, setContactSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [modalType, setModalType] = useState<'customer' | 'contact' | null>(null)

    useEffect(() => {
        if (!selectedCustomer) return;

        setData({
            ...data,
            customer: selectedCustomer.id || "",
            customer_name: selectedCustomer.name || "",
            customer_email: selectedCustomer.email || "",
            customer_phone: selectedCustomer.main_phone || "",
            customer_address: `${selectedCustomer.address || ""} ${selectedCustomer.city || ""}, ${selectedCustomer.state || ""} ${selectedCustomer.zip || ""}`,
            customer_contact: selectedContact?.name || "",
        });
    }, [selectedCustomer, selectedContact]);

    const openModal = (type: 'customer' | 'contact') => {
        setModalType(type)
        setModalOpen(true)
    }

    const handleConfirm = async (data: Record<string, string>) => {
        if (modalType === 'customer') {
            try {
                const resp = await fetch('/api/contractors/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        address: data.address || null,
                        url: data.url || null,
                        city: data.city || null,
                        state: data.state || null,
                        zip: data.zip || null,
                        phone: data.phone || null,
                        customerNumber: data.customerNumber || null
                    })
                })

                const result = await resp.json()
                if (result.success) {
                    addCustomer(result.data)
                } else {
                    console.error('Error creating customer:', result.message)
                }
            } catch (err) {
                console.error(err)
            }
        }

        if (modalType === 'contact') {
            try {
                const resp = await fetch('/api/customer-contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contractor_id: selectedCustomer?.id,
                        name: data.name,
                        role: data.role || null,
                        email: data.email,
                        phone: data.phone || null,
                    }),
                });

                const result = await resp.json();
                if (result.success) {
                    addContact(result.data)
                } else {
                    console.error('Error creating contact:', result.error);
                }
            } catch (err) {
                console.error(err);
            }
        }

        setModalOpen(false)
    }

    return (
        <div className="w-full">
            <p className="font-semibold mb-1">Customer Selection</p>
            <div className="flex flex-row justify-between gap-4 mb-4 flex-1">

                <div className="w-1/2">
                    <Select
                        onValueChange={val => {
                            if (val === '__new__') return openModal('customer')
                            selectCustomer(val)
                        }}
                        value={selectedCustomer?.id?.toString() || ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                        <SelectContent className="flex flex-col">
                            <div className="p-2 border-b">
                                <Input
                                    type="text"
                                    placeholder="Search customer..."
                                    className="w-full px-2 py-1 text-sm"
                                    onChange={e => setCustomerSearch(e.target.value.toLowerCase())}
                                />
                            </div>

                            <div className="max-h-40 overflow-y-auto">
                                {customers
                                    .filter(c => c.name.toLowerCase().includes(customerSearch))
                                    .map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                            </div>

                            <div className="border-t">
                                <SelectItem value="__new__" className="font-bold">
                                    ➕ Add new customer
                                </SelectItem>
                            </div>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-1/2">
                    <Select
                        onValueChange={val => {
                            if (val === '__new__') return openModal('contact')
                            selectContact(val)
                        }}
                        value={selectedContact?.id?.toString() || ''}
                        disabled={!selectedCustomer}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Contact" />
                        </SelectTrigger>
                        <SelectContent className="flex flex-col">
                            <div className="p-2 border-b">
                                <Input
                                    type="text"
                                    placeholder="Search contact..."
                                    className="w-full px-2 py-1 text-sm"
                                    onChange={e => setContactSearch(e.target.value.toLowerCase())}
                                />
                            </div>

                            <div className="max-h-20 overflow-y-auto">
                                {selectedCustomer?.customer_contacts?.filter(
                                    (cc) =>
                                        cc.name.toLowerCase().includes(contactSearch) ||
                                        cc.email.toLowerCase().includes(contactSearch)
                                ).length ? (
                                    selectedCustomer.customer_contacts
                                        .filter(
                                            (cc) =>
                                                cc.name.toLowerCase().includes(contactSearch) ||
                                                cc.email.toLowerCase().includes(contactSearch)
                                        )
                                        .map((cc) => (
                                            <SelectItem key={cc.id} value={cc.id.toString()}>
                                                {cc.name} ({cc.email})
                                            </SelectItem>
                                        ))
                                ) : (
                                    <p className="p-2 text-sm text-gray-500">There are no contacts</p>
                                )}
                            </div>


                            <div className="border-t">
                                <SelectItem value="__new__" className="font-bold">
                                    ➕ Add new contact
                                </SelectItem>
                            </div>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <CreateModal
                open={modalOpen}
                title={modalType === 'customer' ? 'Create Customer' : 'Create Contact'}
                fields={
                    modalType === 'customer'
                        ? [
                            { name: 'name', label: 'Name', placeholder: 'Enter customer name' },
                            { name: 'address', label: 'Address', placeholder: 'Enter address' },
                            { name: 'url', label: 'Website', placeholder: 'Enter website URL' },
                            { name: 'city', label: 'City', placeholder: 'Enter city' },
                            { name: 'state', label: 'State', placeholder: 'Enter state' },
                            { name: 'zip', label: 'Zip', placeholder: 'Enter ZIP code' },
                            { name: 'phone', label: 'Phone', placeholder: 'Enter phone number' },
                            { name: 'customerNumber', label: 'Customer Number', type: 'number', placeholder: 'Enter customer number' }
                        ]
                        : [
                            { name: 'name', label: 'Name', placeholder: 'Enter contact name' },
                            { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter contact email' },
                            {
                                name: 'role',
                                label: 'Role',
                                type: 'select',
                                options: [
                                    'ESTIMATOR',
                                    'PROJECT MANAGER',
                                    'ADMIN',
                                    'FIELD / SUPERVISOR',
                                    'OTHER'
                                ],
                                placeholder: 'Select role'
                            },
                            { name: 'phone', label: 'Phone', placeholder: 'Enter phone number' },
                        ]
                }
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirm}
            />
        </div>
    )
}

export default CustomerSelect
