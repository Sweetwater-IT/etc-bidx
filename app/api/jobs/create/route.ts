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
    
    // Insert into project_metadata
    const { error: metadataError } = await supabase
      .from('project_metadata')
      .insert({
        contractor_id: contractorId,
        pm_email: jobData.project_email,
        pm_phone: jobData.project_phone,
        customer_contract_number: jobData.customer_contract_number,
        job_id: jobId,
      });
    
    if (metadataError) {
      console.error('Error inserting project metadata:', metadataError);
      return NextResponse.json(
        { error: 'Failed to create project metadata', details: metadataError.message },
        { status: 500 }
      );
    }
    
    // Insert into admin_data_entries
    const { error: adminError } = await supabase
      .from('admin_data_entries')
      .insert({
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
      });
    
    if (adminError) {
      console.error('Error inserting admin data:', adminError);
      return NextResponse.json(
        { error: 'Failed to create admin data', details: adminError.message },
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
              contract_value: item.contractValue,
              aia_billing: item.aiaBilling
            });
          
          if (itemError) {
            console.error(`Error inserting won bid item ${item.itemNumber}:`, itemError);
          }
        } catch (err) {
          console.error(`Error processing bid item ${item.itemNumber}:`, err);
        }
      }
    
    // Update job number based on county/branch, owner type, year, and sequential number
    let branchCode = '20'; // Default to Turbotville
    if (jobData.adminData.county === 'Bedford') {
      branchCode = '30';
    } else if (jobData.adminData.county === 'Hatfield') {
      branchCode = '10';
    }
    
    const ownerType = jobData.adminData.division === 'public' ? '22' : '11';
    const year = '2025';
    const sequentialNumber = '150'; // High number as requested
    
    const newJobNumber = `${branchCode}-${ownerType}-${year}${sequentialNumber}`;
    
    // Update job_numbers table with the new job number
    const { error: jobNumberError } = await supabase
      .from('job_numbers')
      .update({
        branch_code: branchCode,
        owner_type: ownerType,
        year: 2025,
        sequential_number: 150,
        job_number: newJobNumber,
        is_assigned: true
      })
      .eq('id', jobNumberId);
    
    if (jobNumberError) {
      console.error('Error updating job number:', jobNumberError);
      return NextResponse.json(
        { error: 'Failed to update job number', details: jobNumberError.message },
        { status: 500 }
      );
    }
    
    // Update jobs table with the new job number
    const { error: finalJobUpdateError } = await supabase
      .from('jobs')
      .update({
        // job_number: newJobNumber
      })
      .eq('id', jobId);
    
    if (finalJobUpdateError) {
      console.error('Error updating job with new job number:', finalJobUpdateError);
      return NextResponse.json(
        { error: 'Failed to update job with new job number', details: finalJobUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: jobId,
      jobNumber: newJobNumber
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