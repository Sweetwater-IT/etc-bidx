import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { CustomerContactForm } from '@/components/customer-contact-form'
import { CustomerProvider } from '@/contexts/customer-context'
import { useCustomerSelection } from '@/hooks/use-csutomers-selection'
import { useQuoteForm } from '@/app/quotes/create/QuoteFormProvider'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SimpleCustomerCreateDialog } from '@/components/simple-customer-create-dialog'
import type { Customer as QuoteCustomer } from '@/types/Customer'

const CustomerSelect = ({ data, setData, direction = 'row', columnCustomerTitle, columnContactTitle }: { data: any, setData: React.Dispatch<any>, direction?: 'row' | 'column', columnCustomerTitle?: string, columnContactTitle?: string }) => {
    const router = useRouter()
    const { setSelectedCustomers, setPointOfContact } = useQuoteForm()
    const { customers, selectedCustomer, selectedContact, selectCustomer, selectContact, addContact, addCustomer, refreshCustomers, loading } = useCustomerSelection();
    const [customerSearch, setCustomerSearch] = useState('')
    const [contactSearch, setContactSearch] = useState('')
    const [isContactFormOpen, setIsContactFormOpen] = useState(false)
    const [openCustomer, setOpenCustomer] = useState(false)
    const [openContact, setOpenContact] = useState(false)
    const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false)

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
        if (!data.customer || customers.length === 0) return;

        const cust = customers.find(c => c.id.toString() === data.customer.toString());
        if (!cust) return;

        const contact =
            data.customer_contact && cust.customer_contacts?.length
                ? cust.customer_contacts.find(c => c.name === data.customer_contact) || null
                : null;

        selectCustomer(cust.id.toString(), contact?.id?.toString());
    }, [data.customer, data.customer_contact, customers, selectCustomer]);

    useEffect(() => {
        if (!selectedCustomer) return;

        const newData = {
            ...data,
            customer: selectedCustomer.id || "",
            customer_name: selectedCustomer.name || "",
            customer_email: selectedContact?.email || data.customer_email || "",
            customer_phone: selectedContact?.phone || data.customer_phone || "",
            customer_address: `${selectedCustomer.address || ""} ${selectedCustomer.city || ""}, ${selectedCustomer.state || ""} ${selectedCustomer.zip || ""}`,
            customer_contact: selectedContact?.name || data.customer_contact || "",
        };

        const hasChanged = Object.keys(newData).some(
            key => newData[key] !== data[key]
        );

        if (hasChanged) setData(newData);
    }, [data, selectedCustomer, selectedContact]);

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

    const openModal = (type: 'customer' | 'contact') => {
        if (type === 'contact') {
            setIsContactFormOpen(true)
            return
        }

        setOpenCustomer(false)
        setNewCustomerDialogOpen(true)
    }

    const handleContactSuccess = (newContactId?: number, newContactData?: any) => {
        setIsContactFormOpen(false);
        if (typeof newContactId === 'number' && newContactData) {
            const createdContact = {
                id: newContactId,
                name: newContactData.name || '',
                role: newContactData.role || '',
                email: newContactData.email || '',
                phone: newContactData.phone || '',
            }

            addContact(createdContact);
            setPointOfContact({
                id: createdContact.id,
                name: createdContact.name,
                email: createdContact.email,
            })
            setData((prev: any) => ({
                ...prev,
                customer_contact: createdContact.name || "",
                customer_email: createdContact.email || "",
                customer_phone: createdContact.phone || "",
            }));
        }
    };

    const handleContactClick = (contactId: string) => {
        const contact = selectedCustomer?.customer_contacts?.find(c => c.id?.toString() === contactId);
        if (!contact) return;

        selectContact(contact.id.toString());
        setPointOfContact({
            id: contact.id,
            name: contact.name || '',
            email: contact.email || '',
        })
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
                (cc.name || '').toLowerCase().includes(contactSearch) ||
                (cc.email || '').toLowerCase().includes(contactSearch)
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
                            <div className="border-b p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start gap-1.5 text-xs text-muted-foreground"
                                    onClick={() => openModal("customer")}
                                >
                                    <Plus className="h-3 w-3" />
                                    Add new customer
                                </Button>
                            </div>
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
                                                    selectCustomer(c.id.toString());
                                                    setOpenCustomer(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === c.id ? "opacity-100" : "opacity-0")} />
                                                {c.name}
                                            </CommandItem>
                                        ))}
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
                                        <CommandItem
                                            value="__new__"
                                            onSelect={() => {
                                                openModal("contact");
                                                setOpenContact(false);
                                            }}
                                        >
                                            ➕ Add new contact
                                        </CommandItem>
                                        {filteredContacts.length ? (
                                            filteredContacts
                                                .filter(cc => typeof cc.id === 'number')
                                                .map(cc => (
                                                <CommandItem
                                                    key={cc.id}
                                                    value={cc.id.toString()}
                                                    onSelect={() => {
                                                        handleContactClick(cc.id.toString());
                                                        setOpenContact(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedContact?.id === cc.id ? "opacity-100" : "opacity-0")} />
                                                    {cc.name} - {cc.role}
                                                </CommandItem>
                                            ))
                                        ) : (
                                            <p className="p-2 text-sm text-gray-500">No existing contacts</p>
                                        )}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Customer Contact Form */}
            {selectedCustomer && isContactFormOpen && (
                <CustomerProvider initialCustomer={{
                    id: selectedCustomer.id,
                    name: selectedCustomer.name,
                    displayName: selectedCustomer.name,
                    emails: [],
                    phones: [],
                    roles: [],
                    names: [],
                    contactIds: selectedCustomer.customer_contacts?.map(c => c.id) || [],
                    address: selectedCustomer.address,
                    city: selectedCustomer.city,
                    state: selectedCustomer.state,
                    zip: selectedCustomer.zip,
                    customerNumber: 0, // Default
                    mainPhone: selectedCustomer.main_phone || "",
                    paymentTerms: "",
                    url: "",
                    created: "",
                    updated: "",
                    lastOrdered: null
                }}>
                    <CustomerContactForm
                        customerId={selectedCustomer.id}
                        isOpen={isContactFormOpen}
                        onClose={() => setIsContactFormOpen(false)}
                        onSuccess={handleContactSuccess}
                        customer={{
                            name: selectedCustomer.name,
                            displayName: selectedCustomer.name, // Use name as displayName
                            address: selectedCustomer.address,
                            city: selectedCustomer.city,
                            state: selectedCustomer.state,
                            zip: selectedCustomer.zip,
                            paymentTerms: "", // Default empty
                            url: "" // Default empty
                        }}
                    />
                </CustomerProvider>
            )}

            <SimpleCustomerCreateDialog
                open={newCustomerDialogOpen}
                onOpenChange={setNewCustomerDialogOpen}
                description="Create a customer with a company name, then it will be available in this quote."
                onCreated={async (createdCustomer) => {
                    const refreshedCustomers = await refreshCustomers()
                    const normalizedCustomer =
                        refreshedCustomers.find(customer => customer.id === createdCustomer.id) || {
                            id: createdCustomer.id,
                            name: createdCustomer.name || createdCustomer.display_name || '',
                            display_name: createdCustomer.display_name || createdCustomer.name || '',
                            customer_contacts: [],
                            email: '',
                            main_phone: createdCustomer.main_phone || '',
                            address: createdCustomer.address || '',
                            city: createdCustomer.city || '',
                            state: createdCustomer.state || '',
                            zip: createdCustomer.zip || '',
                        }

                    addCustomer(normalizedCustomer)
                    setData((prev: any) => ({
                        ...prev,
                        customer: normalizedCustomer.id || '',
                        customer_name: normalizedCustomer.name || '',
                        customer_contact: '',
                        customer_email: '',
                        customer_phone: '',
                        customer_address: `${normalizedCustomer.address || ""} ${normalizedCustomer.city || ""}, ${normalizedCustomer.state || ""} ${normalizedCustomer.zip || ""}`.trim(),
                    }))

                    router.refresh()
                }}
            />
        </div>
    )
}

export default CustomerSelect
