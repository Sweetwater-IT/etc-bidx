import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Parse JSON data from request body
    const requestBody = await req.json();
    
    // Get data from the request
    if (!requestBody.data) {
      return NextResponse.json(
        { error: 'Missing job data' },
        { status: 400 }
      );
    }
    
    const jobData = requestBody.data;
    
    // Validate required fields
    if (!jobData.jobId || !jobData.customer_contract_number || !jobData.contractor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if at least one item is set for the job
    if (!jobData.items || jobData.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item must be added to the job' },
        { status: 400 }
      );
    }
    
    // First, find the job entry with the jobId to validate it exists
    const { data: existingJob, error: jobError } = await supabase
      .from('jobs')
      .select('id, job_number_id')
      .eq('id', jobData.jobId)
      .single();
    
    if (jobError) {
      console.error('Error finding job:', jobError);
      return NextResponse.json(
        { error: 'Failed to find job with the provided job id', details: jobError.message },
        { status: 400 }
      );
    }
    
    if (!existingJob) {
      return NextResponse.json(
        { error: 'No job found with the provided job id' },
        { status: 404 }
      );
    }
    
    const jobId = existingJob.id;
    const jobNumberId = existingJob.job_number_id;
    
    // Find contractor ID from the name
    const { data: contractorData, error: contractorError } = await supabase
      .from('contractors')
      .select('id')
      .eq('name', jobData.contractor)
      .single();
    
    if (contractorError) {
      console.error('Error finding contractor:', contractorError);
      return NextResponse.json(
        { error: 'Failed to find contractor with the provided name', details: contractorError.message },
        { status: 400 }
      );
    }
    
    const contractorId = contractorData?.id;
    
    // Upsert into project_metadata (insert if doesn't exist, update if exists)
    const { error: metadataError } = await supabase
      .from('project_metadata')
      .upsert({
        job_id: jobId,
        contractor_id: contractorId,
        pm_email: jobData.project_email,
        pm_phone: jobData.project_phone,
        project_manager: jobData.project_manager,
        customer_contract_number: jobData.customer_contract_number,
      }, {
        onConflict: 'job_id'
      });
    
    if (metadataError) {
      console.error('Error upserting project metadata:', metadataError);
      return NextResponse.json(
        { error: 'Failed to create or update project metadata', details: metadataError.message },
        { status: 500 }
      );
    }
    
    // Upsert into admin_data_entries (insert if doesn't exist, update if exists)
    const { error: adminError } = await supabase
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
      }, {
        onConflict: 'job_id'
      });
    
    if (adminError) {
      console.error('Error upserting admin data:', adminError);
      return NextResponse.json(
        { error: 'Failed to create or update admin data', details: adminError.message },
        { status: 500 }
      );
    }
    
    // Update jobs table with certified_payroll, labor_group, and standard documents status
    const { error: jobUpdateError } = await supabase
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
    
    if (jobUpdateError) {
      console.error('Error updating job:', jobUpdateError);
      return NextResponse.json(
        { error: 'Failed to update job', details: jobUpdateError.message },
        { status: 500 }
      );
    }
    
    // Insert won bid items
    for (const item of jobData.items) {
        try {
          // Find the ID of the bid item in the bid_item_numbers table based on item_number
          const { data: bidItemData, error: bidItemError } = await supabase
            .from('bid_item_numbers')
            .select('id')
            .eq('item_number', item.itemNumber)
            .single();
          
          if (bidItemError) {
            console.error(`Error finding bid item ${item.itemNumber}:`, bidItemError);
            continue; // Skip this item and move to the next one
          }
          
          // Use the found bid_item_id for insertion
          const { error: itemError } = await supabase
            .from('won_bid_items')
            .insert({
              job_id: jobId,
              bid_item_id: bidItemData.id, // Use the ID from bid_item_numbers
              quantity: item.quantity,
              contract_value: (item.quantity ?? 0) * (item.unitPrice ?? 0),
              aia_billing: item.aiaBilling,
              backlog: item.backlog ?? false,
              unit_price: item.unitPrice ?? null
            });
          
          if (itemError) {
            console.error(`Error inserting won bid item ${item.itemNumber}:`, itemError);
          }
        } catch (err) {
          console.error(`Error processing bid item ${item.itemNumber}:`, err);
        }
      }
    
    // Get the reserved job number from the jobs table
    const { data: jobRow, error: jobRowError } = await supabase
      .from('jobs')
      .select('reserved_job_number, job_number_id')
      .eq('id', jobId)
      .single();
    if (jobRowError) {
      console.error('Error fetching reserved_job_number:', jobRowError);
      return NextResponse.json(
        { error: 'Failed to fetch reserved job number', details: jobRowError.message },
        { status: 500 }
      );
    }
    let newJobNumber = jobRow?.reserved_job_number;
    let branchCode = '20';
    let ownerTypeCode = '22';
    let currentYear = new Date().getFullYear();
    let nextSequentialNumber: number | undefined = 1;
    if (!newJobNumber) {
      // fallback to old logic if reserved_job_number is not present
      if (jobData.adminData.county && typeof jobData.adminData.county === 'object') {
        const countyName = jobData.adminData.county.name || '';
        if (countyName.toLowerCase().includes('bedford')) {
          branchCode = '30'; // West
        } else if (countyName.toLowerCase().includes('hatfield')) {
          branchCode = '10'; // Hatfield
        }
      }
      const ownerTypeMap = { 'PUBLIC': '22', 'PRIVATE': '21' };
      ownerTypeCode = ownerTypeMap[jobData.adminData.division?.toUpperCase()] || '22';
      currentYear = new Date().getFullYear();
      const { data: existingJobNumbers, error: sequentialError } = await supabase
        .from('job_numbers')
        .select('job_number')
        .like('job_number', `%-${currentYear}%`)
        .not('job_number', 'like', 'P-%');
      if (sequentialError) {
        console.error('Error finding existing job numbers:', sequentialError);
        return NextResponse.json(
          { error: 'Failed to generate job number', details: sequentialError.message },
          { status: 500 }
        );
      }
      if (existingJobNumbers && existingJobNumbers.length > 0) {
        const sequentialNumbers: number[] = [];
        existingJobNumbers.forEach(jobNumberRecord => {
          if (jobNumberRecord.job_number) {
            const parts = jobNumberRecord.job_number.split('-');
            if (parts.length === 3) {
              const yearAndSequential = parts[2];
              const yearString = currentYear.toString();
              if (yearAndSequential.startsWith(yearString)) {
                const sequentialPart = yearAndSequential.slice(yearString.length);
                const sequentialNum = parseInt(sequentialPart, 10);
                if (!isNaN(sequentialNum)) {
                  sequentialNumbers.push(sequentialNum);
                }
              }
            }
          }
        });
        if (sequentialNumbers.length > 0) {
          const maxSequential = Math.max(...sequentialNumbers);
          nextSequentialNumber = maxSequential + 1;
        }
      }
      newJobNumber = `${branchCode}-${ownerTypeCode}-${currentYear}${(nextSequentialNumber ?? 1).toString().padStart(3, '0')}`;
    }
    // Parse the reserved job number if present
    let reservedJobNumberParts: string[] = [];
    if (jobRow?.reserved_job_number) {
      reservedJobNumberParts = jobRow.reserved_job_number.split('-');
    }
    let sequentialNumber: number | undefined = undefined;
    if (reservedJobNumberParts.length === 3) {
      // Extract sequential number from the reserved job number
      const yearAndSequential = reservedJobNumberParts[2];
      const year = yearAndSequential.substring(0, 4);
      const seq = yearAndSequential.substring(4);
      branchCode = reservedJobNumberParts[0];
      ownerTypeCode = reservedJobNumberParts[1];
      currentYear = parseInt(year, 10);
      sequentialNumber = parseInt(seq, 10);
      // Check for uniqueness in job_numbers table (excluding current job_number_id)
      const { data: existing, error: checkError } = await supabase
        .from('job_numbers')
        .select('id')
        .eq('branch_code', branchCode)
        .eq('owner_type', ownerTypeCode)
        .eq('year', currentYear)
        .eq('sequential_number', sequentialNumber)
        .neq('id', jobRow.job_number_id)
        .single();
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        return NextResponse.json(
          { error: 'Failed to check job number uniqueness', details: checkError.message },
          { status: 500 }
        );
      }
      if (existing) {
        return NextResponse.json(
          { error: 'Job number already exists. Please choose another.' },
          { status: 400 }
        );
      }
      nextSequentialNumber = sequentialNumber;
    }
    // Update the job_numbers table with the proper job number details
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
      .eq('id', jobRow.job_number_id);
    if (jobNumberError) {
      console.error('Error updating job number:', jobNumberError);
      return NextResponse.json(
        { error: 'Failed to update job number', details: jobNumberError.message },
        { status: 500 }
      );
    }
    // Optionally, clear reserved_job_number after assignment
    await supabase
      .from('jobs')
      .update({ reserved_job_number: null })
      .eq('id', jobId);

    return NextResponse.json({
      success: true,
      jobId: jobId,
      jobNumber: newJobNumber,
      branchCode: branchCode,
      ownerType: ownerTypeCode,
      year: currentYear,
      sequentialNumber: nextSequentialNumber
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}