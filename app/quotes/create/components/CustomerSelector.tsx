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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomerContactForm } from '@/components/customer-contact-form'
import { CustomerProvider } from '@/contexts/customer-context'
import { useCustomerSelection } from '@/hooks/use-csutomers-selection'
import { createCustomer } from '@/hooks/use-customers-swr'
import { Loader, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CustomerSelect = ({ data, setData, direction = 'row', columnCustomerTitle, columnContactTitle }: { data: any, setData: React.Dispatch<any>, direction?: 'row' | 'column', columnCustomerTitle?: string, columnContactTitle?: string }) => {
    const { customers, selectedCustomer, selectedContact, selectCustomer, selectContact, addContact, addCustomer, loading } = useCustomerSelection();
    const [customerSearch, setCustomerSearch] = useState('')
    const [contactSearch, setContactSearch] = useState('')
    const [isContactFormOpen, setIsContactFormOpen] = useState(false)
    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false)
    const [openCustomer, setOpenCustomer] = useState(false)
    const [openContact, setOpenContact] = useState(false)
    const [newCustomerName, setNewCustomerName] = useState('')
    const [newCustomerDisplayName, setNewCustomerDisplayName] = useState('')
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)

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
        } else if (type === 'customer') {
            setIsCustomerFormOpen(true)
        }
    }

    const handleContactSuccess = (newContactId?: number, newContactData?: any) => {
        setIsContactFormOpen(false);
        if (newContactData) {
            addContact(newContactData);
            // Auto-select the newly created contact
            selectContact(newContactData.id.toString());
        }
    };

    const handleCreateCustomer = async () => {
        if (!newCustomerName.trim()) {
            toast.error('Company legal name is required');
            return;
        }

        setIsCreatingCustomer(true);
        try {
            const customerData = {
                name: newCustomerName.trim(),
                display_name: newCustomerDisplayName.trim() || newCustomerName.trim(),
                customer_number: '',
                payment_terms: 'NET30',
                address: '',
                city: '',
                state: '',
                zip: '',
                main_phone: '',
                url: '',
                personOrderingName: '',
                personOrderingTitle: '',
                primaryContactName: '',
                primaryContactPhone: '',
                primaryContactEmail: '',
                primaryContactSameAsPersonOrdering: false,
                projectManagerName: '',
                projectManagerPhone: '',
                projectManagerEmail: '',
                billToSameAsMain: true,
                bill_to_street_address: '',
                bill_to_city: '',
                bill_to_state: '',
                bill_to_zip_code: '',
                would_like_to_apply_for_credit: false
            };

            const result = await createCustomer(customerData);
            if (result && result.customer) {
                // Transform the raw database data to match the Customer interface expected by addCustomer
                const transformedCustomer = {
                    id: result.customer.id,
                    name: result.customer.name,
                    email: '', // Default empty since no contacts created
                    main_phone: result.customer.main_phone || '',
                    address: result.customer.address || '',
                    city: result.customer.city || '',
                    state: result.customer.state || '',
                    zip: result.customer.zip || '',
                    customer_contacts: [] // No contacts created in this simple modal
                };

                // Add the new customer to the list
                addCustomer(transformedCustomer);
                // Close the modal and reset form
                setIsCustomerFormOpen(false);
                setNewCustomerName('');
                setNewCustomerDisplayName('');
                toast.success('Customer created successfully!');
            }
        } catch (error: any) {
            console.error('Error creating customer:', error);
            toast.error(`Error creating customer: ${error.message || 'Unknown error'}`);
        } finally {
            setIsCreatingCustomer(false);
        }
    };

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
                                        <CommandItem
                                            value="__new__"
                                            onSelect={() => {
                                                openModal("customer");
                                                setOpenCustomer(false);
                                            }}
                                        >
                                            ➕ Add new customer
                                        </CommandItem>
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

            {/* Customer Creation Modal */}
            <Dialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Customer</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customer-name" className="text-right">
                                Legal Name *
                            </Label>
                            <Input
                                id="customer-name"
                                value={newCustomerName}
                                onChange={(e) => setNewCustomerName(e.target.value)}
                                className="col-span-3"
                                placeholder="Enter company legal name"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customer-display-name" className="text-right">
                                Display Name
                            </Label>
                            <Input
                                id="customer-display-name"
                                value={newCustomerDisplayName}
                                onChange={(e) => setNewCustomerDisplayName(e.target.value)}
                                className="col-span-3"
                                placeholder="Display name (optional)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsCustomerFormOpen(false);
                                setNewCustomerName('');
                                setNewCustomerDisplayName('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateCustomer}
                            disabled={isCreatingCustomer || !newCustomerName.trim()}
                        >
                            {isCreatingCustomer ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Customer'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CustomerSelect
