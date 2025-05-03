import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST endpoint to check if a job number is available
export async function POST(request: NextRequest) {
  try {
    const { branchCode, ownerTypeCode, year, sequentialNumber } = await request.json();
    
    // Check if the job number already exists
    const { data, error } = await supabase
      .from('job_numbers')
      .select('*')
      .eq('branch_code', branchCode)
      .eq('owner_type', ownerTypeCode)
      .eq('year', year)
      .eq('sequential_number', sequentialNumber)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      return NextResponse.json(
        { error: 'Failed to check job number', details: error },
        { status: 500 }
      );
    }
    
    // If data exists, the job number is already taken
    const isAvailable = !data;
    
    return NextResponse.json({
      isAvailable,
      message: isAvailable ? 'Job number is available' : 'Job number is already taken'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected error checking job number' },
      { status: 500 }
    );
  }
}
