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
    
    const customers: Customer[] = (response.data as any[]).map(customer => ({
      id: customer.id,
      name: customer.name,
      displayName: customer.display_name,
      emails: customer.customer_contacts.map((contact: any) => contact.email),
      phones: customer.customer_contacts.map((contact: any) => contact.phone),
      names: customer.customer_contacts.map((contact: any) => contact.name),
      roles: customer.customer_contacts.map((contact: any) => contact.role),
      contactIds: customer.customer_contacts.map((contact: any) => contact.id),
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
      dedupingInterval: 60000,
      errorRetryCount: 3,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false
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

export async function createCustomer(customerData: any) {
  try {
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('contractors')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
      
    if (maxIdError) {
      throw maxIdError;
    }
    
    const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
    
    const { data, error } = await supabase
      .from('contractors')
      .insert([{
        id: newId,
        name: customerData.name,
        display_name: customerData.display_name,
        customer_number: customerData.customer_number,
        web: customerData.web,
        main_phone: customerData.main_phone,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        zip: customerData.zip,
        payment_terms: customerData.payment_terms,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        active: true
      }]);
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}
