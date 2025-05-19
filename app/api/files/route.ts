import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Get job_id from the query parameters
    const searchParams = req.nextUrl.searchParams;
    const jobId = searchParams.get('job_id');
    
    // Validate job_id
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { status: 400 }
      );
    }
    
    // Query the database for all files associated with the job_id
    const { data, error } = await supabase
      .from('files')
      .select(`
        id,
        filename,
        file_type,
        upload_date,
        file_data,
        job_id,
        file_size,
        contract_number
      `)
      .eq('job_id', parseInt(jobId))
      .order('upload_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json(
        { error: 'Failed to fetch files', details: error.message },
        { status: 500 }
      );
    }
    
    // Return the files data
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error || String(error) },
      { status: 500 }
    );
  }
}