import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('jobs_l')
      .select('id,project_name,contract_number,customer_name,customer_job_number,project_owner,etc_job_number,etc_branch,county,state_route,project_start_date,project_end_date,contract_status,project_status,billing_status,archived,created_at,etc_project_manager,etc_billing_manager,certified_payroll_type')
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in jobs API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}