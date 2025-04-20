import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all active bids with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const orderBy = searchParams.get('orderBy') || 'letting_date';
    const ascending = searchParams.get('ascending') === 'true';
    
    let query = supabase
      .from('bid_estimates')
      .select('*')
      .order(orderBy, { ascending });
    
    console.log('API received status filter:', status);
    
    if (status) {
      if (status === 'won-pending') {
        // For won-pending, we want to match both won and pending statuses
        query = query.or('status.ilike.%won%,status.ilike.%pending%');
        console.log('Using case-insensitive OR filter for won-pending');
      } else {
        console.log('Using case-insensitive filter for status:', status);
        query = query.ilike('status', `%${status}%`);
      }
    }
    
    query = query.limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch active bids', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

// POST: Create a new active bid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('bid_estimates')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to create active bid', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
