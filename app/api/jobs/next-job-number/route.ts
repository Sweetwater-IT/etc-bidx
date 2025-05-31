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
    
    // Get all job numbers that contain the current year to find the highest sequential number
    // This follows the same logic as the POST route
    const { data: existingJobNumbers, error: sequentialError } = await supabase
      .from('job_numbers')
      .select('job_number')
      .like('job_number', `%-${currentYear}%`)
      .not('job_number', 'like', 'P-%'); // Exclude pending job numbers
    
    if (sequentialError) {
      console.error('Error finding existing job numbers:', sequentialError);
      return NextResponse.json(
        { error: 'Failed to generate job number', details: sequentialError.message },
        { status: 500 }
      );
    }
    
    // Calculate the next sequential number by parsing existing job numbers
    // This is the same logic as in the POST route
    let nextSequentialNumber = 1;
    if (existingJobNumbers && existingJobNumbers.length > 0) {
      const sequentialNumbers: number[] = [];
      
      existingJobNumbers.forEach(jobNumberRecord => {
        if (jobNumberRecord.job_number) {
          const parts = jobNumberRecord.job_number.split('-');
          if (parts.length === 3) {
            const yearAndSequential = parts[2]; // e.g., "2025121"
            const yearString = currentYear.toString(); // "2025"
            
            if (yearAndSequential.startsWith(yearString)) {
              const sequentialPart = yearAndSequential.slice(yearString.length); // "121"
              const sequentialNum = parseInt(sequentialPart, 10);
              
              if (!isNaN(sequentialNum)) {
                sequentialNumbers.push(sequentialNum);
              }
            }
          }
        }
      });
      
      if (sequentialNumbers.length > 0) {
        const maxSequential = Math.max(...sequentialNumbers);
        nextSequentialNumber = maxSequential + 1;
      }
    }
    
    // Generate the next job number using the same format as POST route
    const nextJobNumber = `${branchCode}-${ownerTypeCode}-${currentYear}${nextSequentialNumber.toString().padStart(3, '0')}`;
    
    return NextResponse.json({
      nextJobNumber,
      branchCode,
      ownerTypeCode,
      year: currentYear,
      sequentialNumber: nextSequentialNumber
    });
  } catch (error) {
    console.error('Error calculating next job number:', error);
    return NextResponse.json(
      { error: 'Unexpected error calculating next job number' },
      { status: 500 }
    );
  }
}