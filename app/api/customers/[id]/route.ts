import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const resolvedParams = await params;
    const customerId = resolvedParams.id;
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Fetch the customer with their non-deleted contacts
    const { data, error } = await supabase
      .from('contractors')
      .select(`
        *,
        customer_contacts(*)
      `)
      .eq('id', customerId)
      .not('customer_contacts.is_deleted', 'eq', true)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the Customer type expected by the frontend
    const customer = {
      id: data.id,
      name: data.name || '',
      displayName: data.display_name || '',
      emails: data.customer_contacts ? data.customer_contacts.map((contact: any) => contact.email || '') : [],
      phones: data.customer_contacts ? data.customer_contacts.map((contact: any) => contact.phone || '') : [],
      names: data.customer_contacts ? data.customer_contacts.map((contact: any) => contact.name || '') : [],
      roles: data.customer_contacts ? data.customer_contacts.map((contact: any) => contact.role || '') : [],
      contactIds: data.customer_contacts ? data.customer_contacts.map((contact: any) => contact.id) : [],
      address: data.address || '',
      url: data.web || '',
      created: data.created || '',
      updated: data.updated || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
      customerNumber: data.customer_number || null,
      mainPhone: data.main_phone || '',
      paymentTerms: data.payment_terms || ''
    };

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error in customer fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
