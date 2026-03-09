import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const LIST_COLUMNS = `
  id, project_name, contract_number, customer_name, project_owner,
  etc_job_number, etc_branch, county, etc_project_manager,
  project_start_date, project_end_date, contract_status,
  project_status, billing_status, archived, created_at, version,
  approver_pm_user_id, submitted_for_approval_at, submitted_for_approval_by,
  approved_at, approved_by, approval_notes,
  rejected_at, rejected_by, rejection_reason, rejection_notes
`;

// Contract pipeline statuses (jobs that are not yet active)
const CONTRACT_STATUSES = [
  'CONTRACT_RECEIPT',
  'RETURNED_TO_CUSTOMER',
  'CONTRACT_SIGNED',
  'SOURCE_OF_SUPPLY',
  'SUBMITTED_FOR_APPROVAL',
  'APPROVED',
  'REJECTED'
];

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('jobs_l')
      .select(LIST_COLUMNS)
      .eq('archived', false)
      .in('contract_status', CONTRACT_STATUSES)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const contracts = (data || []).map(row => ({
      id: row.id,
      projectName: row.project_name,
      contractNumber: row.contract_number,
      customerName: row.customer_name,
      projectOwner: row.project_owner,
      etcJobNumber: row.etc_job_number,
      etcBranch: row.etc_branch,
      county: row.county,
      etcProjectManager: row.etc_project_manager,
      projectStartDate: row.project_start_date,
      projectEndDate: row.project_end_date,
      contractStatus: row.contract_status,
      projectStatus: row.project_status,
      billingStatus: row.billing_status,
      archived: row.archived,
      createdAt: row.created_at,
      version: row.version,
      approverPmUserId: row.approver_pm_user_id,
      submittedForApprovalAt: row.submitted_for_approval_at,
      submittedForApprovalBy: row.submitted_for_approval_by,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      approvalNotes: row.approval_notes,
      rejectedAt: row.rejected_at,
      rejectedBy: row.rejected_by,
      rejectionReason: row.rejection_reason,
      rejectionNotes: row.rejection_notes
    }));

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error in contracts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patch } = body;

    if (!patch || typeof patch !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid patch data' },
        { status: 400 }
      );
    }

    // Create new contract
    const insertData = {
      ...patch,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };

    const { data: newContract, error: insertError } = await supabase
      .from('jobs_l')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating contract:', insertError);
      return NextResponse.json(
        { error: 'Failed to create contract' },
        { status: 500 }
      );
    }

    // Transform response to match expected format
    const contract = {
      id: newContract.id,
      project_name: newContract.project_name,
      contract_number: newContract.contract_number,
      customer_name: newContract.customer_name,
      project_owner: newContract.project_owner,
      etc_job_number: newContract.etc_job_number,
      etc_branch: newContract.etc_branch,
      county: newContract.county,
      etc_project_manager: newContract.etc_project_manager,
      project_start_date: newContract.project_start_date,
      project_end_date: newContract.project_end_date,
      contract_status: newContract.contract_status,
      project_status: newContract.project_status,
      billing_status: newContract.billing_status,
      archived: newContract.archived,
      created_at: newContract.created_at,
      version: newContract.version,
      // Include all other fields
      ...newContract
    };

    return NextResponse.json({
      contract,
      message: 'Contract created successfully'
    });

  } catch (error) {
    console.error('Error in contract create API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
