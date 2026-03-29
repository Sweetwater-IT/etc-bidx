import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    // Check for existing draft takeoff for this job
    const { data: takeoff, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (takeoffError) {
      // If no draft takeoff exists, return 404
      if (takeoffError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No draft takeoff found' },
          { status: 404 }
        );
      }

      console.error('Error fetching draft takeoff:', takeoffError);
      return NextResponse.json(
        { error: 'Failed to fetch draft takeoff' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      takeoff,
    });

  } catch (error) {
    console.error('Unexpected error in draft takeoff fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}