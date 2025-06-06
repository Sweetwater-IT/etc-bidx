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
   
    if (error) {
      console.error(error)
      return NextResponse.json(
        { success: false, message: `Failed to fetch signs`, error: error.message },
        { status: 500 }
      );
    }

    const sortedData = data
      ?.filter(obj => !!(obj.sign_designations as any).designation)
      ?.sort((a, b) => (a.sign_designations as any).designation.localeCompare((b.sign_designations as any).designation))

    return NextResponse.json({ success: true, data: sortedData })
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}