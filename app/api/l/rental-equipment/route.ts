import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('rental_equipment_l')
      .select('*')
      .order('equipment_number', { ascending: true });

    if (error) {
      console.error('Error fetching rental equipment:', error);
      return NextResponse.json({ error: 'Failed to fetch rental equipment' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in rental equipment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}