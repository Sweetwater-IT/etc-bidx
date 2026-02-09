import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let allData: any[] = [];

    while (true) {
      const { data, error } = await supabase
        .from('sign_dimension_options')
        .select(
          `
          sign_designations (designation, description, sheeting),
          sign_dimensions (width, height)
        `
        )
        .range(from, to);

      if (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json(
          { success: false, message: `Failed to fetch signs`, error: error.message },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) break;

      allData = [...allData, ...data];

      if (data.length < pageSize) break;

      from += pageSize;
      to += pageSize;
    }

    const sortedData = allData
      ?.filter(obj => !!(obj.sign_designations as any).designation)
      ?.sort((a, b) =>
        (a.sign_designations as any).designation.localeCompare(
          (b.sign_designations as any).designation
        )
      );

    return NextResponse.json({ success: true, data: sortedData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
