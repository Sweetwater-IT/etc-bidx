import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch contract numbers and branches from bid_estimates table
    const { data: estimates, error: estimatesError } = await supabase
      .from('estimate_complete')
      .select("admin_data")
      .order('created_at', { ascending: true });

    if (estimatesError) {
      console.error('Error fetching estimates:', estimatesError);
      return NextResponse.json({ error: estimatesError.message }, { status: 500 });
    }

    // Fetch job numbers from jobs table
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs_complete')
      .select('job_number, branch_code')
      .order('created_at', { ascending: true });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    // Add placeholder branch data for jobs since the table needs modification
    const jobsWithBranch = jobs?.map(job => ({
      job_number: job.job_number,
      branch: job.branch_code === '10' ? 'Hatfield' : job.branch_code === '20' ? 'Turbotville' : 'Bedford'
    })) || [];

    const estimatesWithBranch = estimates?.map(estimate => ({
      contract_number: estimate.admin_data.contractNumber,
      branch: estimate.admin_data.county.branch
    }))

    return NextResponse.json({
      estimates: estimatesWithBranch || [],
      jobs: jobsWithBranch
    });
  } catch (error) {
    console.error('Error in estimate-job-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}