import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Update the contact
    const { data, error } = await supabase
      .from('customer_contacts')
      .update({
        name: body.name,
        role: body.role,
        email: body.email,
        phone: body.phone,
        updated: new Date().toISOString()
      })
      .eq('id', contactId)
      .select();

    if (error) {
      console.error('Error updating customer contact:', error);
      return NextResponse.json(
        { error: 'Failed to update customer contact' },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error in customer contact update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
