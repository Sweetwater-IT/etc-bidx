import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Archive multiple sign orders
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No sign order IDs provided for archiving' },
        { status: 400 }
      );
    }
    
    const { data: ordersToArchive, error: fetchError } = await supabase
      .from('sign_orders')
      .select('*')
      .in('id', ids);
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch sign orders for archiving', error: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!ordersToArchive || ordersToArchive.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No sign orders found with the provided IDs' },
        { status: 404 }
      );
    }
    
    // Update the archived field to true
    const { error: updateError } = await supabase
      .from('sign_orders')
      .update({
        archived: true
      })
      .in('id', ids);
    
    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to archive sign orders', error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully archived ${ordersToArchive.length} sign order(s)`,
      count: ordersToArchive.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete archived sign orders
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No sign order IDs provided for deletion' },
        { status: 400 }
      );
    }
    
    const { data: ordersToDelete, error: fetchError } = await supabase
      .from('sign_orders')
      .select('*')
      .in('id', ids)
      .eq('archived', true); // Only allow deletion of archived orders
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch sign orders for deletion', error: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!ordersToDelete || ordersToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No archived sign orders found with the provided IDs' },
        { status: 404 }
      );
    }
    
    // Mark as deleted instead of actually deleting
    const { error: updateError } = await supabase
      .from('sign_orders')
      .update({
        deleted: true
      })
      .in('id', ids);
    
    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete sign orders', error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${ordersToDelete.length} sign order(s)`,
      count: ordersToDelete.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}