import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Fetch item numbers from Supabase
    const { data, error } = await supabase
      .from('bid_item_numbers')
      .select('*')
      .eq('is_custom', false);
    
    if (error) {
      console.error('Error fetching item numbers:', error);
      return NextResponse.json(
        { status: 500, error: 'Failed to fetch item numbers', details: error.message },
        { status: 500 }
      );
    }
    
    // Manually add flagging and sale items to the end
    const flaggingItem = {
      id: 9998,
      item_number: 'Flagging',
      description: 'Flagging Services',
      uom: 'HR',
      is_custom: false
    };
    
    const saleItem = {
      id: 9999,
      item_number: 'Sale Items',
      description: 'Equipment and Material Sales',
      uom: 'EACH',
      is_custom: false
    };
    
    // Add the special items to the data array
    const completeData = [...data, flaggingItem, saleItem];
    
    // Create response with the data
    const response = NextResponse.json({ 
      status: 200, 
      data: completeData 
    });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { status: 500, error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}