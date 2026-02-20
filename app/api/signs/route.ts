import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch signs data - try multiple possible table names
    let signsData: any[] = [];
    let signsError: any = null;

    // Try signs_all first
    const signsResult = await supabase
      .from('signs_all')
      .select('id, designation, description, category, sizes, sheeting, kits, created_at, image_url, image_uploaded_at')
      .order('designation');

    if (signsResult.error) {
      console.warn('signs_all table not found, trying signs table');
      // Try signs table
      const signsFallback = await supabase
        .from('signs')
        .select('id, designation, description, category, sizes, sheeting, kits, created_at, image_url, image_uploaded_at')
        .order('designation');

      signsData = signsFallback.data || [];
      signsError = signsFallback.error;
    } else {
      signsData = signsResult.data || [];
      signsError = signsResult.error;
    }

    if (signsError) {
      console.error('Error fetching signs:', signsError);
      // Continue without signs data for now
      signsData = [];
    }

    // PATA kits + contents
    const { data: pataKitsData, error: pataErr } = await supabase
      .from('pata_kits')
      .select(`
        id, code, description, image_url, finished, reviewed, has_variants,
        pata_kit_contents!pata_kit_code (
          sign_designation,
          quantity,
          blight_quantity
        )
      `)
      .order('code');

    if (pataKitsError) {
      console.error('❌ Error fetching PATA kits:', pataKitsError);
    } else {
      console.log(`✅ Fetched ${pataKitsData?.length || 0} PATA kits`);
      console.log('📊 PATA kits raw data:', JSON.stringify(pataKitsData, null, 2));
    }

    // Fetch PATA kit variants
    const { data: pataVariantsData, error: pataVariantsError } = await supabase
      .from('kit_variants')
      .select(`
        id, kit_id, variant_label, description, finished, blights
      `)
      .order('variant_label');

    if (pataVariantsError) {
      console.error('Error fetching PATA variants:', pataVariantsError);
    }

    // PTS kits + contents
    const { data: ptsKitsData, error: ptsErr } = await supabase
      .from('pts_kits')
      .select(`
        id, code, description, image_url, finished, reviewed, has_variants,
        pts_kit_contents!pts_kit_code (
          sign_designation,
          quantity
        )
      `)
      .order('code');

    if (ptsKitsError) {
      console.error('❌ Error fetching PTS kits:', ptsKitsError);
    } else {
      console.log(`✅ Fetched ${ptsKitsData?.length || 0} PTS kits`);
      console.log('📊 PTS kits raw data:', JSON.stringify(ptsKitsData, null, 2));
    }

    // Fetch PTS kit variants
    const { data: ptsVariantsData, error: ptsVariantsError } = await supabase
      .from('kit_variants')
      .select(`
        id, kit_id, variant_label, description, finished, blights
      `)
      .order('variant_label');

    if (ptsVariantsError) {
      console.error('Error fetching PTS variants:', ptsVariantsError);
    }

    // Transform signs data to match expected frontend format
    const signsMap = new Map();

    signsData?.forEach(sign => {
      // Parse sizes array like ["48 x 8", "72 x 12"] into dimension objects
      const dimensions = sign.sizes?.map((sizeStr: string) => {
        const [widthStr, heightStr] = sizeStr.split(' x ');
        const width = parseFloat(widthStr);
        const height = parseFloat(heightStr);
        return !isNaN(width) && !isNaN(height) ? { width, height } : null;
      }).filter(dim => dim !== null) || [];

      // Group by designation
      if (!signsMap.has(sign.designation)) {
        signsMap.set(sign.designation, {
          designation: sign.designation,
          description: sign.description,
          sheeting: sign.sheeting,
          image_url: sign.image_url,
          dimensions: []
        });
      }

      // Add dimensions to the sign
      const signEntry = signsMap.get(sign.designation);
      signEntry.dimensions.push(...dimensions);

      // If no valid dimensions, add default
      if (dimensions.length === 0 && signEntry.dimensions.length === 0) {
        signEntry.dimensions.push({ width: 0, height: 0 });
      }
    });

    const signs = Array.from(signsMap.values());

    // Create variant maps for easy lookup
    const pataVariantsMap = new Map();
    const ptsVariantsMap = new Map();

    pataVariantsData?.forEach(variant => {
      if (!pataVariantsMap.has(variant.kit_id)) {
        pataVariantsMap.set(variant.kit_id, []);
      }
      pataVariantsMap.get(variant.kit_id).push({
        id: variant.id,
        label: variant.variant_label,
        description: variant.description,
        finished: variant.finished,
        blights: variant.blights
      });
    });

    ptsVariantsData?.forEach(variant => {
      if (!ptsVariantsMap.has(variant.kit_id)) {
        ptsVariantsMap.set(variant.kit_id, []);
      }
      ptsVariantsMap.get(variant.kit_id).push({
        id: variant.id,
        label: variant.variant_label,
        description: variant.description,
        finished: variant.finished,
        blights: variant.blights
      });
    });

    // Transform PATA kits data
    const pataKits = pataKitsData?.map(kit => ({
      id: kit.id,
      code: kit.code,
      description: kit.description,
      image_url: kit.image_url,
      has_variants: kit.has_variants,
      variants: pataVariantsMap.get(kit.id) || [],
      contents: kit.pata_kit_contents || [],
      signCount: kit.pata_kit_contents?.length || 0
    })) || [];

    // Transform PTS kits data
    const ptsKits = ptsKitsData?.map(kit => ({
      id: kit.id,
      code: kit.code,
      description: kit.description,
      image_url: kit.image_url,
      has_variants: kit.has_variants,
      variants: ptsVariantsMap.get(kit.id) || [],
      contents: kit.pts_kit_contents || [],
      signCount: kit.pts_kit_contents?.length || 0
    })) || [];

    console.log('🎯 Final transformed data:');
    console.log(`   Signs: ${signs.length}`);
    console.log(`   PATA kits: ${pataKits.length} (with contents: ${pataKits.filter(k => k.contents.length > 0).length})`);
    console.log(`   PTS kits: ${ptsKits.length} (with contents: ${ptsKits.filter(k => k.contents.length > 0).length})`);

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
