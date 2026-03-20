import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Job, JobFromDB, JobProjectInfo } from '@/types/job';
import { parseJobNotes } from '@/lib/jobNotes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('jobs_l')
      .select('*')
      .eq('id', jobId)
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

    const parsedNotes = parseJobNotes(job.additional_notes);

    const projectInfo: JobProjectInfo = {
      projectName: job.project_name,
      etcJobNumber: job.etc_job_number,
      etcBranch: job.etc_branch,
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
      otherNotes: parsedNotes.contractNotes,
      isCertifiedPayroll: (job.certified_payroll_type === "state" ? "state" : job.certified_payroll_type === "federal" ? "federal" : "none") as "none" | "state" | "federal",
      shopRate: job.shop_rate?.toString() || null,
      stateMptBaseRate: job.state_base_rate?.toString() || null,
      stateMptFringeRate: job.state_fringe_rate?.toString() || null,
      stateFlaggingBaseRate: job.state_flagging_base_rate?.toString() || null,
      stateFlaggingFringeRate: job.state_flagging_fringe_rate?.toString() || null,
      federalMptBaseRate: job.federal_base_rate?.toString() || null,
      federalMptFringeRate: job.federal_fringe_rate?.toString() || null,
      federalFlaggingBaseRate: job.federal_flagging_base_rate?.toString() || null,
      federalFlaggingFringeRate: job.federal_flagging_fringe_rate?.toString() || null,
      etcProjectManager: job.etc_project_manager,
      etcBillingManager: job.etc_billing_manager,
      etcProjectManagerEmail: job.etc_project_manager_email,
      etcBillingManagerEmail: job.etc_billing_manager_email,
      certifiedPayrollContact: job.certified_payroll_contact,
      certifiedPayrollEmail: job.certified_payroll_email,
      certifiedPayrollPhone: job.certified_payroll_phone,
      customerBillingContact: job.customer_billing_contact,
      customerBillingEmail: job.customer_billing_email,
      customerBillingPhone: job.customer_billing_phone,
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
