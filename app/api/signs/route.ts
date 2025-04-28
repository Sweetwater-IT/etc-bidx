import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch sign designations and dimensions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const designationId = searchParams.get('designationId');
    
    // Case 1: Fetch just the sign designations list
    if (type === 'designations') {
      // Get the sign designations without dimensions
      let designationsQuery = supabase
        .from('sign_designations')
        .select(`
          id, 
          designation, 
          description
        `)
        .order('designation');
      
      // If search term is provided, filter by designation
      if (search) {
        designationsQuery = designationsQuery.ilike('designation', `%${search}%`);
      } else {
        // If no search term, limit to first 50
        designationsQuery = designationsQuery.limit(50);
      }
      
      const { data: designationsData, error: designationsError } = await designationsQuery;
        
      if (designationsError) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch sign designations', error: designationsError.message },
          { status: 500 }
        );
      }
      
      // Transform to the expected format (without dimensions)
      const result = designationsData.map(designation => ({
        id: designation.id,
        value: designation.designation,
        label: designation.designation,
        description: designation.description
      }));
      
      return NextResponse.json({ success: true, data: result });
    }
    
    // Case 2: Fetch dimensions for a specific designation
    else if (type === 'dimensions' && designationId) {
      // Get dimension options for this designation
      const { data: dimensionOptions, error: dimensionError } = await supabase
        .from('sign_dimension_options')
        .select(`
          dimension_id,
          sign_dimensions!inner(id, width, height)
        `)
        .eq('sign_designation_id', designationId);
      
      if (dimensionError) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch dimensions', error: dimensionError.message },
          { status: 500 }
        );
      }
      
      // Format dimensions
      const dimensions = dimensionOptions.map(option => {
        // Get the dimension data
        const dimension = option.sign_dimensions as unknown as {
          id: number;
          width: number;
          height: number;
        };
        
        return {
          id: option.dimension_id,
          value: `${dimension.width} x ${dimension.height} in`, // Assuming inches
          width: dimension.width,
          height: dimension.height,
          unit: 'in' // Default unit
        };
      });
      
      return NextResponse.json({ success: true, data: dimensions });
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid request type' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
