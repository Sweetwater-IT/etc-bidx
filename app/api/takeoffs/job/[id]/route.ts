import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement for dynamic routes)
    const { id: jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Fetch takeoffs for the job
    const { data: takeoffs, error: takeoffsError } = await supabase
      .from('takeoffs_l')
      .select('id, title, work_type, job_id, status, install_date, pickup_date, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (takeoffsError) {
      console.error('Error fetching takeoffs:', takeoffsError);
      return NextResponse.json(
        { error: 'Failed to fetch takeoffs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      takeoffs: takeoffs || []
    });
  } catch (error) {
    console.error('Unexpected error in takeoffs/job/[id] route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}