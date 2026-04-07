import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('rental_reservations_l')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rental reservations:', error);
      return NextResponse.json({ error: 'Failed to fetch rental reservations' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in rental reservations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}