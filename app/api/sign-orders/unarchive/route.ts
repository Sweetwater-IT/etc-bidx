import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Unarchive multiple sign orders
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No sign order IDs provided for unarchiving' },
        { status: 400 }
      );
    }

    const { data: updatedOrders, error: updateError } = await supabase
      .from('sign_orders')
      .update({ archived: false })
      .in('id', ids)
      .select();

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to unarchive sign orders', error: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No sign orders found with the provided IDs' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unarchived ${updatedOrders.length} sign order(s)` ,
      count: updatedOrders.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);

    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
} 