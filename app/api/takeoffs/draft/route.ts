import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing required field: jobId' },
        { status: 400 }
      );
    }

    // Verify the job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs_l')
      .select('id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Create draft takeoff with minimal data
    const { data: takeoff, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .insert({
        job_id: jobId,
        title: '', // Empty title, user provides placeholder
        status: 'draft',
        contracted_or_additional: 'contracted',
        priority: 'standard',
        active_sections: [],
        sign_rows: {},
        default_sign_material: 'PLASTIC',
      })
      .select()
      .single();

    if (takeoffError) {
      console.error('Error creating draft takeoff:', takeoffError);
      return NextResponse.json(
        { error: 'Failed to create draft takeoff' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      takeoff,
    });

  } catch (error) {
    console.error('Unexpected error in draft takeoff creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}