import { useState, useEffect } from "react";

interface CustomerContact {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

interface Customer {
    id: number;
    name: string;
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
                setCustomers(result.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
        const contact = selectedCustomer?.customer_contacts?.find(c => c.id.toString() === id) || null;
        setSelectedContact(contact);
    };

    const addCustomer = (customer: Customer) => {
        setCustomers(prev => [...prev, customer]);
        setSelectedCustomer(customer);
        setSelectedContact(customer.customer_contacts?.[0] || null);
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
        addContact,
        refreshCustomers: getCustomers,
        loading, 
    };
};

