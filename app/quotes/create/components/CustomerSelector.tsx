'use client'

import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface CustomerSelectProps {
    customers: {
        id: number;
        name: string;
        customer_contacts?: { id: number; name: string; email: string }[];
    }[];
    selectedCustomer: { id: number; name: string; customer_contacts?: { id: number; name: string; email: string }[] } | null;
    selectedContact: { id: number; name: string; email: string } | null;
    onSelectCustomer: (id: string) => void;
    onSelectContact: (id: string) => void;
}

const CustomerSelect: React.FC<CustomerSelectProps> = ({
    customers,
    selectedCustomer,
    selectedContact,
    onSelectCustomer,
    onSelectContact,
}) => {
    return (
        <div className="mb-8">
            <p className="font-bold mb-2">Customer Selection</p>
            <div className="flex flex-row justify-between gap-4 mb-4">
                <div className="w-full">
                    <Select onValueChange={onSelectCustomer} value={selectedCustomer?.id?.toString() || ""}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map(c => (
                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full">
                    <Select
                        onValueChange={onSelectContact}
                        value={selectedContact?.id?.toString() || ""}
                        disabled={!selectedCustomer}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Contact" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedCustomer?.customer_contacts?.length
                                ? selectedCustomer.customer_contacts.map(cc => (
                                    <SelectItem key={cc.id} value={cc.id.toString()}>
                                        {cc.name} ({cc.email})
                                    </SelectItem>
                                ))
                                : <p className="text-center text-gray-400 text-sm py-4">There are no contacts</p>
                            }
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};

export default CustomerSelect;
