import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Soft delete multiple available jobs that have been archived
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No job IDs provided for deletion' },
        { status: 400 }
      );
    }
    
    const { data: jobsToDelete, error: fetchError } = await supabase
      .from('archived_available_jobs')
      .select('*')
      .in('id', ids);
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch jobs for deletion', error: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!jobsToDelete || jobsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No archived jobs found with the provided IDs' },
        { status: 404 }
      );
    }
    
    const { error: updateError } = await supabase
      .from('archived_available_jobs')
      .update({
        deleted_at: new Date().toISOString()
      })
      .in('id', ids);
      
    if (updateError) {
      console.error('Error during job deletion:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete jobs', error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${jobsToDelete.length} job(s)`,
      count: jobsToDelete.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
