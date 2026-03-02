import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement for dynamic routes)
    const { id: takeoffId } = await context.params;

    if (!takeoffId) {
      return NextResponse.json(
        { error: 'Takeoff ID is required' },
        { status: 400 }
      );
    }

    // Fetch takeoff
    const { data: takeoff, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .select('id, title, work_type, job_id, status, install_date, pickup_date')
      .eq('id', takeoffId)
      .single();

    if (takeoffError || !takeoff) {
      console.error('Takeoff fetch error:', takeoffError);
      return NextResponse.json(
        { error: 'Takeoff not found' },
        { status: 404 }
      );
    }

    // Fetch job (optional – continue even if fails)
    let job = null;
    if (takeoff.job_id) {
      const { data, error: jobError } = await supabase
        .from('jobs_l')
        .select(
          'id, project_name, etc_job_number, etc_branch, customer_name, ' +
          'customer_pm, customer_pm_phone, customer_job_number, county, ' +
          'contract_number, project_owner, etc_project_manager'
        )
        .eq('id', takeoff.job_id)
        .single();

      if (!jobError) {
        job = data;
      } else {
        console.error('Job fetch error:', jobError);
      }
    }

    return NextResponse.json({
      takeoff,
      job,
    });
  } catch (error) {
    console.error('Unexpected error in takeoffs/[id] route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
