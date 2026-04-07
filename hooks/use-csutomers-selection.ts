import { useState, useEffect } from "react";

interface CustomerContact {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    role?: string;
}

interface Customer {
    id: number;
    name: string;
    display_name?: string | null;
    customer_contacts?: CustomerContact[];
    email: string;
    main_phone: string;
    address: string;
    city: string;
    state: string
    zip: string;
}

export const useCustomerSelection = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedContact, setSelectedContact] = useState<CustomerContact | null>(null);
    const [loading, setLoading] = useState(true);

    const getCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/contractors?offset=0&limit=1000");
            const result = await res.json();
            if (result.success) {
                const sorted = [...result.data].sort((a: Customer, b: Customer) =>
                    a.name.localeCompare(b.name)
                );
                setCustomers(sorted);
                return sorted;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }

        return [];
    };

    useEffect(() => {
        getCustomers();
    }, []);

    const selectCustomer = (id: string, contactId?: string) => {
        const customer = customers.find(c => c.id.toString() === id) || null;
        setSelectedCustomer(customer);
        if (!customer) {
            setSelectedContact(null);
            return;
        }

        if (contactId) {
            const contact =
                customer.customer_contacts?.find(c => c.id.toString() === contactId) || null;
            setSelectedContact(contact);
            return;
        }

        setSelectedContact(null); // Don't auto-select first contact
    };

    const selectContact = (id: string) => {
        const contact = selectedCustomer?.customer_contacts?.find(c => c.id.toString() === id) || null;
        setSelectedContact(contact);
    };

    const addCustomer = (customer: Customer) => {
        setCustomers(prev => [...prev, customer]);
        setSelectedCustomer(customer);
        setSelectedContact(customer.customer_contacts?.[0] || null);
    };

    const upsertCustomer = (customer: Customer) => {
        setCustomers(prev => {
            const existingIndex = prev.findIndex(c => c.id === customer.id);
            if (existingIndex === -1) {
                return [...prev, customer];
            }

            return prev.map(c => (c.id === customer.id ? customer : c));
        });

        setSelectedCustomer(customer);

        if (selectedContact) {
            const refreshedContact =
                customer.customer_contacts?.find(c => c.id === selectedContact.id) || null;
            setSelectedContact(refreshedContact);
        }
    };

    const addContact = (contact: CustomerContact) => {
        if (!selectedCustomer) return;
        const updatedCustomer = {
            ...selectedCustomer,
            customer_contacts: selectedCustomer.customer_contacts
                ? [...selectedCustomer.customer_contacts, contact]
                : [contact]
        };
        setSelectedCustomer(updatedCustomer);
        setSelectedContact(contact);

        setCustomers(prev =>
            prev.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c))
        );
    };

    return {
        customers,
        selectedCustomer,
        selectedContact,
        selectCustomer,
        selectContact,
        addCustomer,
        upsertCustomer,
        addContact,
        refreshCustomers: getCustomers,
        loading,
    };
};
