import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Archive multiple active bids
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bid IDs provided for archiving' },
        { status: 400 }
      );
    }
    
    const { data: bidsToArchive, error: fetchError } = await supabase
      .from('bid_estimates')
      .select('*')
      .in('id', ids);
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bids for archiving', error: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!bidsToArchive || bidsToArchive.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bids found with the provided IDs' },
        { status: 404 }
      );
    }
    
    // Update the status to 'Archived' instead of moving to another table
    const { error: updateError } = await supabase
      .from('bid_estimates')
      .update({
        archived: true
      })
      .in('id', ids);
    
    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to archive bids', error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully archived ${bidsToArchive.length} bid(s)`,
      count: bidsToArchive.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bid IDs provided for archiving' },
        { status: 400 }
      );
    }
    
    const { data: bidsToArchive, error: fetchError } = await supabase
      .from('bid_estimates')
      .select('*')
      .in('id', ids);
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bids for archiving', error: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!bidsToArchive || bidsToArchive.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bids found with the provided IDs' },
        { status: 404 }
      );
    }
    
    // Update the status to 'Archived' instead of moving to another table
    const { error: updateError } = await supabase
      .from('bid_estimates')
      .update({
        deleted: true
      })
      .in('id', ids);
    
    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to archive bids', error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully archived ${bidsToArchive.length} bid(s)`,
      count: bidsToArchive.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
