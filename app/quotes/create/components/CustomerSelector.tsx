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
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const CustomerSelect = ({ data, setData, direction = 'row', columnCustomerTitle, columnContactTitle }: { data: any, setData: React.Dispatch<any>, direction?: 'row' | 'column', columnCustomerTitle?: string, columnContactTitle?: string }) => {
    const router = useRouter()
    const { customers, selectedCustomer, selectedContact, selectCustomer, selectContact, addContact, addCustomer, refreshCustomers, loading } = useCustomerSelection();
    const [customerSearch, setCustomerSearch] = useState('')
    const [contactSearch, setContactSearch] = useState('')
    const [isContactFormOpen, setIsContactFormOpen] = useState(false)
    const [openCustomer, setOpenCustomer] = useState(false)
    const [openContact, setOpenContact] = useState(false)
    const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false)
    const [newCustomerName, setNewCustomerName] = useState('')
    const [creatingCustomer, setCreatingCustomer] = useState(false)

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
            // Auto-select the newly created contact
            selectContact(createdContact.id.toString());
        }
    };

    const handleContactClick = (contactId: string) => {
        const contact = selectedCustomer?.customer_contacts?.find(c => c.id?.toString() === contactId);
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
                (cc.name || '').toLowerCase().includes(contactSearch) ||
                (cc.email || '').toLowerCase().includes(contactSearch)
        )
    }, [selectedCustomer, contactSearch])

    const handleCustomerSuccess = async () => {
        if (!newCustomerName.trim()) {
            return
        }

        setCreatingCustomer(true)

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newCustomerName.trim(),
                    display_name: newCustomerName.trim(),
                }),
            })

            const result = await response.json().catch(() => null)

            if (!response.ok || !result?.ok || !result?.customer) {
                throw new Error(result?.error || result?.message || 'Failed to create customer')
            }

            const refreshedCustomers = await refreshCustomers()
            const createdCustomer =
                refreshedCustomers.find(customer => customer.id === result.customer.id) ||
                result.customer

            addCustomer(createdCustomer)
            setData((prev: any) => ({
                ...prev,
                customer: createdCustomer.id || '',
                customer_name: createdCustomer.name || '',
                customer_contact: '',
                customer_email: '',
                customer_phone: '',
                customer_address: `${createdCustomer.address || ""} ${createdCustomer.city || ""}, ${createdCustomer.state || ""} ${createdCustomer.zip || ""}`.trim(),
            }))

            setNewCustomerName('')
            setNewCustomerDialogOpen(false)
            router.refresh()
            toast.success('Customer created')
        } catch (error) {
            console.error('Failed to create customer from quote selector:', error)
            toast.error('Failed to create customer')
        } finally {
            setCreatingCustomer(false)
        }
    }

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

            <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>New Customer</DialogTitle>
                        <DialogDescription>
                            Create a customer with a company name, then it will be available in this quote.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <label className="text-sm font-medium text-foreground">Company Name</label>
                        <Input
                            className="mt-1.5"
                            value={newCustomerName}
                            onChange={(event) => setNewCustomerName(event.target.value)}
                            placeholder="Enter company name"
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault()
                                    void handleCustomerSuccess()
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setNewCustomerDialogOpen(false)}
                            disabled={creatingCustomer}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void handleCustomerSuccess()}
                            disabled={!newCustomerName.trim() || creatingCustomer}
                        >
                            {creatingCustomer ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CustomerSelect
