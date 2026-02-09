import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No job IDs provided for archiving' },
        { status: 400 }
      );
    }

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

    const { error: updateError } = await supabase
      .from('available_jobs')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (updateError) {
      console.error('Error during archiving:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to archive jobs', error: updateError.message },
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
