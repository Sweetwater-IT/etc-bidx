import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.contractor_id) {
      return NextResponse.json(
        { error: 'Customer ID (contractor_id) is required' },
        { status: 400 }
      );
    }

    // Create new contact
    const { data, error } = await supabase
      .from('customer_contacts')
      .insert({
        contractor_id: body.contractor_id,
        name: body.name || null,
        role: body.role || null,
        email: body.email || null,
        phone: body.phone || null,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        is_deleted: false
      })
      .select();

    if (error) {
      console.error('Error creating customer contact:', error);
      return NextResponse.json(
        { error: 'Failed to create customer contact' },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error in customer contact creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
