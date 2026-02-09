import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Unarchive multiple available jobs
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
  
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No job IDs provided for unarchiving' },
        { status: 400 }
      );
    }
    
    // Fetch jobs from archived_available_jobs
    const { data: archivedJobs, error: fetchError } = await supabase
      .from('archived_available_jobs')
      .select('*')
      .in('id', ids);

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch archived jobs', error: fetchError.message },
        { status: 500 }
      );
    }

    if (!archivedJobs || archivedJobs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No archived jobs found with the provided IDs' },
        { status: 404 }
      );
    }

    // Fetch available_jobs columns
    const { data: availableColumnsData, error: columnsError } = await supabase
      .from('available_jobs')
      .select('*')
      .limit(1);

    if (columnsError) {
      return NextResponse.json(
        { success: false, message: 'Failed to determine available_jobs table schema', error: columnsError.message },
        { status: 500 }
      );
    }

    const availableJobColumns = availableColumnsData && availableColumnsData.length > 0
      ? Object.keys(availableColumnsData[0])
      : [];

    // Prepare jobs for insertion into available_jobs (restore original id, filter columns)
    const jobsToRestore = archivedJobs.map(({ original_id, archived_at, ...rest }) => {
      const filteredJob = { id: original_id };
      for (const key of Object.keys(rest)) {
        if (availableJobColumns.includes(key)) {
          filteredJob[key] = rest[key];
        }
      }
      return filteredJob;
    });

    // Insert into available_jobs
    const { error: insertError } = await supabase
      .from('available_jobs')
      .insert(jobsToRestore);

    if (insertError) {
      return NextResponse.json(
        { success: false, message: 'Failed to restore jobs to available_jobs', error: insertError.message },
        { status: 500 }
      );
    }

    // Delete from archived_available_jobs
    const { error: deleteError } = await supabase
      .from('archived_available_jobs')
      .delete()
      .in('id', ids);

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: 'Failed to remove jobs from archive', error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully unarchived ${archivedJobs.length} job(s)` ,
      count: archivedJobs.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
} 