import useSWR from 'swr';
import { Customer } from '@/types/Customer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FetchCustomersParams {
  page?: number;
  pageSize?: number;
  paymentTerms?: string;
}

const fetchCustomers = async ({ page = 1, pageSize = 10, paymentTerms = 'all' }: FetchCustomersParams) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('contractors')
      .select('*, customer_contacts(*)', { count: 'exact' })
      .order('name', { ascending: true });
      
    if (paymentTerms !== 'all') {
      query = query.eq('payment_terms', paymentTerms);
    }
    
    const response = await query.range(from, to);
      
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    const customers: Customer[] = (response.data as any[]).map(customer => {
      const validContacts = customer.customer_contacts 
        ? customer.customer_contacts.filter((contact: any) => !contact?.is_deleted)
        : [];
        
      return {
        id: customer.id,
        name: customer.name,
        displayName: customer.display_name,
        emails: validContacts.map((contact: any) => contact?.email || ''),
        phones: validContacts.map((contact: any) => contact?.phone || ''),
        names: validContacts.map((contact: any) => contact?.name || ''),
        roles: validContacts.map((contact: any) => contact?.role || ''),
        contactIds: validContacts.map((contact: any) => contact?.id || 0),
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
      };
    });
    
    return {
      customers,
      totalCount: response.count || 0
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

export function useCustomersSWR(params: FetchCustomersParams = {}) {
  const { page = 1, pageSize = 10, paymentTerms = 'all' } = params;
  
  const key = ['customers', page, pageSize, paymentTerms];
  
  const { data, error, mutate, isLoading } = useSWR(
    key, 
    () => fetchCustomers({ page, pageSize, paymentTerms }), 
    {
      revalidateOnFocus: false,
      dedupingInterval: 0,
      errorRetryCount: 3,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true
    }
  );
  
  return {
    customers: data?.customers || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error: error ? (error as Error).message : null,
    mutate
  };
}

export async function createCustomer(customerData : any) {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData)
  });

  const data = await response.json();
  console.log('Created customer:', data);
  return data;
}
