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

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('jobs_l')
      .select(LIST_COLUMNS)
      .eq('archived', false)
      .eq('project_status', 'not started')
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

    console.log('[API] POST /api/l/contracts - Creating contract:', patch);

    if (!patch || typeof patch !== 'object') {
      console.error('[API] Invalid patch data for contract creation:', patch);
      return NextResponse.json(
        { error: 'Missing or invalid patch data' },
        { status: 400 }
      );
    }

    // Transform camelCase field names to snake_case for database
    const fieldMapping: Record<string, string> = {
      projectName: 'project_name',
      contractNumber: 'contract_number',
      customerName: 'customer_name',
      customerJobNumber: 'customer_job_number',
      projectOwner: 'project_owner',
      etcJobNumber: 'etc_job_number',
      etcBranch: 'etc_branch',
      county: 'county',
      stateRoute: 'state_route',
      projectStartDate: 'project_start_date',
      projectEndDate: 'project_end_date',
      additionalNotes: 'additional_notes',
      certifiedPayrollType: 'certified_payroll_type',
      shopRate: 'shop_rate',
      stateBaseRate: 'state_base_rate',
      stateFringeRate: 'state_fringe_rate',
      stateFlaggingBaseRate: 'state_flagging_base_rate',
      stateFlaggingFringeRate: 'state_flagging_fringe_rate',
      federalBaseRate: 'federal_base_rate',
      federalFringeRate: 'federal_fringe_rate',
      federalFlaggingBaseRate: 'federal_flagging_base_rate',
      federalFlaggingFringeRate: 'federal_flagging_fringe_rate',
      contractStatus: 'contract_status',
      projectStatus: 'project_status',
      billingStatus: 'billing_status',
      customerPm: 'customer_pm',
      customerPmEmail: 'customer_pm_email',
      customerPmPhone: 'customer_pm_phone',
      certifiedPayrollContact: 'certified_payroll_contact',
      certifiedPayrollEmail: 'certified_payroll_email',
      certifiedPayrollPhone: 'certified_payroll_phone',
      customerBillingContact: 'customer_billing_contact',
      customerBillingEmail: 'customer_billing_email',
      customerBillingPhone: 'customer_billing_phone',
      etcProjectManager: 'etc_project_manager',
      etcBillingManager: 'etc_billing_manager',
      etcProjectManagerEmail: 'etc_project_manager_email',
      etcBillingManagerEmail: 'etc_billing_manager_email',
      extensionDate: 'extension_date',
    };

    // Transform patch data to snake_case
    const transformedPatch: Record<string, unknown> = {};
    for (const [camelKey, snakeKey] of Object.entries(fieldMapping)) {
      if (patch[camelKey] !== undefined) {
        transformedPatch[snakeKey] = patch[camelKey];
      }
    }

    // Generate structured internal contract ID (C-0001, C-0002, etc.)
    const { data: latestContract, error: latestError } = await supabase
      .from('jobs_l')
      .select('internal_id')
      .order('created_at', { ascending: false })
      .limit(1);

    let nextInternalId = 'C-0001';
    if (!latestError && latestContract && latestContract.length > 0) {
      const current = latestContract[0].internal_id;
      if (current && current.startsWith('C-')) {
        const num = parseInt(current.substring(2));
        if (!isNaN(num)) {
          nextInternalId = `C-${String(num + 1).padStart(4, '0')}`;
        }
      }
    }

    // Create new contract
    const insertData = {
      id: crypto.randomUUID(),
      ...transformedPatch,
      project_status: 'not started',
      billing_status: 'not started',
      internal_id: nextInternalId,
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
