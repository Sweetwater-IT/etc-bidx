import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Customer } from '@/types/Customer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { CustomerContactForm } from './customer-contact-form'
import { CustomerProvider, useCustomer } from '@/contexts/customer-context'

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
    contactModalOpen: boolean
    setContactModalOpen: (open: boolean) => void
}

export function ContactSelector({
    localCustomer,
    localContact,
    setLocalContact,
    contactModalOpen,
    setLocalCustomer,
    setContactModalOpen
}: ContactSelectorProps) {
    const [openCustomerContact, setOpenCustomerContact] = useState(false)

    return (
        <CustomerProvider initialCustomer={localCustomer}>
            <InnerContactSelector
                localContact={localContact}
                setLocalContact={setLocalContact}
                contactModalOpen={contactModalOpen}
                setLocalCustomer={setLocalCustomer}
                setContactModalOpen={setContactModalOpen}
                openCustomerContact={openCustomerContact}
                setOpenCustomerContact={setOpenCustomerContact}
            />
        </CustomerProvider>
    )
}

interface InnerProps extends Omit<ContactSelectorProps, 'localCustomer'> {
    openCustomerContact: boolean
    setOpenCustomerContact: (open: boolean) => void
}

function InnerContactSelector({
    localContact,
    setLocalContact,
    contactModalOpen,
    setLocalCustomer,
    setContactModalOpen,
    openCustomerContact,
    setOpenCustomerContact
}: InnerProps) {
    const { customer } = useCustomer()

    return (
        <>
            <Popover open={openCustomerContact} onOpenChange={setOpenCustomerContact}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCustomerContact}
                        className="w-full justify-between bg-muted/50"
                        disabled={!customer}
                    >
                        <span className="truncate">
                            {localContact ? localContact.name : 'Select contact...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput placeholder="Search contact..." />
                        <CommandEmpty>No contact found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                            <CommandItem
                                onSelect={() => {
                                    setOpenCustomerContact(false)
                                    setContactModalOpen(true)
                                }}
                                value="__add_new_contact__"
                                className="font-medium text-primary cursor-pointer"
                            >
                                + Add new contact
                            </CommandItem>

                            {customer &&
                                Array.isArray(customer.contactIds) &&
                                customer.contactIds.map((id, idx) => (
                                    <CommandItem
                                        key={id}
                                        value={customer.names[idx]}
                                        className="flex flex-row items-center"
                                        onSelect={() => {
                                            setLocalContact({
                                                id,
                                                name: customer.names[idx],
                                                email: customer.emails[idx],
                                                phone: customer.phones[idx],
                                                role: customer.roles[idx]
                                            })
                                            setOpenCustomerContact(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'h-4 w-4 mr-2 text-black',
                                                localContact?.id === id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <div className="flex flex-col items-start">
                                            <p>{customer.names[idx]}</p>
                                            {customer.emails[idx] && (
                                                <p className="text-xs text-muted-foreground">
                                                    {customer.emails[idx]}
                                                </p>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {customer && (
                <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
                    <DialogContent className="sm:max-w-lg w-full">
                        <DialogHeader>
                            <DialogTitle>Add New Contact</DialogTitle>
                        </DialogHeader>
                        <CustomerContactForm
                            customerId={customer.id}
                            isOpen={contactModalOpen}
                            onClose={() => setContactModalOpen(false)}
                            onSuccess={async (refreshedCustomer?: any) => {
                                setContactModalOpen(false)
                            }}
                            customer={customer}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
