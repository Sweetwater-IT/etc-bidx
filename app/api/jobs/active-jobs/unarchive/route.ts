import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Unarchive multiple active jobs
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
  
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No job numbers provided for unarchiving' },
        { status: 400 }
      );
    }
    
    // Update the archived field of the jobs to false
    const { data: updatedJobs, error: updateError } = await supabase
      .from('jobs')
      .update({ archived: false })
      .in('id', ids)
      .select();
    
    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to unarchive jobs', error: updateError.message },
        { status: 500 }
      );
    }
    
    // If no jobs were updated, they might not exist
    if (!updatedJobs || updatedJobs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No jobs found with the provided job numbers' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully unarchived ${updatedJobs.length} job(s)`,
      count: updatedJobs.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
} 