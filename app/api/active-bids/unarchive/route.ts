import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Unarchive multiple active bids
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bid IDs provided for unarchiving' },
        { status: 400 }
      );
    }

    const { data: updatedBids, error: updateError } = await supabase
      .from('bid_estimates')
      .update({ archived: false })
      .in('id', ids)
      .select();

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to unarchive bids', error: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedBids || updatedBids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bids found with the provided IDs' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unarchived ${updatedBids.length} bid(s)`,
      count: updatedBids.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);

    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
} 