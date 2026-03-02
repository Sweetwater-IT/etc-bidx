import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }   // ← correct: context object with params
) {
  try {
    const takeoffId = context.params.id;  // ← access via context.params.id
    if (!takeoffId) {
      return NextResponse.json(
        { error: 'Takeoff ID is required' },
        { status: 400 }
      );
    }

    const { data: takeoff, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .select('id, title, work_type, job_id, status, install_date, pickup_date')
      .eq('id', takeoffId)
      .single();

    if (takeoffError || !takeoff) {
      console.error('Error fetching takeoff:', takeoffError);
      return NextResponse.json(
        { error: 'Takeoff not found' },
        { status: 404 }
      );
    }

    // Fetch job data
    const { data: job, error: jobError } = await supabase
      .from('jobs_l')
      .select('id, project_name, etc_job_number, etc_branch, customer_name, customer_pm, customer_pm_phone, customer_job_number, county, contract_number, project_owner, etc_project_manager')
      .eq('id', takeoff.job_id)
      .single();

    if (jobError) {
      console.error('Error fetching job:', jobError);
      // Don't fail if job fetch fails
    }

    return NextResponse.json({
      takeoff,
      job: job || null
    });
  } catch (error) {
    console.error('Error in takeoff API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
