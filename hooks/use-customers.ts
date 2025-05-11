import { Customer } from '@/types/Customer';
import { create } from 'zustand';

interface CustomersState {
    customers: Customer[]
    isLoading: boolean;
    error: string | null;
    getCustomers: () => Promise<void>;
}

export const useCustomers = create<CustomersState>((set) => ({
    customers: [],
    isLoading: false,
    error: null,
    getCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/contractors?ascending=true')
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch customers`);
            }
            
            const result = await response.json();
            
            const customers: Customer[] = (result.data as any[]).map(customer => ({
                id: customer.id,
                name: customer.name,
                displayName: customer.display_name,
                emails: customer.customer_contacts.map(customerContact => customerContact.email),
                phones: customer.customer_contacts.map(customerContact => customerContact.phone),
                names: customer.customer_contacts.map(customerContact => customerContact.name),
                roles: customer.customer_contacts.map(customerContact => customerContact.role),
                contactIds: customer.customer_contacts.map(customerContact => customerContact.id),
                address: customer.address,
                url: customer.web,
                created: customer.created,
                updated: customer.updated,
                city: customer.city,
                state: customer.state,
                zip: customer.zip,
                customerNumber: customer.customer_number,
                mainPhone: customer.main_phone,
                paymentTerms: customer.payment_terms
            }));
            
            set({ customers, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message || 'An error occurred', isLoading: false });
        }
    }
}));