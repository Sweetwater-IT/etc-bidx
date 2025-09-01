import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('contractors')
            .select('*, customer_contacts(*)')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const validContacts = data.customer_contacts
            ? data.customer_contacts.filter((contact: any) => !contact?.is_deleted)
            : [];

        const customer = {
            id: data.id,
            name: data.name,
            displayName: data.display_name,
            emails: validContacts.map((c: any) => c.email || ''),
            phones: validContacts.map((c: any) => c.phone || ''),
            names: validContacts.map((c: any) => c.name || ''),
            roles: validContacts.map((c: any) => c.role || ''),
            contactIds: validContacts.map((c: any) => c.id || 0),
            address: data.address || '',
            url: data.web || '',
            created: data.created || '',
            updated: data.updated || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            customerNumber: data.customer_number || 0,
            mainPhone: data.main_phone || '',
            paymentTerms: data.payment_terms || ''
        };

        return NextResponse.json({ customer, ok:true});
    } catch (err) {
        console.error('Error fetching customer:', err);
        return NextResponse.json({ error: 'Unexpected error fetching customer', ok:false }, { status: 500 });
    }
}
