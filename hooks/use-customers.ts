import { Customer } from '@/types/Customer';
import { create } from 'zustand';

interface CustomersState {
    customers: Customer[];
    isLoading: boolean;
    error: string | null;
    getCustomers: () => Promise<void>;
}

export const useCustomers = create<CustomersState>((set, get) => ({
    customers: [],
    isLoading: false,
    error: null,

    getCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
            // Fetch customers and last ordered data in parallel
            const [customersResponse, lastOrderedResponse] = await Promise.all([
                fetch(`/api/contractors?ascending=true&limit=1000`),
                fetch(`/api/customers/last-ordered`)
            ]);

            if (!customersResponse.ok) throw new Error('Failed to fetch customers');
            if (!lastOrderedResponse.ok) throw new Error('Failed to fetch last ordered data');

            const customersResult = await customersResponse.json();
            const lastOrderedResult = await lastOrderedResponse.json();

            const lastOrderedMap: Record<number, string> = lastOrderedResult.data || {};

            const customers: Customer[] = (customersResult.data || []).map((customer: any) => ({
                id: customer.id,
                name: customer.name,
                displayName: customer.display_name?.trim() || customer.name,
                emails: customer.customer_contacts?.map((c: any) => c.email || '') || [],
                phones: customer.customer_contacts?.map((c: any) => c.phone || '') || [],
                names: customer.customer_contacts?.map((c: any) => c.name || '') || [],
                roles: customer.customer_contacts?.map((c: any) => c.role || '') || [],
                contactIds: customer.customer_contacts?.map((c: any) => c.id || 0) || [],
                address: customer.address || '',
                url: customer.web || '',
                created: customer.created || '',
                updated: customer.updated || '',
                city: customer.city || '',
                state: customer.state || '',
                zip: customer.zip || '',
                customerNumber: customer.customer_number || 0,
                mainPhone: customer.main_phone || '',
                paymentTerms: customer.payment_terms || '',
                lastOrdered: lastOrderedMap[customer.id] || null
            }));

            set({ customers, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    }
}));

// Auto-fetch when the store is first created
useCustomers.getState().getCustomers();
