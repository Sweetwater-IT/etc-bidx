import { Customer } from '@/types/Customer';
import { create } from 'zustand';

interface PaginationState {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

interface CustomersState {
    customers: Customer[];
    isLoading: boolean;
    error: string | null;
    pagination: PaginationState;
    getCustomers: (page?: number, limit?: number) => Promise<void>;
    setPage: (page: number) => void;
}

export const useCustomers = create<CustomersState>((set, get) => ({
    customers: [],
    isLoading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 600,
        totalCount: 0,
        totalPages: 0
    },
    setPage: (page: number) => {
        set(state => ({
            pagination: {
                ...state.pagination,
                page
            }
        }));
        get().getCustomers(page);
    },
    getCustomers: async (page?: number, limit?: number) => {
        const currentPage = page || get().pagination.page;
        const currentLimit = limit || get().pagination.limit;
        
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/contractors?ascending=true&page=${currentPage}&limit=${currentLimit}`)
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch customers`);
            }
            
            const result = await response.json();
            
            const customers: Customer[] = (result.data as any[]).map(customer => ({
                id: customer.id,
                name: customer.name,
                displayName: customer.display_name,
                emails: customer.customer_contacts ? customer.customer_contacts.map(customerContact => customerContact?.email || '') : [],
                phones: customer.customer_contacts ? customer.customer_contacts.map(customerContact => customerContact?.phone || '') : [],
                names: customer.customer_contacts ? customer.customer_contacts.map(customerContact => customerContact?.name || '') : [],
                roles: customer.customer_contacts ? customer.customer_contacts.map(customerContact => customerContact?.role || '') : [],
                contactIds: customer.customer_contacts ? customer.customer_contacts.map(customerContact => customerContact?.id || 0) : [],
                address: customer.address || '',
                url: customer.web || '',
                created: customer.created || '',
                updated: customer.updated || '',
                city: customer.city || '',
                state: customer.state || '',
                zip: customer.zip || '',
                customerNumber: customer.customer_number || 0,
                mainPhone: customer.main_phone || '',
                paymentTerms: customer.payment_terms || ''
            }));
            
            set({ 
                customers, 
                isLoading: false,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    totalCount: result.count || 0,
                    totalPages: result.totalPages || 1
                }
            });
        } catch (error) {
            set({ error: (error as Error).message || 'An error occurred', isLoading: false });
        }
    }
}));