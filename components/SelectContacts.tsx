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
import { CustomerProvider } from '@/contexts/customer-context'

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


    async function fetchCustomerById(id: number) {
        const res = await fetch(`/api/customers/${id}`)
        if (res.ok) {
            return await res.json()
        }
        return null
    }

    return (
        <>
            <Popover open={openCustomerContact} onOpenChange={setOpenCustomerContact}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCustomerContact}
                        className="w-full justify-between bg-muted/50"
                        disabled={!localCustomer}
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
                            {/* Crear nuevo contacto */}
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

                            {localCustomer &&
                                Array.isArray(localCustomer.contactIds) &&
                                localCustomer.contactIds.length > 0 &&
                                localCustomer.contactIds.map((id: number, idx: number) => (
                                    <CommandItem
                                        key={id}
                                        value={localCustomer.names[idx]}
                                        className="flex flex-row items-center"
                                        onSelect={() => {
                                            setLocalContact({
                                                id,
                                                name: localCustomer.names[idx],
                                                email: localCustomer.emails[idx],
                                                phone: localCustomer.phones[idx],
                                                role: localCustomer.roles[idx]
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
                                            <p>{localCustomer.names[idx]}</p>
                                            {localCustomer.emails[idx] && (
                                                <p className="text-xs text-muted-foreground">
                                                    {localCustomer.emails[idx]}
                                                </p>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {localCustomer && (
                <CustomerProvider initialCustomer={localCustomer}>
                    {localCustomer &&
                        (<Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
                            <DialogContent className="sm:max-w-lg w-full">
                                <DialogHeader>
                                    <DialogTitle>Add New Contact</DialogTitle>
                                </DialogHeader>
                                <CustomerContactForm
                                    customerId={localCustomer.id}
                                    isOpen={contactModalOpen}
                                    onClose={() => setContactModalOpen(false)}
                                    onSuccess={async (newContactId?: number) => {
                                        setContactModalOpen(false)
                                        if (localCustomer?.id) {
                                            const updatedCustomer = await fetchCustomerById(localCustomer.id)
                                            setLocalCustomer(updatedCustomer)
                                        }
                                    }}
                                    customer={localCustomer} />
                            </DialogContent>
                        </Dialog>)}
                </CustomerProvider>)}
        </>
    )
}
