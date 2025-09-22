import { useState, useEffect } from "react";

interface CustomerContact {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

interface Customer {
    id: number;
    name: string;
    email?: string;
    main_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    customer_contacts: CustomerContact[];
}

export const useCustomerSelection = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedContact, setSelectedContact] = useState<CustomerContact | null>(null);

    const getCustomers = async () => {
        try {
            const res = await fetch("/api/contractors?offset=0&limit=1000");
            const result = await res.json();
            if (result.success) {
                setCustomers(result.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getCustomers();
    }, []);

    const selectCustomer = (id: string) => {
        const customer = customers.find(c => c.id.toString() === id) || null;
        setSelectedCustomer(customer);
        setSelectedContact(customer?.customer_contacts?.[0] || null);
    };

    const selectContact = (id: string) => {
        const contact = selectedCustomer?.customer_contacts.find(c => c.id.toString() === id) || null;
        setSelectedContact(contact);
    };

    return {
        customers,
        selectedCustomer,
        selectedContact,
        selectCustomer,
        selectContact,
    };
};
