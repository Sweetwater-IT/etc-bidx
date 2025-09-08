import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    console.log(`Fetching sign order with ID: ${params.id}`);

    if (!params.id) {
      return NextResponse.json(
        { success: false, message: 'Sign order ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sign_orders')
      .select('*, contractors(*), customer_contacts(*)')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching sign order:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch sign order', error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Sign order not found' },
        { status: 404 }
      );
    }

    const transformedData = {
      ...data,
      signs: data.signs.map((sign) => ({ ...sign, associatedStructure: sign.associated_structure })),
      contact: data.customer_contacts ? {
        id: data.customer_contacts.id,
        name: data.customer_contacts.name || '',
        role: data.customer_contacts.role || '',
        email: data.customer_contacts.email || '',
        phone: data.customer_contacts.phone || ''
      } : undefined
    };

    return NextResponse.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Unexpected error fetching sign order:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred', error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    console.log(`Updating sign order with ID: ${params.id}`);

    if (!params.id) {
      return NextResponse.json(
        { success: false, message: 'Sign order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update the sign order
    const { data, error } = await supabase
      .from('sign_orders')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sign order:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update sign order', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Unexpected error updating sign order:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    console.log(`Deleting sign order with ID: ${params.id}`);

    if (!params.id) {
      return NextResponse.json(
        { success: false, message: 'Sign order ID is required' },
        { status: 400 }
      );
    }

    // Delete the sign order
    const { error } = await supabase
      .from('sign_orders')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting sign order:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete sign order', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sign order deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error deleting sign order:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred', error: String(error) },
      { status: 500 }
    );
  }
}
