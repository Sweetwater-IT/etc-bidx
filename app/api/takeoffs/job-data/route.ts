import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch contract numbers and branches from bid_estimates table
    const { data, error } = await supabase
      .from('jobs')
      .select("id, estimate_id, job_numbers(job_number, branch_code), admin_data_entries(county, contract_number)")
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: mptData, error : mptError } = await supabase
    .from('estimate_complete')
    .select('id, mpt_rental')

    if (mptError) {
      console.error('Error fetching mpt data:', mptError);
      return NextResponse.json({ error: mptError.message }, { status: 500 });
    }

    const { data: projectMetadata, error: pmError} = await supabase
    .from('project_metadata')
    .select('job_id, contractors(name)')
    .not('job_id', 'is', null)

    if (pmError) {
      console.error('Error fetching contractors:', pmError);
      return NextResponse.json({ error: pmError.message }, { status: 500 });
    }


    // filter jobs without job numbers and without admin data entries
    const filteredJobs = data?.filter(job => !!job.job_numbers && !!(job.job_numbers as any).job_number && !!job.admin_data_entries)
    const jobsWithBranch = filteredJobs?.map(job => {
      // Find the project metadata entry for this job that has a contractor
      const projectMeta = projectMetadata
        .filter(pme => !!(pme.contractors)) // Filter out null contractors
        .find(pme => pme.job_id === job.id); // Find matching job_id
      
      return {
        job_number: (job.job_numbers as any).job_number,
        branch: (job.admin_data_entries as any).county.branch,
        contractNumber: (job.admin_data_entries as any).contract_number,
        mpt_rental: mptData.find(mpte => mpte.id === job.estimate_id)?.mpt_rental,
        contractorName: projectMeta?.contractors ? (projectMeta?.contractors as any).name : null // Safe access with fallback
      }
    }) || [];

    return NextResponse.json({
        data: jobsWithBranch
    });
  } catch (error) {
    console.error('Error in estimate-job-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}