import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch signs data
    const { data: signsData, error: signsError } = await supabase
      .from('signs_all')
      .select('id, designation, description, category, sizes, sheeting, kits, created_at, image_url, image_uploaded_at')
      .order('designation');

    if (signsError) {
      console.error('Error fetching signs:', signsError);
      return NextResponse.json(
        { success: false, message: `Failed to fetch signs`, error: signsError.message },
        { status: 500 }
      );
    }

    // Fetch PATA kits with their contents
    const { data: pataKitsData, error: pataKitsError } = await supabase
      .from('pata_kits')
      .select(`
        id, code, description, image_url, finished, reviewed,
        pata_kit_contents (
          sign_designation,
          quantity,
          blight_quantity
        )
      `)
      .eq('finished', true)
      .eq('reviewed', true)
      .order('code');

    if (pataKitsError) {
      console.error('Error fetching PATA kits:', pataKitsError);
    }

    // Fetch PTS kits with their contents
    const { data: ptsKitsData, error: ptsKitsError } = await supabase
      .from('pts_kits')
      .select(`
        id, code, description, image_url, finished, reviewed,
        pts_kit_contents (
          sign_designation,
          quantity
        )
      `)
      .eq('finished', true)
      .eq('reviewed', true)
      .order('code');

    if (ptsKitsError) {
      console.error('Error fetching PTS kits:', ptsKitsError);
    }

    // Transform signs data to match expected frontend format
    const signs: any[] = [];

    signsData?.forEach(sign => {
      // Parse sizes array like ["48 x 8", "72 x 12"] into dimension objects
      const dimensions = sign.sizes?.map((sizeStr: string) => {
        const [widthStr, heightStr] = sizeStr.split(' x ');
        const width = parseFloat(widthStr);
        const height = parseFloat(heightStr);
        return !isNaN(width) && !isNaN(height) ? { width, height } : null;
      }).filter(dim => dim !== null) || [];

      // Create one entry per dimension
      dimensions.forEach(dimension => {
        signs.push({
          designation: sign.designation,
          description: sign.description,
          sheeting: sign.sheeting,
          image_url: sign.image_url,
          sign_designations: {
            designation: sign.designation,
            description: sign.description,
            sheeting: sign.sheeting
          },
          sign_dimensions: dimension
        });
      });

      // If no valid dimensions, create one entry with default dimensions
      if (dimensions.length === 0) {
        signs.push({
          designation: sign.designation,
          description: sign.description,
          sheeting: sign.sheeting,
          image_url: sign.image_url,
          sign_designations: {
            designation: sign.designation,
            description: sign.description,
            sheeting: sign.sheeting
          },
          sign_dimensions: { width: 0, height: 0 }
        });
      }
    });

    // Transform PATA kits data
    const pataKits = pataKitsData?.map(kit => ({
      id: kit.id,
      code: kit.code,
      description: kit.description,
      image_url: kit.image_url,
      contents: kit.pata_kit_contents || [],
      signCount: kit.pata_kit_contents?.length || 0
    })) || [];

    // Transform PTS kits data
    const ptsKits = ptsKitsData?.map(kit => ({
      id: kit.id,
      code: kit.code,
      description: kit.description,
      image_url: kit.image_url,
      contents: kit.pts_kit_contents || [],
      signCount: kit.pts_kit_contents?.length || 0
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        signs,
        pataKits,
        ptsKits
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
