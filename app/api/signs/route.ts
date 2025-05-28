import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch sign designations and dimensions
export async function GET() {
  try {

    const { data, error } = await supabase.
      from('sign_dimension_options').
      select(`
        sign_designations (designation, description, sheeting),
        sign_dimensions (width, height)
      `)
      .order('sign_designations(designation)')

    if (error) {
      console.error(error)
      return NextResponse.json(
        { success: false, message: `Failed to fetch signs`, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
