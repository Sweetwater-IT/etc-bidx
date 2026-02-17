import React, { useEffect, useState, useMemo } from 'react'
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CreateModal from './CreateModal'
import { useCustomerSelection } from '@/hooks/use-csutomers-selection'
import { Loader, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const CustomerSelect = ({ data, setData, direction = 'row', columnCustomerTitle, columnContactTitle }: { data: any, setData: React.Dispatch<any>, direction?: 'row' | 'column', columnCustomerTitle?: string, columnContactTitle?: string }) => {
    const { customers, selectedCustomer, selectedContact, selectCustomer, selectContact, addContact, addCustomer, loading } = useCustomerSelection();
    const [customerSearch, setCustomerSearch] = useState('')
    const [contactSearch, setContactSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [modalType, setModalType] = useState<'customer' | 'contact' | null>(null)
    const [openCustomer, setOpenCustomer] = useState(false)
    const [openContact, setOpenContact] = useState(false)

    useEffect(() => {
        if (!data.customer || customers.length === 0) return;

        const cust = customers.find(c => c.id.toString() === data.customer.toString());
        if (!cust) return;

        selectCustomer(cust.id.toString());

        if (data.customer_contact && cust.customer_contacts?.length) {
            const contact = cust.customer_contacts.find(c => c.name === data.customer_contact);
            if (contact) selectContact(contact.id.toString());
        }
    }, [data.customer, data.customer_contact, customers]);

    useEffect(() => {
        if (!selectedCustomer) return;

        const newData = {
            ...data,
            customer: selectedCustomer.id || "",
            customer_name: selectedCustomer.name || "",
            customer_email: selectedContact?.email || "",
            customer_phone: selectedContact?.phone || "",
            customer_address: `${selectedCustomer.address || ""} ${selectedCustomer.city || ""}, ${selectedCustomer.state || ""} ${selectedCustomer.zip || ""}`,
            customer_contact: selectedContact?.name || "",
        };

        const hasChanged = Object.keys(newData).some(
            key => newData[key] !== data[key]
        );

        if (hasChanged) setData(newData);
    }, [selectedCustomer, selectedContact]);

    const openModal = (type: 'customer' | 'contact') => {
        setModalType(type)
        setModalOpen(true)
    }

    const handleConfirm = async (data: Record<string, string>) => {
        if (modalType === 'customer') {
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
            if (result.success) addCustomer(result.data)
        }

        if (modalType === 'contact') {
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
            })
            const result = await resp.json()
            if (result.success) addContact(result.data)
        }

        setModalOpen(false)
    }

    const handleContactClick = (contactId: string) => {
        const contact = selectedCustomer?.customer_contacts?.find(c => c.id.toString() === contactId);
        if (!contact) return;

        selectContact(contact.id.toString());
        setData((prev: any) => ({
            ...prev,
            customer_contact: contact.name || "",
            customer_email: contact.email || "",
            customer_phone: contact.phone || "",
            customer_address: contact.address || ""
        }));
    };

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers
        return customers.filter(c =>
            c.name.toLowerCase().includes(customerSearch)
        )
    }, [customers, customerSearch])

    const filteredContacts = useMemo(() => {
        if (!selectedCustomer?.customer_contacts) return []
        if (!contactSearch) return selectedCustomer.customer_contacts
        return selectedCustomer.customer_contacts.filter(
            cc =>
                cc.name.toLowerCase().includes(contactSearch) ||
                cc.email.toLowerCase().includes(contactSearch)
        )
    }, [selectedCustomer, contactSearch])

    return (
        <div className="w-full">
            <div className={`flex ${direction === "row" ? "flex-row" : "flex-col"} justify-between gap-4 mb-4 flex-1`}>
                {/* Customer */}
                <div className={`${direction === "row" ? "w-1/2" : "w-full mb-2"} flex flex-col`}>
                    <label className="font-semibold block mb-1">{columnCustomerTitle || "Customer Selection"}</label>
                    <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-between">
                                {loading
                                    ? "Loading..."
                                    : selectedCustomer?.name || "Select Customer"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput
                                    value={customerSearch.toLocaleLowerCase()}
                                    placeholder="Search..."
                                    onValueChange={(val: string) => setCustomerSearch(val.toLocaleLowerCase())}
                                />
                                <CommandList>
                                    <CommandEmpty>No customers found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredCustomers.map(c => (
                                            <CommandItem
                                                key={c.id}
                                                value={c.name.toString().toLocaleLowerCase()}
                                                onSelect={() => {
                                                    if (c.id.toString() === "__new__") return openModal("customer");
                                                    selectCustomer(c.id.toString());
                                                    setOpenCustomer(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === c.id ? "opacity-100" : "opacity-0")} />
                                                {c.name}
                                            </CommandItem>
                                        ))}
                                        <CommandItem
                                            value="__new__"
                                            onSelect={() => {
                                                openModal("customer");
                                                setOpenCustomer(false);
                                            }}
                                        >
                                            ➕ Add new customer
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Contact */}
                <div className={`${direction === "row" ? "w-1/2" : "w-full mb-2"} flex flex-col`}>
                    <label className="font-semibold block mb-1">{columnContactTitle || "Contact Selection"}</label>
                    <Popover open={openContact} onOpenChange={setOpenContact}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-between" disabled={!selectedCustomer || loading}>
                                {loading
                                    ? "Loading..."
                                    : selectedContact?.name || (selectedCustomer ? "Please select contact" : "Select Contact")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput
                                    value={contactSearch}
                                    placeholder="Search..."
                                    onValueChange={(val: string) => setContactSearch(val.toLocaleLowerCase())}
                                />
                                <CommandList>
                                    <CommandEmpty>No contacts found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredContacts.length ? (
                                            filteredContacts.map(cc => (
                                                <CommandItem
                                                    key={cc.id}
                                                    value={cc.id.toString()}
                                                    onSelect={() => {
                                                        handleContactClick(cc.id.toString());
                                                        setOpenContact(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedContact?.id === cc.id ? "opacity-100" : "opacity-0")} />
                                                    {cc.name} - {cc.role} ({cc.email})
                                                </CommandItem>
                                            ))
                                        ) : (
                                            <p className="p-2 text-sm text-gray-500">There are no contacts</p>
                                        )}
                                        <CommandItem
                                            value="__new__"
                                            onSelect={() => {
                                                openModal("contact");
                                                setOpenContact(false);
                                            }}
                                        >
                                            ➕ Add new contact
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
