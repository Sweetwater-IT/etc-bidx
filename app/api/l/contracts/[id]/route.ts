import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;

    const { data, error } = await supabase
      .from('jobs_l')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('Error fetching contract:', error);
      return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
    }

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
      // Include all other fields
      ...data
    };

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
    const body = await request.json();
    const { patch, clientVersion } = body;

    if (!patch || typeof patch !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid patch data' },
        { status: 400 }
      );
    }

    // Get current version for optimistic locking
    const { data: currentData, error: fetchError } = await supabase
      .from('jobs_l')
      .select('version')
      .eq('id', contractId)
      .single();

    if (fetchError) {
      console.error('Error fetching contract version:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch contract version' },
        { status: 500 }
      );
    }

    const currentVersion = currentData.version || 1;

    // Check version conflict
    if (clientVersion !== undefined && clientVersion !== currentVersion) {
      // Get latest data for conflict resolution
      const { data: latestData, error: latestError } = await supabase
        .from('jobs_l')
        .select('*')
        .eq('id', contractId)
        .single();

      if (latestError) {
        console.error('Error fetching latest contract data:', latestError);
        return NextResponse.json(
          {
            error: 'Version conflict detected',
            code: 'VERSION_CONFLICT',
            latest: latestData
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Version conflict detected',
          code: 'VERSION_CONFLICT',
          latest: latestData
        },
        { status: 409 }
      );
    }

    // Apply the patch
    const updateData = {
      ...patch,
      version: currentVersion + 1,
      updated_at: new Date().toISOString()
    };

    const { data: updatedData, error: updateError } = await supabase
      .from('jobs_l')
      .update(updateData)
      .eq('id', contractId)
      .eq('version', currentVersion)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract:', updateError);

      // Check if it's a version conflict
      if (updateError.code === 'PGRST116') {
        // Get latest data
        const { data: latestData } = await supabase
          .from('jobs_l')
          .select('*')
          .eq('id', contractId)
          .single();

        return NextResponse.json(
          {
            error: 'Version conflict detected',
            code: 'VERSION_CONFLICT',
            latest: latestData
          },
          { status: 409 }
        );
      }

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
      rejectionNotes: updatedData.rejection_notes
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