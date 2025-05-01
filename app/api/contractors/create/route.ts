import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      address,
      url,
      city,
      state,
      zip,
      phone,
      customerNumber
    } = await request.json();

    const { data, error } = await supabase
      .from('contractors')
      .insert({
        name,
        address,
        web: url,
        city,
        state,
        zip,
        main_phone: phone,
        customer_number: customerNumber ? parseInt(customerNumber) : null,
        active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contractor:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create contractor', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contractor created successfully',
      data 
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
} 