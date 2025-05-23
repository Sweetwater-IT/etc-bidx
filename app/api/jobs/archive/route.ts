import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: Archive multiple available jobs
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No job IDs provided for archiving' },
        { status: 400 }
      );
    }
    
    // First, fetch the jobs to be archived
    const { data: jobsToArchive, error: fetchError } = await supabase
      .from('available_jobs')
      .select('*')
      .in('id', ids);
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch jobs for archiving', error: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!jobsToArchive || jobsToArchive.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No jobs found with the provided IDs' },
        { status: 404 }
      );
    }
    
    const { data: archiveColumns, error: columnsError } = await supabase
      .from('archived_available_jobs')
      .select('*')
      .limit(1);
      
    if (columnsError) {
      console.error('Error fetching archive table columns:', columnsError);
      return NextResponse.json(
        { success: false, message: 'Failed to determine archive table schema', error: columnsError.message },
        { status: 500 }
      );
    }
    
    const archiveColumnNames = archiveColumns && archiveColumns.length > 0 
      ? Object.keys(archiveColumns[0]) 
      : [];
          
    // Insert into archived_available_jobs
    const { error: insertError } = await supabase
      .from('archived_available_jobs')
      .insert(jobsToArchive.map(job => {
        const { id, ...jobWithoutId } = job;
        
        const filteredJob: Record<string, any> = {};
        
        filteredJob.original_id = id;
        filteredJob.archived_at = new Date().toISOString();
        
        Object.keys(jobWithoutId).forEach(key => {
          if (archiveColumnNames.includes(key)) {
            filteredJob[key] = jobWithoutId[key];
          } else {
            console.log(`Skipping field not in archive table schema: ${key}`);
          }
        });
        
        return filteredJob;
      }));
    
    if (insertError) {
      return NextResponse.json(
        { success: false, message: 'Failed to archive jobs', error: insertError.message },
        { status: 500 }
      );
    }
    
    // Delete from available_jobs
    const { error: deleteError } = await supabase
      .from('available_jobs')
      .delete()
      .in('id', ids);
    
    if (deleteError) {
      return NextResponse.json(
        { success: false, message: 'Failed to remove jobs after archiving', error: deleteError.message },
        { status: 500 }
      );
    }
    
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully archived ${jobsToArchive.length} job(s)`,
      count: jobsToArchive.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
