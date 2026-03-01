import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { jobId, title, workType, notes } = await request.json();

    if (!jobId || !title || !workType) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, title, workType' },
        { status: 400 }
      );
    }

    // Verify the job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Create the takeoff
    const { data: takeoff, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .insert({
        job_id: jobId,
        title: title.trim(),
        work_type: workType,
        notes: notes?.trim() || null,
        status: 'draft',
      })
      .select()
      .single();

    if (takeoffError) {
      console.error('Error creating takeoff:', takeoffError);
      return NextResponse.json(
        { error: 'Failed to create takeoff' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      takeoff,
    });

  } catch (error) {
    console.error('Unexpected error in takeoff creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}