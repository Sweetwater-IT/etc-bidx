import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();
    const { id, signs, status, submitted_at, assigned_to } = body;
    
    console.log(`Submitting sign order with ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Sign order ID is required' },
        { status: 400 }
      );
    }

    // Filter out the assigned_to field from each sign item
    const filteredSigns = {};
    Object.keys(signs).forEach(key => {
      const sign = signs[key];
      // Create a new sign object without the assigned_to field
      const { assigned_to, ...filteredSign } = sign;
      filteredSigns[key] = filteredSign;
    });

    // Update the sign order in the database with all fields
    const { data, error } = await supabase
      .from('sign_orders')
      .update({
        signs: filteredSigns,
        status,
        assigned_to
        // submitted_at is still excluded as it doesn't exist in the database schema
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error submitting sign order:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to submit sign order', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Unexpected error submitting sign order:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred', error: String(error) },
      { status: 500 }
    );
  }
}
