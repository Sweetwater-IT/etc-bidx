import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Create a new MPT rental record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.estimate_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: estimate_id' },
        { status: 400 }
      );
    }
    
    // Ensure numeric fields have valid values
    const numericFields = [
      'target_moic', 'payback_period', 'annual_utilization',
      'dispatch_fee', 'mpg_per_truck', 'revenue', 'cost',
      'gross_profit', 'hours'
    ];
    
    numericFields.forEach(field => {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        body[field] = 0;
      }
    });
    
    // Insert the MPT rental record
    const { data, error } = await supabase
      .from('estimate_mpt_rental')
      .insert({
        estimate_id: body.estimate_id,
        target_moic: body.target_moic || 0,
        payback_period: body.payback_period || 0,
        annual_utilization: body.annual_utilization || 0,
        dispatch_fee: body.dispatch_fee || 0,
        mpg_per_truck: body.mpg_per_truck || 0,
        revenue: body.revenue || 0,
        cost: body.cost || 0,
        gross_profit: body.gross_profit || 0,
        hours: body.hours || 0,
        static_equipment_info: body.static_equipment_info || null
      })
      .select()
      .single();
    
    if (error) {
      // Check if it's a unique constraint violation (estimate_id already exists)
      if (error.code === '23505') {
        // Update existing record instead
        const { data: updatedData, error: updateError } = await supabase
          .from('estimate_mpt_rental')
          .update({
            target_moic: body.target_moic || 0,
            payback_period: body.payback_period || 0,
            annual_utilization: body.annual_utilization || 0,
            dispatch_fee: body.dispatch_fee || 0,
            mpg_per_truck: body.mpg_per_truck || 0,
            revenue: body.revenue || 0,
            cost: body.cost || 0,
            gross_profit: body.gross_profit || 0,
            hours: body.hours || 0,
            static_equipment_info: body.static_equipment_info || null
          })
          .eq('estimate_id', body.estimate_id)
          .select()
          .single();
        
        if (updateError) {
          return NextResponse.json(
            { success: false, message: 'Failed to update MPT rental record', error: updateError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ success: true, data: updatedData });
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to create MPT rental record', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

// GET: Fetch MPT rental record by estimate_id
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const estimateId = searchParams.get('estimate_id');
    
    if (!estimateId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameter: estimate_id' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('estimate_mpt_rental')
      .select('*')
      .eq('estimate_id', estimateId)
      .single();
    
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch MPT rental record', error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
