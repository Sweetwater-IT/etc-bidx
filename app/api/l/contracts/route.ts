import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const LIST_COLUMNS = `
  id, project_name, contract_number, customer_name, project_owner,
  etc_job_number, etc_branch, county, etc_project_manager,
  project_start_date, project_end_date, contract_status,
  project_status, billing_status, archived, created_at,
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
    console.log('API: Fetching contracts with query:', {
      select: LIST_COLUMNS,
      filters: {
        archived: false,
        or: `contract_status.in.(${CONTRACT_STATUSES.join(',')}),project_status.eq.NOT STARTED`
      }
    });

    const { data, error } = await supabase
      .from('jobs_l')
      .select(LIST_COLUMNS)
      .eq('archived', false)
      .or(`contract_status.in.(${CONTRACT_STATUSES.join(',')}),project_status.eq.NOT STARTED`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    console.log('API: Raw contracts data from DB:', data);
    console.log('API: Number of contracts returned from DB:', data?.length || 0);

    // Transform snake_case → camelCase for frontend
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
    const { contractId, data } = body;
    const contractData = data;

    if (!contractData || typeof contractData !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid contract data' },
        { status: 400 }
      );
    }

    // Field mapping: frontend camelCase → database snake_case
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

    // Transform incoming data to snake_case
    const dbData: Record<string, unknown> = {};
    for (const [camelKey, snakeKey] of Object.entries(fieldMapping)) {
      if (camelKey in contractData) {
        dbData[snakeKey] = contractData[camelKey];
      }
    }

    // Generate next internal contract ID (C-0001, C-0002, ...)
    const { data: latest, error: latestError } = await supabase
      .from('jobs_l')
      .select('internal_id')
      .order('created_at', { ascending: false })
      .limit(1);

    let nextInternalId = 'C-0001';
    if (!latestError && latest?.length > 0) {
      const current = latest[0].internal_id;
      if (current && current.startsWith('C-')) {
        const num = parseInt(current.substring(2), 10);
        if (!isNaN(num)) {
          nextInternalId = `C-${String(num + 1).padStart(4, '0')}`;
        }
      }
    }

    // Prepare full insert object
    const insertData = {
      id: crypto.randomUUID(),
      ...dbData,
      internal_id: nextInternalId,
      project_status: 'NOT STARTED',
      billing_status: 'NOT STARTED',
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: result, error: upsertError } = contractId 
      ? await supabase
        .from('jobs_l')
        .update({ ...dbData, updated_at: new Date().toISOString() })
        .eq('id', contractId)
        .select()
        .single()
      : await supabase
        .from('jobs_l')
        .insert(insertData)
        .select()
        .single();

    if (upsertError) {
      console.error('Error upserting contract:', upsertError);
      return NextResponse.json({ error: 'Failed to upsert contract' }, { status: 500 });
    }

    // Transform to camelCase for frontend
    const toCamelCase = (row: any) => ({
      id: row.id,
      projectName: row.project_name,
      contractNumber: row.contract_number,
      customerName: row.customer_name,
      customerJobNumber: row.customer_job_number,
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
      approverPmUserId: row.approver_pm_user_id,
      submittedForApprovalAt: row.submitted_for_approval_at,
      submittedForApprovalBy: row.submitted_for_approval_by,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      approvalNotes: row.approval_notes,
      rejectedAt: row.rejected_at,
      rejectedBy: row.rejected_by,
      rejectionReason: row.rejection_reason,
      rejectionNotes: row.rejection_notes,
      additionalNotes: row.additional_notes,
      certifiedPayrollType: row.certified_payroll_type,
      shopRate: row.shop_rate,
      stateBaseRate: row.state_base_rate,
      stateFringeRate: row.state_fringe_rate,
      stateFlaggingBaseRate: row.state_flagging_base_rate,
      stateFlaggingFringeRate: row.state_flagging_fringe_rate,
      federalBaseRate: row.federal_base_rate,
      federalFringeRate: row.federal_fringe_rate,
      federalFlaggingBaseRate: row.federal_flagging_base_rate,
      federalFlaggingFringeRate: row.federal_flagging_fringe_rate,
      customerPm: row.customer_pm,
      customerPmEmail: row.customer_pm_email,
      customerPmPhone: row.customer_pm_phone,
      certifiedPayrollContact: row.certified_payroll_contact,
      certifiedPayrollEmail: row.certified_payroll_email,
      certifiedPayrollPhone: row.certified_payroll_phone,
      customerBillingContact: row.customer_billing_contact,
      customerBillingEmail: row.customer_billing_email,
      customerBillingPhone: row.customer_billing_phone,
      etcBillingManager: row.etc_billing_manager,
      etcProjectManagerEmail: row.etc_project_manager_email,
      etcBillingManagerEmail: row.etc_billing_manager_email,
      extensionDate: row.extension_date,
      internalId: row.internal_id,
      version: row.version
    });

    return NextResponse.json({
      contract: toCamelCase(result),
      projectInfo: toCamelCase(result)
    });
  } catch (error) {
    console.error('Error in contract upsert API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
