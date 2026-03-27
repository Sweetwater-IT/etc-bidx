import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseJobNotes, stringifyJobNotes } from '@/lib/jobNotes';

const REQUIRED_CONTRACT_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'project_owner', label: 'Project Owner' },
  { key: 'project_name', label: 'Job Name' },
  { key: 'contract_number', label: 'Project Owner Contract #' },
  { key: 'county', label: 'County' },
  { key: 'etc_branch', label: 'ETC Branch' },
  { key: 'etc_project_manager', label: 'ETC Project Manager' },
  { key: 'project_start_date', label: 'Project Start Date' },
  { key: 'project_end_date', label: 'Project End Date' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_job_number', label: 'Customer Job #' },
  { key: 'customer_pm', label: 'Customer PM' },
  { key: 'customer_pm_email', label: 'Customer PM Email' },
  { key: 'certified_payroll_contact', label: 'Certified Payroll Contact' },
  { key: 'certified_payroll_email', label: 'Certified Payroll Email' },
  { key: 'certified_payroll_type', label: 'Certified Payroll Type' },
];

function getMissingContractRequirements(contractData: Record<string, unknown>) {
  const certifiedPayrollType = typeof contractData.certified_payroll_type === 'string'
    ? contractData.certified_payroll_type.trim()
    : contractData.certified_payroll_type;

  return REQUIRED_CONTRACT_FIELDS.flatMap(({ key, label }) => {
    const value = contractData[key];

    if (key === 'certified_payroll_type') {
      return value === 'none' || value === 'state' || value === 'federal' ? [] : [label];
    }

    if (
      (key === 'certified_payroll_contact' || key === 'certified_payroll_email') &&
      certifiedPayrollType === 'none'
    ) {
      return [];
    }

    const normalized = typeof value === 'string' ? value.trim() : value;
    if (!normalized) return [label];
    if (key === 'project_owner' && normalized === 'Other') return [label];
    return [];
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    console.log('[API] GET /api/l/contracts/[id] - Fetching contract:', contractId);

    const { data, error } = await supabase
      .from('jobs_l')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('[API] Error fetching contract:', error);
      return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
    }

    console.log('[API] Contract fetched successfully:', data?.id);

    const parsedNotes = parseJobNotes(data.additional_notes);

    // Transform the data to match the expected format
    const contract = {
      id: data.id,
      project_name: data.project_name,
      contract_number: data.contract_number,
      customer_name: data.customer_name,
      project_owner: data.project_owner,
      etc_job_number: data.etc_job_number,
      etc_branch: data.etc_branch,
      county: data.county,
      etc_project_manager: data.etc_project_manager,
      project_start_date: data.project_start_date,
      project_end_date: data.project_end_date,
      contract_status: data.contract_status,
      project_status: data.project_status,
      billing_status: data.billing_status,
      archived: data.archived,
      created_at: data.created_at,
      version: data.version,
      approver_pm_user_id: data.approver_pm_user_id,
      submitted_for_approval_at: data.submitted_for_approval_at,
      submitted_for_approval_by: data.submitted_for_approval_by,
      approved_at: data.approved_at,
      approved_by: data.approved_by,
      approval_notes: data.approval_notes,
      rejected_at: data.rejected_at,
      rejected_by: data.rejected_by,
      rejection_reason: data.rejection_reason,
      rejection_notes: data.rejection_notes,
      additional_notes: parsedNotes.contractNotes,
      // Include all other fields
      ...data
    };

    contract.additional_notes = parsedNotes.contractNotes;

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error in contract GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const updateData = await request.json();

    console.log('[API] PATCH /api/l/contracts/[id] - Updating contract:', contractId, updateData);

    // Get current contract to check version
    const { data: currentContract, error: currentError } = await supabase
      .from('jobs_l')
      .select('*')
      .eq('id', contractId)
      .single();

    if (currentError) {
      console.error('Error fetching current contract:', currentError);
      return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
    }

    // Check version conflict
    if (updateData.clientVersion !== undefined && updateData.clientVersion !== currentContract.version) {
      console.error('Version conflict detected:', { clientVersion: updateData.clientVersion, serverVersion: currentContract.version });
      return NextResponse.json({ error: 'Version conflict detected' }, { status: 409 });
    }

    // Convert camelCase field names to snake_case for database
    const fieldMapping: Record<string, string> = {
      contractStatus: 'contract_status',
      projectStatus: 'project_status',
      billingStatus: 'billing_status',
      etcJobNumber: 'etc_job_number',
      etcBranch: 'etc_branch',
      stateRoute: 'state_route',
      etcProjectManager: 'etc_project_manager',
      etcBillingManager: 'etc_billing_manager',
      etcProjectManagerEmail: 'etc_project_manager_email',
      etcBillingManagerEmail: 'etc_billing_manager_email',
      projectStartDate: 'project_start_date',
      projectEndDate: 'project_end_date',
      customerJobNumber: 'customer_job_number',
      certifiedPayrollType: 'certified_payroll_type',
      isCertifiedPayroll: 'certified_payroll_type',
      customerPM: 'customer_pm',
      customerPMFirstName: 'customer_pm_first_name',
      customerPMLastName: 'customer_pm_last_name',
      customerPMEmail: 'customer_pm_email',
      customerPMPhone: 'customer_pm_phone',
      certifiedPayrollContact: 'certified_payroll_contact',
      certifiedPayrollContactFirstName: 'certified_payroll_contact_first_name',
      certifiedPayrollContactLastName: 'certified_payroll_contact_last_name',
      certifiedPayrollEmail: 'certified_payroll_email',
      certifiedPayrollPhone: 'certified_payroll_phone',
      customerBillingContact: 'customer_billing_contact',
      customerBillingContactFirstName: 'customer_billing_contact_first_name',
      customerBillingContactLastName: 'customer_billing_contact_last_name',
      customerBillingEmail: 'customer_billing_email',
      customerBillingPhone: 'customer_billing_phone',
      additionalNotes: 'additional_notes',
      otherNotes: 'additional_notes',
      extensionDate: 'extension_date',
      internalId: 'internal_id',
    };

    // Preserve structured job notes when contract/admin notes are updated.
    const currentNotesPayload = parseJobNotes((currentContract as any).additional_notes);

    // Transform camelCase fields to snake_case
    const transformedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'clientVersion') continue; // Skip version from client
      const snakeKey = fieldMapping[key] || key;
      transformedData[snakeKey] = value;
    }

    if (Object.prototype.hasOwnProperty.call(transformedData, 'additional_notes')) {
      transformedData.additional_notes = stringifyJobNotes(
        typeof transformedData.additional_notes === 'string' ? transformedData.additional_notes : '',
        currentNotesPayload.projectLog,
        currentNotesPayload.contractLog
      );
    }

    const nextContractStatus = transformedData.contract_status as string | undefined;
    const currentContractStatus = currentContract.contract_status as string | undefined;
    if (
      nextContractStatus &&
      nextContractStatus !== currentContractStatus &&
      nextContractStatus !== 'CONTRACT_RECEIPT'
    ) {
      const mergedContractData = {
        ...currentContract,
        ...transformedData,
      };
      const missing = getMissingContractRequirements(mergedContractData);
      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            code: 'MISSING_REQUIREMENTS',
            missing,
          },
          { status: 400 }
        );
      }
    }

    // Increment version
    transformedData.version = (currentContract.version || 0) + 1;

    // Check if contract status is changing to CONTRACT_SIGNED and preserve the
    // job number supplied from the signed-contract modal. Auto-generation remains
    // only as a fallback for older flows that do not send a job number.
    if (transformedData.contract_status === 'CONTRACT_SIGNED') {
      // Get current contract data to check if it was previously not signed
      const { data: currentContract, error: currentError } = await supabase
        .from('jobs_l')
        .select('contract_status, etc_job_number')
        .eq('id', contractId)
        .single();

      if (!currentError && currentContract) {
        const wasNotSigned = !['CONTRACT_SIGNED', 'SOURCE_OF_SUPPLY'].includes(currentContract.contract_status || '');
        const hasNoJobNumber = !currentContract.etc_job_number;
        const incomingJobNumber =
          typeof transformedData.etc_job_number === 'string'
            ? transformedData.etc_job_number.trim()
            : '';

        if (incomingJobNumber) {
          transformedData.etc_job_number = incomingJobNumber;
        } else if (wasNotSigned && hasNoJobNumber) {
          // Generate job number (J-0001, J-0002, etc.) - simple sequential numbering
          const { count, error: countError } = await supabase
            .from('jobs_l')
            .select('etc_job_number', { count: 'exact', head: true })
            .not('etc_job_number', 'is', null);

          let nextJobNumber = 'J-0001';
          if (!countError && count !== null) {
            nextJobNumber = `J-${String(count + 1).padStart(4, '0')}`;
          }

          transformedData.etc_job_number = nextJobNumber;
          console.log('[API] Generated job number:', nextJobNumber, 'for contract:', contractId);
        }
      }
    }

    // Add updated_at timestamp
    transformedData.updated_at = new Date().toISOString();

    // Update the contract
    const { data: updatedData, error: updateError } = await supabase
      .from('jobs_l')
      .update(transformedData)
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract:', updateError);
      return NextResponse.json(
        { error: 'Failed to update contract' },
        { status: 500 }
      );
    }

    // Transform response to match expected format
    const contract = {
      id: updatedData.id,
      projectName: updatedData.project_name,
      contractNumber: updatedData.contract_number,
      customerName: updatedData.customer_name,
      projectOwner: updatedData.project_owner,
      etcJobNumber: updatedData.etc_job_number,
      etcBranch: updatedData.etc_branch,
      county: updatedData.county,
      stateRoute: updatedData.state_route,
      etcProjectManager: updatedData.etc_project_manager,
      projectStartDate: updatedData.project_start_date,
      projectEndDate: updatedData.project_end_date,
      contractStatus: updatedData.contract_status,
      projectStatus: updatedData.project_status,
      billingStatus: updatedData.billing_status,
      archived: updatedData.archived,
      createdAt: updatedData.created_at,
      version: updatedData.version,
      approverPmUserId: updatedData.approver_pm_user_id,
      submittedForApprovalAt: updatedData.submitted_for_approval_at,
      submittedForApprovalBy: updatedData.submitted_for_approval_by,
      approvedAt: updatedData.approved_at,
      approvedBy: updatedData.approved_by,
      approvalNotes: updatedData.approval_notes,
      rejectedAt: updatedData.rejected_at,
      rejectedBy: updatedData.rejected_by,
      rejectionReason: updatedData.rejection_reason,
      rejectionNotes: updatedData.rejection_notes,
      customerPM: updatedData.customer_pm,
      customerPMFirstName: updatedData.customer_pm_first_name,
      customerPMLastName: updatedData.customer_pm_last_name,
      customerPMEmail: updatedData.customer_pm_email,
      customerPMPhone: updatedData.customer_pm_phone,
      certifiedPayrollContact: updatedData.certified_payroll_contact,
      certifiedPayrollContactFirstName: updatedData.certified_payroll_contact_first_name,
      certifiedPayrollContactLastName: updatedData.certified_payroll_contact_last_name,
      certifiedPayrollEmail: updatedData.certified_payroll_email,
      certifiedPayrollPhone: updatedData.certified_payroll_phone,
      customerBillingContact: updatedData.customer_billing_contact,
      customerBillingContactFirstName: updatedData.customer_billing_contact_first_name,
      customerBillingContactLastName: updatedData.customer_billing_contact_last_name,
      customerBillingEmail: updatedData.customer_billing_email,
      customerBillingPhone: updatedData.customer_billing_phone
    };

    return NextResponse.json({
      contract,
      message: 'Contract updated successfully'
    });

  } catch (error) {
    console.error('Error in contract update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;

    // Check if contract is signed (cannot delete signed contracts)
    const { data: contractData, error: fetchError } = await supabase
      .from('jobs_l')
      .select('contract_status')
      .eq('id', contractId)
      .single();

    if (fetchError) {
      console.error('Error fetching contract:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch contract' },
        { status: 500 }
      );
    }

    const signedStatuses = ['CONTRACT_SIGNED', 'SOURCE_OF_SUPPLY'];
    if (contractData.contract_status && signedStatuses.includes(contractData.contract_status)) {
      return NextResponse.json(
        { error: 'Cannot delete a signed contract' },
        { status: 400 }
      );
    }

    // Soft delete by archiving
    const { error: deleteError } = await supabase
      .from('jobs_l')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', contractId);

    if (deleteError) {
      console.error('Error deleting contract:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete contract' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Contract deleted successfully'
    });

  } catch (error) {
    console.error('Error in contract delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
