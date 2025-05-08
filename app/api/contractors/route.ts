import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderBy = searchParams.get('orderBy') || 'name';
    const ascending = searchParams.get('ascending') === 'true';
    
    const { data, error } = await supabase
      .from('contractors')
      .select(`
        id,
        name,
        address_name,
        address_contact,
        address_type,
        default_address,
        display_name,
        address,
        city,
        state,
        zip,
        residential,
        main_phone,
        fax,
        web,
        email,
        credit_limit,
        status,
        customer_number,
        active,
        number,
        payment_terms,
        tax_exempt,
        shipping_terms,
        quick_books_class_name,
        to_be_emailed,
        to_be_printed,
        created,
        updated,
        customer_contacts ( id, name, role, phone, email)
      `)
      .order(orderBy, { ascending });

    if (error) {
      console.error('Error fetching contractors:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch contractors', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
} 