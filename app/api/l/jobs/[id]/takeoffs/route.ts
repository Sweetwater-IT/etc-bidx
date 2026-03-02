import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('takeoffs_l')
      .select(`
        id,
        title,
        work_type,
        status,
        created_at,
        install_date,
        pickup_date,
        needed_by_date,
        work_order_number
      `)
      .eq('job_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching takeoffs:', error);
      return NextResponse.json({ error: 'Failed to fetch takeoffs' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}