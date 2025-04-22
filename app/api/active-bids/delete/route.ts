import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Soft delete multiple active bids that have been archived
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bid IDs provided for deletion' },
        { status: 400 }
      );
    }
    
    const { data: bidsToDelete, error: fetchError } = await supabase
      .from('bid_estimates')
      .select('*')
      .in('id', ids)
      .or('status.eq.Archived,status.ilike.%archived%');
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bids for deletion', error: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!bidsToDelete || bidsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No archived bids found with the provided IDs' },
        { status: 404 }
      );
    }
    
    const { error: updateError } = await supabase
      .from('bid_estimates')
      .update({
        deleted_at: new Date().toISOString()
      })
      .in('id', ids)
      .or('status.eq.Archived,status.ilike.%archived%');
      
    if (updateError) {
      console.error('Error during bid deletion:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete bids', error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${bidsToDelete.length} bid(s)`,
      count: bidsToDelete.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
