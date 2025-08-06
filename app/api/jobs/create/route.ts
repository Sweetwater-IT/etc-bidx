import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const jobData = requestBody.data;

    if (!jobData) {
      return NextResponse.json({ error: 'Missing job data' }, { status: 400 });
    }

    if (!jobData.jobId || !jobData.customer_contract_number || !jobData.contractor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!jobData.items || jobData.items.length === 0) {
      return NextResponse.json({ error: 'At least one item must be added to the job' }, { status: 400 });
    }

    const { data: existingJob, error: jobError } = await supabase
      .from('jobs')
      .select('id, job_number_id')
      .eq('id', jobData.jobId)
      .single();

    if (jobError || !existingJob) {
      return NextResponse.json({ error: 'Job not found', details: jobError?.message }, { status: 404 });
    }

    const jobId = existingJob.id;
    const jobNumberId = existingJob.job_number_id;

    const { data: contractorData, error: contractorError } = await supabase
      .from('contractors')
      .select('id')
      .eq('name', jobData.contractor)
      .single();

    if (contractorError) {
      return NextResponse.json({ error: 'Contractor not found', details: contractorError.message }, { status: 400 });
    }

    const contractorId = contractorData?.id;

    await supabase
      .from('project_metadata')
      .upsert({
        job_id: jobId,
        contractor_id: contractorId,
        pm_email: jobData.project_email,
        pm_phone: jobData.project_phone,
        project_manager: jobData.project_manager,
        customer_contract_number: jobData.customer_contract_number,
      }, { onConflict: 'job_id' });

    await supabase
      .from('admin_data_entries')
      .upsert({
        job_id: jobId,
        contract_number: jobData.contractNumber,
        estimator: jobData.adminData.estimator,
        division: jobData.adminData.division,
        bid_date: jobData.adminData.lettingDate ? new Date(jobData.adminData.lettingDate).toISOString() : null,
        owner: jobData.adminData.owner,
        county: jobData.adminData.county,
        sr_route: jobData.adminData.srRoute,
        location: jobData.adminData.location,
        dbe: jobData.adminData.dbe,
        start_date: jobData.adminData.startDate ? new Date(jobData.adminData.startDate).toISOString() : null,
        end_date: jobData.adminData.endDate ? new Date(jobData.adminData.endDate).toISOString() : null,
        winter_start: jobData.adminData.winterStart ? new Date(jobData.adminData.winterStart).toISOString() : null,
        winter_end: jobData.adminData.winterEnd ? new Date(jobData.adminData.winterEnd).toISOString() : null,
        ow_travel_time_mins: jobData.adminData.owTravelTimeMins,
        ow_mileage: jobData.adminData.owMileage,
        fuel_cost_per_gallon: jobData.adminData.fuelCostPerGallon,
        emergency_job: jobData.adminData.emergencyJob,
        rated: jobData.adminData.rated,
        emergency_fields: jobData.adminData.emergencyFields
      }, { onConflict: 'job_id' });

    await supabase
      .from('jobs')
      .update({
        certified_payroll: jobData.adminData.certifiedPayroll || 'STATE',
        labor_group: jobData.adminData.laborGroup || null,
        w9_added: jobData.adminData.w9_added || false,
        eea_sharp_added: jobData.adminData.eea_sharp_added || false,
        safety_program_added: jobData.adminData.safety_program_added || false,
        sexual_harrassment_added: jobData.adminData.sexual_harrassment_added || false,
        avenue_appeals_added: jobData.adminData.avenue_appeals_added || false
      })
      .eq('id', jobId);

    for (const item of jobData.items) {
      try {
        const { data: bidItemData } = await supabase
          .from('bid_item_numbers')
          .select('id')
          .eq('item_number', item.itemNumber)
          .single();

        if (!bidItemData) continue;

        await supabase
          .from('won_bid_items')
          .insert({
            job_id: jobId,
            bid_item_id: bidItemData.id,
            quantity: item.quantity,
            contract_value: (item.quantity ?? 0) * (item.unitPrice ?? 0),
            aia_billing: item.aiaBilling,
            backlog: item.backlog ?? false,
            unit_price: item.unitPrice ?? null
          });
      } catch {}
    }

    const { data: jobRow } = await supabase
      .from('jobs')
      .select('reserved_job_number, job_number_id')
      .eq('id', jobId)
      .single();

    let branchCode = '20';
    let ownerTypeCode = '22';
    let currentYear = new Date().getFullYear();
    let nextSequentialNumber: number | undefined = 1;

    const customJobId: string | undefined = jobData.customJobId; 
    if (customJobId && /^\d{7}$/.test(customJobId)) {
      const customYear = parseInt(customJobId.slice(0, 4), 10);
      const customSeq = parseInt(customJobId.slice(4), 10);

      if (jobData.adminData.county?.name?.toLowerCase().includes('bedford')) branchCode = '30';
      else if (jobData.adminData.county?.name?.toLowerCase().includes('hatfield')) branchCode = '10';

      const ownerTypeMap = { 'PUBLIC': '22', 'PRIVATE': '21' };
      ownerTypeCode = ownerTypeMap[jobData.adminData.division?.toUpperCase()] || '22';

      const { data: existing } = await supabase
        .from('job_numbers')
        .select('id')
        .eq('branch_code', branchCode)
        .eq('owner_type', ownerTypeCode)
        .eq('year', customYear)
        .eq('sequential_number', customSeq)
        .neq('id', jobRow?.job_number_id)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Custom job number already exists.' }, { status: 400 });
      }

      currentYear = customYear;
      nextSequentialNumber = customSeq;
    } else {
      // 🔁 Fallback automático (lo que ya hacías antes)
      const ownerTypeMap = { 'PUBLIC': '22', 'PRIVATE': '21' };
      ownerTypeCode = ownerTypeMap[jobData.adminData.division?.toUpperCase()] || '22';

      if (jobData.adminData.county?.name?.toLowerCase().includes('bedford')) branchCode = '30';
      else if (jobData.adminData.county?.name?.toLowerCase().includes('hatfield')) branchCode = '10';

      const { data: existingJobNumbers } = await supabase
        .from('job_numbers')
        .select('job_number')
        .like('job_number', `%-${currentYear}%`)
        .not('job_number', 'like', 'P-%');

      const sequentialNumbers: number[] = [];
      for (const job of existingJobNumbers || []) {
        const parts = job.job_number?.split('-');
        if (parts?.length === 3 && parts[2].startsWith(currentYear.toString())) {
          const seq = parseInt(parts[2].slice(4), 10);
          if (!isNaN(seq)) sequentialNumbers.push(seq);
        }
      }

      if (sequentialNumbers.length > 0) {
        nextSequentialNumber = Math.max(...sequentialNumbers) + 1;
      }
    }

    const newJobNumber = `${branchCode}-${ownerTypeCode}-${currentYear}${nextSequentialNumber.toString().padStart(3, '0')}`;

    const { error: jobNumberError } = await supabase
      .from('job_numbers')
      .update({
        branch_code: branchCode,
        owner_type: ownerTypeCode,
        year: currentYear,
        sequential_number: nextSequentialNumber,
        job_number: newJobNumber,
        is_assigned: true
      })
      .eq('id', jobRow?.job_number_id);

    if (jobNumberError) {
      return NextResponse.json({ error: 'Failed to update job number', details: jobNumberError.message }, { status: 500 });
    }

    await supabase
      .from('jobs')
      .update({ reserved_job_number: null })
      .eq('id', jobId);

    return NextResponse.json({
      success: true,
      jobId: jobId,
      jobNumber: newJobNumber,
      branchCode,
      ownerType: ownerTypeCode,
      year: currentYear,
      sequentialNumber: nextSequentialNumber
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}