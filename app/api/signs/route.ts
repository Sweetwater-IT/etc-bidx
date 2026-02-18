import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('signs_all')
      .select('id, designation, description, category, sizes, sheeting, kits, created_at, image_url, image_uploaded_at')
      .order('designation');

    if (error) {
      console.error('Error fetching signs:', error);
      return NextResponse.json(
        { success: false, message: `Failed to fetch signs`, error: error.message },
        { status: 500 }
      );
    }

    // Transform new table format to match expected frontend format
    const finalData: any[] = [];

    data?.forEach(sign => {
      // Parse sizes array like ["48 x 8", "72 x 12"] into dimension objects
      const dimensions = sign.sizes?.map((sizeStr: string) => {
        const [widthStr, heightStr] = sizeStr.split(' x ');
        const width = parseFloat(widthStr);
        const height = parseFloat(heightStr);
        return !isNaN(width) && !isNaN(height) ? { width, height } : null;
      }).filter(dim => dim !== null) || [];

      // Create one entry per dimension
      dimensions.forEach(dimension => {
        finalData.push({
          sign_designations: {
            designation: sign.designation,
            description: sign.description,
            sheeting: sign.sheeting,
            image_url: sign.image_url
          },
          sign_dimensions: dimension
        });
      });

      // If no valid dimensions, create one entry with default dimensions
      if (dimensions.length === 0) {
        finalData.push({
          sign_designations: {
            designation: sign.designation,
            description: sign.description,
            sheeting: sign.sheeting,
            image_url: sign.image_url
          },
          sign_dimensions: { width: 0, height: 0 }
        });
      }
    });

    return NextResponse.json({ success: true, data: finalData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
