import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Archive multiple active jobs
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
  
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No job numbers provided for archiving' },
        { status: 400 }
      );
    }
    
    // Update the status field of the jobs to 'Archived'
    const { data: updatedJobs, error: updateError } = await supabase
      .from('jobs')
      .update({ archived: true })
      .in('id', ids)
      .select();
    
    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to archive jobs', error: updateError.message },
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
      message: `Successfully archived ${updatedJobs.length} job(s)`,
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

export async function DELETE(request: NextRequest) {
    try {
      const { ids } = await request.json();
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No job numbers provided for deleting' },
          { status: 400 }
        );
      }
      
      // Update the status field of the jobs to 'Archived'
      const { data: updatedJobs, error: updateError } = await supabase
        .from('jobs')
        .update({deleted: true})
        .in('id', ids)
        .select();
      
      if (updateError) {
        console.error(updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to delete jobs', error: updateError.message },
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
        message: `Successfully archived ${updatedJobs.length} job(s)`,
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