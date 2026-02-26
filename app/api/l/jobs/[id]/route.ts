import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Job, JobFromDB, JobProjectInfo } from '@/types/job';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('jobs_l')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Transform the database job into the expected format
    const job: Job = data;

    const projectInfo: JobProjectInfo = {
      projectName: job.project_name,
      etcJobNumber: job.etc_job_number,
      customerName: job.customer_name,
      customerJobNumber: job.customer_job_number,
      customerPM: job.customer_pm,
      customerPMEmail: job.customer_pm_email,
      customerPMPhone: job.customer_pm_phone,
      projectOwner: job.project_owner,
      contractNumber: job.contract_number,
      county: job.county,
      projectStartDate: job.project_start_date,
      projectEndDate: job.project_end_date,
      extensionDate: job.extension_date,
      otherNotes: job.additional_notes,
    };

    const jobFromDB: JobFromDB = {
      projectInfo,
      ...job,
    };

    return NextResponse.json(jobFromDB);
  } catch (error) {
    console.error('Error in jobs API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}