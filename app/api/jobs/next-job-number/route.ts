import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET endpoint to calculate the next available job number
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const division = url.searchParams.get('division') || 'PUBLIC';
    
    const ownerTypeMap: Record<string, string> = {
      'PUBLIC': '22',
      'PRIVATE': '21'
    };
    const ownerTypeCode = ownerTypeMap[division] || '22';
    
    const branchCode = '10';
    const currentYear = new Date().getFullYear();
    
    const { data: highestSequential, error } = await supabase
      .from('job_numbers')
      .select('sequential_number')
      .eq('branch_code', branchCode)
      .eq('owner_type', ownerTypeCode)
      .eq('year', currentYear)
      .order('sequential_number', { ascending: false })
      .limit(1);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to calculate next job number', details: error },
        { status: 500 }
      );
    }
    
    // Calculate the next sequential number
    let nextSequentialNumber = 1;
    if (highestSequential && highestSequential.length > 0) {
      nextSequentialNumber = highestSequential[0].sequential_number + 1;
    }
    
    const nextJobNumber = `${branchCode}-${ownerTypeCode}-${currentYear}${nextSequentialNumber.toString().padStart(3, '0')}`;
    
    return NextResponse.json({
      nextJobNumber,
      branchCode,
      ownerTypeCode,
      year: currentYear,
      sequentialNumber: nextSequentialNumber
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected error calculating next job number' },
      { status: 500 }
    );
  }
}
