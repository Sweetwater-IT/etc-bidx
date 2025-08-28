import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { JobCompleteView } from '@/types/jobs-view';
import { Database } from '@/types/database.types';
import { County } from '@/types/TCounty';
import { Customer } from '@/types/Customer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';
    const status = searchParams.get('status'); // won, won-pending, or all

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Base query from the jobs_list view which already has the flattened data
    let query = supabase
      .from('jobs_complete')
      .select(`
        id,
        job_number,
        contractor_name,
        admin_data,
        created_at,
        project_status,
        total_hours,
        total_revenue,
        estimate_status
      `, { count: 'exact' })
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    // Apply status filter based on job_number prefix
    if (status && status !== 'all') {
      if (status === 'won-pending') {
        // Jobs with job_number starting with 'P-' are pending
        query = query.like('job_number', 'P-%');
      } else if (status === 'won') {
        // Jobs without 'P-' prefix are won
        query = query.not('job_number', 'like', 'P-%');
      }
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch jobs', error: error.message },
        { status: 500 }
      );
    }

    // Get all job IDs that don't have contractor names for batch lookup
    const jobsWithoutContractors = data?.filter(job => !job.contractor_name).map(job => job.id) || [];

    // Batch lookup contractor names for jobs missing them
    const contractorLookups = new Map();
    if (jobsWithoutContractors.length > 0) {
      const { data: projectMetadata, error: metadataError } = await supabase
        .from('project_metadata')
        .select(`
          job_id,
          contractors(name)
        `)
        .in('job_id', jobsWithoutContractors);

      if (!metadataError && projectMetadata) {
        projectMetadata.forEach(item => {
          if (item.contractors && (item.contractors as any).name) {
            contractorLookups.set(item.job_id, (item.contractors as any).name);
          }
        });
      }
    }

    // Transform the data for the frontend
    const transformedData = (data || [])
      .filter(job => {
        // If estimate_status is available, use it
        if (job.estimate_status) {
          return job.estimate_status === 'WON' || job.estimate_status === 'PENDING';
        }
        // Fallback: always include (should not happen)
        return true;
      })
      .filter(job => !!job.admin_data)
      .map(job => {
        // Handle contractor name lookup
        let contractorName = job.contractor_name || '';
        if (!contractorName) {
          // Check if we found a contractor name in the lookup
          contractorName = contractorLookups.get(job.id) || '';
        }

        return {
          id: job.id,
          job_number: job.job_number,
          letting_date: job.admin_data.lettingDate ? job.admin_data.lettingDate : '',
          contract_number: job.admin_data.contractNumber || '',
          contractor: contractorName,
          status: job.job_number?.startsWith('P-') ? 'Won - Pending' : 'Won',
          county: job.admin_data.county.name || '',
          branch: job.admin_data.county.branch || '',
          estimator: job.admin_data.estimator || '',
          created_at: job.created_at,
          project_status: job.project_status,
          total_hours: job.total_hours,
          total_revenue: job.total_revenue
        };
      });

    // Get counts for different statuses
    let countData = {
      all: 0,
      won: 0,
      wonPending: 0
    };

    if (searchParams.get('counts') === 'true') {
      // Get total count
      const { count: totalCount } = await supabase
        .from('jobs_list')
        .select('id', { count: 'exact', head: true });

      // Get pending count (P- prefix)
      const { count: pendingCount } = await supabase
        .from('jobs_list')
        .select('id', { count: 'exact', head: true })
        .like('job_number', 'P-%');

      countData = {
        all: totalCount || 0,
        wonPending: pendingCount || 0,
        won: (totalCount || 0) - (pendingCount || 0)
      };
    }

    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        pageSize: limit,
        pageCount,
        totalCount
      },
      counts: countData
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const contractNumber = reqBody.contractNumber;

    if (!contractNumber) {
      return NextResponse.json(
        { message: 'Contract number is required' },
        { status: 400 }
      );
    }

    console.log(contractNumber)
    // Fetch job data using the contract number
    const { data: jobData, error: jobError } = await supabase
      .from('jobs_complete')
      .select('*')
      .filter("admin_data->>contractNumber", 'eq', contractNumber)
      .single();

    if (jobError || !jobData) {
      return NextResponse.json(
        { message: 'Job not found', error: jobError?.message },
        { status: 404 }
      );
    }

    const job = jobData as JobCompleteView;

    // Get job_id for additional file lookups
    const job_id = job.id;

    // Check for additional files in the jobs table
    const { data: jobFilesData, error: jobFilesError } = await supabase
      .from('jobs')
      .select(`
        w9_added,
        eea_sharp_added,
        safety_program_added,
        sexual_harrassment_added,
        avenue_appeals_added,
        labor_group
      `)
      .eq('id', job_id)
      .single();

    if (jobFilesError) {
      console.error('Error fetching job files data:', jobFilesError);
    }

    let finalContractorName = job.contractor_name

    if (!job.contractor_name) {
      const { data: projectMetadata, error: metadataError } = await supabase
        .from('project_metadata')
        .select(`
          job_id,
          contractors(name)
        `)
        .eq('job_id', job_id);

      if (!metadataError && projectMetadata && projectMetadata[0] && projectMetadata[0].contractors) {
        //weird supabase type error where it recognizes contractors as an arry
        finalContractorName = (projectMetadata[0].contractors as any).name
      }
      else finalContractorName = null;
    }

    if (!job.admin_data || !job.admin_data.contractNumber) {

    }

    // Prepare response object
    return NextResponse.json({
      adminData: {
        contractNumber: job.admin_data.contractNumber,
        estimator: job.admin_data.estimator,
        division: job.admin_data.division || null,
        lettingDate: job.admin_data.lettingDate ? new Date(job.admin_data.lettingDate) : null,
        owner: job.admin_data.owner || null,
        county: job.admin_data.county || null,
        srRoute: job.admin_data.srRoute || '',
        location: job.admin_data.location || '',
        dbe: job.admin_data.dbe?.toString() || '0',
        startDate: job.admin_data.startDate ? new Date(job.admin_data.startDate) : null,
        endDate: job.admin_data.endDate ? new Date(job.admin_data.endDate) : null,
        winterStart: job.admin_data.winterStart ? new Date(job.admin_data.winterStart) : undefined,
        winterEnd: job.admin_data.winterEnd ? new Date(job.admin_data.winterEnd) : undefined,
        owTravelTimeMins: job.admin_data.owTravelTimeMins || 0,
        owMileage: job.admin_data.owMileage || 0,
        fuelCostPerGallon: job.admin_data.fuelCostPerGallon || 0,
        emergencyJob: job.admin_data.emergencyJob || false,
        rated: job.admin_data.rated || 'NON-RATED',
        emergencyFields: job.admin_data.emergencyFields || {},
      },
      job_id,
      job_number: job.job_number,
      contractorName: finalContractorName || '',
      customerContractNumber: job.customer_contract_number || '',
      projectManager: job.project_manager || '',
      pmEmail: job.pm_email || '',
      pmPhone: job.pm_phone || '',
      w9_added: jobFilesData?.w9_added || false,
      eea_sharp_added: jobFilesData?.eea_sharp_added || false,
      safety_program_added: jobFilesData?.safety_program_added || false,
      sexual_harrassment_added: jobFilesData?.sexual_harrassment_added || false,
      avenue_appeals_added: jobFilesData?.avenue_appeals_added || false,
      certified_payroll: job.certified_payroll || 'STATE',
      labor_group: jobFilesData?.labor_group || 'Labor Group 3',
    });
  } catch (error) {
    console.error('Error fetching contract management data:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { contractNumber, updates } = reqBody;

    if (!contractNumber) {
      return NextResponse.json({ message: 'Contract number is required' }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ message: 'Updates object is required' }, { status: 400 });
    }

    const { data: adminDataEntry, error: fetchError } = await supabase
      .from('admin_data_entries')
      .select('*')
      .eq('contract_number', contractNumber)
      .single();

    if (fetchError || !adminDataEntry) {
      return NextResponse.json({ message: 'Admin data entry not found', error: fetchError?.message }, { status: 404 });
    }

    const newAdminData = {
      ...adminDataEntry.admin_data,
      ...updates,
    };

    const { error: updateError } = await supabase
      .from('admin_data_entries')
      .update({
        owner: updates.owner,
        county: updates.county,
        division: updates.division,
        location: updates.location,
        start_date: updates.startDate,
        end_date: updates.endDate,
        bid_date: updates.lettingDate,
        sr_route: updates.srRoute,
        dbe: updates.dbe,
      })
      .eq('id', adminDataEntry.id);

    if (updateError) {
      console.error('Error updating admin_data:', updateError);
      return NextResponse.json({ message: 'Error updating admin_data', error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Admin data updated successfully',
      adminData: newAdminData,
    });
  } catch (error) {
    console.error('Error in update endpoint:', error);
    return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
  }
}
