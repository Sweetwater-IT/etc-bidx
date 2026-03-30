import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

function mapCustomerResponse(data: any) {
    const validContacts = Array.isArray(data.customer_contacts)
        ? data.customer_contacts.filter((contact: any) => !contact?.is_deleted)
        : [];

    return {
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
        customerNumber: data.customer_number || '',
        mainPhone: data.main_phone || '',
        paymentTerms: data.payment_terms || '',
        wouldLikeToApplyForCredit: !!data.would_like_to_apply_for_credit
    };
}

async function resolveContractorId(params: any) {
    const resolvedParams = await params;
    return parseInt(resolvedParams.id);
}

export async function GET(request: NextRequest, { params }: any) {
    try {
        const id = await resolveContractorId(params);

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

        return NextResponse.json({ customer: mapCustomerResponse(data), ok: true });
    } catch (err) {
        console.error('Error fetching customer:', err);
        return NextResponse.json({ error: 'Unexpected error fetching customer', ok: false }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: any) {
    try {
        const id = await resolveContractorId(params);

        if (!id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const updatePayload = {
            name: body.name ?? null,
            display_name: body.display_name ?? body.displayName ?? null,
            customer_number: body.customer_number ?? body.customerNumber ?? null,
            main_phone: body.main_phone ?? body.mainPhone ?? null,
            web: body.web ?? body.url ?? null,
            address: body.address ?? null,
            city: body.city ?? null,
            state: body.state ?? null,
            zip: body.zip ?? null,
            bill_to_street: body.bill_to_street ?? null,
            bill_to_city: body.bill_to_city ?? null,
            bill_to_state: body.bill_to_state ?? null,
            bill_to_zip: body.bill_to_zip ?? null,
            payment_terms: body.payment_terms ?? body.paymentTerms ?? null,
            would_like_to_apply_for_credit:
                body.would_like_to_apply_for_credit ??
                body.wouldLikeToApplyForCredit ??
                false,
            updated: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('contractors')
            .update(updatePayload)
            .eq('id', id)
            .select('*, customer_contacts(*)')
            .single();

        if (error) {
            console.error('Error updating customer:', error);
            return NextResponse.json({ error: error.message, ok: false }, { status: 500 });
        }

        return NextResponse.json({ customer: mapCustomerResponse(data), ok: true });
    } catch (err) {
        console.error('Error updating customer:', err);
        return NextResponse.json({ error: 'Unexpected error updating customer', ok: false }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: any) {
    try {
        const id = await resolveContractorId(params);

        if (!id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        const updatedAt = new Date().toISOString();

        const { error: contractorError } = await supabase
            .from('contractors')
            .update({
                is_deleted: true,
                active: false,
                updated: updatedAt
            })
            .eq('id', id);

        if (contractorError) {
            console.error('Error deleting customer:', contractorError);
            return NextResponse.json({ error: contractorError.message, ok: false }, { status: 500 });
        }

        const { error: contactsError } = await supabase
            .from('customer_contacts')
            .update({
                is_deleted: true,
                updated: updatedAt
            })
            .eq('contractor_id', id);

        if (contactsError) {
            console.error('Error deleting customer contacts:', contactsError);
            return NextResponse.json({ error: contactsError.message, ok: false }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('Error deleting customer:', err);
        return NextResponse.json({ error: 'Unexpected error deleting customer', ok: false }, { status: 500 });
    }
}
