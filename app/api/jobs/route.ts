import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ActiveJob } from '@/data/active-jobs';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch');
    const status = url.searchParams.get('status');
    const counts = url.searchParams.get('counts');
    const filters = url.searchParams.get('filters');
    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = url.searchParams.get('sortOrder');
    const id = url.searchParams.get('id');

    const archived = url.searchParams.get('archived');
    const isArchivedFilter = archived === 'true';
    const excludeArchived = archived === 'false';

    // Parse filters if they exist
    let parsedFilters: Record<string, string[]> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (error) {
        console.error('Error parsing filters:', error);
      }
    }

    if (counts) {
      try {
        const { data: allJobs, error: allJobsError } = await supabase
          .from('jobs')
          .select('id, admin_data_entries(county), archived, deleted')
          .eq('deleted', false)
        if (allJobsError) {
          return NextResponse.json(
            { error: 'Failed to fetch job counts', details: allJobsError },
            { status: 500 }
          );
        }

        const filteredCountiesJobs = allJobs.filter(job => !!job.admin_data_entries && !!(job.admin_data_entries as any).county)
        const isArchived = (v: any) => v === true || v === 'true' || v === 1 || v === '1';

        const nonArchivedJobs = allJobs.filter(job => (!job.archived));
        const nonArchivedFilteredJobs = filteredCountiesJobs.filter(job => !isArchived(job.archived));

        const archivedJobs = allJobs.filter(job => job.archived === true);

        const countData = {
          all: 100,
          west: nonArchivedFilteredJobs.filter(job => (job.admin_data_entries as any).county.branch === 'Bedford' || (job.admin_data_entries as any).county.branch === 'WEST').length,
          turbotville: nonArchivedFilteredJobs.filter(job => (job.admin_data_entries as any).county.branch === 'Turbotville').length,
          hatfield: nonArchivedFilteredJobs.filter(job => (job.admin_data_entries as any).county.branch === 'Hatfield').length,
          archived: archivedJobs.length
        };

        return NextResponse.json(countData);
      } catch (error) {
        console.error('Error fetching job counts:', error);
        return NextResponse.json(
          { error: 'Unexpected error fetching job counts' },
          { status: 500 }
        );
      }
    }

    // Calculate stats for all non-archived, non-deleted jobs
    const { data: allJobsForStats, error: allJobsError } = await supabase
      .from('jobs_complete')
      .select('id, project_status, billing_status, overdays, archived, deleted')
      .eq('deleted', false)
      .or('archived.is.null,archived.eq.false'); // Exclude archived jobs

    if (allJobsError || !allJobsForStats) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs for stats', details: allJobsError?.message },
        { status: 500 }
      );
    }

    // Calculate actual counts for stats
    const totalActive = allJobsForStats.filter(job => job.project_status === 'IN_PROGRESS').length;
    const totalPendingBilling = allJobsForStats.filter(job =>
      job.billing_status === 'NOT_STARTED' || job.billing_status === 'IN_PROGRESS'
    ).length;
    const overdaysCount = allJobsForStats.filter(job => job.overdays > 0).length;

    const stats = {
      totalActive,
      totalPendingBilling,
      overdays: overdaysCount
    };

    // Get pagination parameters
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 25;
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('jobs_complete')
      .select(`
        id,
        job_number,
        branch_code,
        owner_type,
        created_at,
        project_status,
        bid_number,
        billing_status,
        certified_payroll,
        admin_data,
        contractor_name,
        customer_contract_number,
        project_manager,
        pm_email,
        pm_phone,
        total_cost,
        total_revenue,
        total_gross_profit,
        total_days,
        total_hours,
        total_phases,
        overdays,
        job_summary,
        equipment_rental,
        mpt_rental,
        flagging,
        service_work,
        sale_items,
        archived,
        deleted
      `, { count: 'exact' })
      .eq('deleted', false);

    if (isArchivedFilter) {
      query = query.eq('archived', true);
    } else if (excludeArchived) {
      query = query.eq('archived', false);
    }

    // Apply branch filters
    if (branch && branch !== 'all') {
      if (branch === 'archived') {
        // Handle legacy archived branch parameter
        // Only apply if archived parameter wasn't already set
        if (!isArchivedFilter && !excludeArchived) {
          query = query.eq('archived', true);
        }
      } else {
        const branchCodeMap: Record<string, string> = {
          'hatfield': '10',
          'turbotville': '20',
          'west': '30',
        };
        const branchCode = branchCodeMap[branch];
        if (branchCode) {
          query = query.eq('branch_code', branchCode);
        }
      }
    }

    if (status) {
      query = query.eq('project_status', status);
    }

    // Apply additional filters from parsedFilters
    if (Object.keys(parsedFilters).length > 0) {
      Object.entries(parsedFilters).forEach(([field, values]) => {
        if (values && values.length > 0) {
          switch (field) {
            case 'projectStatus':
              query = query.in('project_status', values);
              break;
            case 'billingStatus':
              query = query.in('billing_status', values);
              break;
            case 'contractor':
              query = query.in('contractor_name', values);
              break;
            case 'county':
              // Handle county filter through admin_data
              query = query.filter('admin_data->county->>name', 'in', `(${values.join(',')})`);
              break;
            case 'branch':
              // Handle branch filter through admin_data
              query = query.filter('admin_data->county->>branch', 'in', `(${values.join(',')})`);
              break;
          }
        }
      });
    }

    // Apply sorting if specified
    if (sortBy) {
      const ascending = sortOrder === 'asc';

      // Map frontend column names to database column names
      const sortColumnMap: Record<string, string> = {
        'jobNumber': 'job_number',
        'bidNumber': 'bid_number',
        'projectStatus': 'project_status',
        'billingStatus': 'billing_status',
        'contractNumber': 'admin_data->>contractNumber',
        'location': 'admin_data->>location',
        'county': 'admin_data->county->>name',
        'contractor': 'contractor_name',
        'branch': 'admin_data->county->>branch',
        'startDate': 'admin_data->>startDate',
        'endDate': 'admin_data->>endDate',
        'createdAt': 'created_at'
      };

      const dbColumn = sortColumnMap[sortBy];
      if (dbColumn) {
        query = query.order(dbColumn, { ascending });
      }
    } else {
      // Default sorting
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, count, error } = await query;

    // Handle errors
    if (error) {
      console.error(error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error.message },
        { status: 500 }
      );
    }

    // Fetch reference data from the database
    const { data: counties } = await supabase.from('counties').select('id, name');
    const { data: contractors } = await supabase.from('contractors').select('id, name');

    // Create maps for looking up names by ID
    const countyMap = new Map();
    const contractorMap = new Map();

    if (counties) {
      counties.forEach(county => {
        countyMap.set(county.id.toString(), county.name);
      });
    }

    if (contractors) {
      contractors.forEach(contractor => {
        contractorMap.set(contractor.id.toString(), contractor.name);
      });
    }

    try {
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

      // Fetch won bid items for all jobs
      const jobIds = data?.map(job => job.id) || [];
      const wonBidItemsMap = new Map();

      if (jobIds.length > 0) {
        const { data: wonBidItems, error: wonItemError } = await supabase
          .from('won_bid_items')
          .select(`
            job_id,
            bid_item_numbers(
              item_number,
              description
            )
          `)
          .in('job_id', jobIds);

        if (!wonItemError && wonBidItems) {
          // Group won bid items by job_id
          wonBidItems.forEach(item => {
            if (!wonBidItemsMap.has(item.job_id)) {
              wonBidItemsMap.set(item.job_id, []);
            }

            // Concatenate item_number and description with a space
            const bidItemNumbers = item.bid_item_numbers as any;
            if (bidItemNumbers && bidItemNumbers.item_number && bidItemNumbers.description) {
              const concatenatedItem = `${bidItemNumbers.item_number} ${bidItemNumbers.description}`;
              wonBidItemsMap.get(item.job_id).push(concatenatedItem);
            }
          });
        }
      }

      const formattedJobs = data?.map((job: any) => {
        const branchNameMap: Record<string, string> = {
          '10': 'Hatfield',
          '20': 'Turbotville',
          '30': 'West'
        };

        // Convert to ActiveJob type exactly
        let adminData = job.admin_data;
        if (typeof adminData === 'string') {
          try {
            adminData = JSON.parse(adminData);
          } catch (e) {
            console.error('Error parsing admin_data:', e);
            adminData = {};
          }
        }

        let countyName = '';
        let countyJson = {};
        if (job.county && typeof job.county === 'object' && job.county.name) {
          countyName = job.county.name;
          countyJson = job.county;
        } else if (adminData && adminData.county) {
          if (typeof adminData.county === 'string') {
            countyName = adminData.county;
          } else if (typeof adminData.county === 'object' && adminData.county.name) {
            countyName = adminData.county.name;
            countyJson = adminData.county;
          }
        }

        let branchName = '';
        if (job.branch_code) {
          branchName = branchNameMap[job.branch_code] || '';
        } else if (adminData && adminData.county && adminData.county.branch) {
          branchName = adminData.county.branch;
        }

        let contractNum = '';
        if (job.customer_contract_number) {
          contractNum = adminData.contractNumber;
        } else if (adminData && adminData.contractNumber) {
          contractNum = adminData.contractNumber;
        }

        // Handle contractor name lookup
        let contractorName = job.contractor_name || '';
        if (!contractorName) {
          // Check if we found a contractor name in the lookup
          contractorName = contractorLookups.get(job.id) || '';
        }

        // Get won bid items for this job
        const wonBidItems = wonBidItemsMap.get(job.id) || [];

        return {
          id: job.id,
          jobNumber: job.job_number || '',
          bidNumber: job.bid_number || '',
          projectStatus: job.project_status || 'In Progress',
          billingStatus: job.billing_status || 'Current',
          contractNumber: contractNum,
          location: adminData?.location || '',
          county: countyName,
          branch: branchName,
          contractor: contractorName,
          startDate: adminData?.startDate || '',
          endDate: adminData?.endDate || '',
          laborRate: adminData?.laborRate || 0,
          fringeRate: adminData?.fringeRate || 0,
          cpr: job.certified_payroll,
          mpt: Boolean(job.mpt_rental),
          rental: Boolean(job.equipment_rental),
          permSigns: Boolean(adminData?.permSigns),
          flagging: Boolean(job.flagging),
          saleItems: Boolean(job.sale_items),
          overdays: job.overdays || 0,
          countyJson,
          createdAt: job.created_at || '',
          status: job.project_status || 'In Progress',
          wonBidItems: wonBidItems,
          archived: job.archived
        };
      }) || [];

      return NextResponse.json({
        data: formattedJobs,
        pagination: {
          page,
          pageSize: limit,
          pageCount: Math.ceil((count || 0) / limit),
          totalCount: count || 0
        },
        stats
      });
    } catch (error) {
      console.error('Error processing jobs:', error);
      return NextResponse.json(
        { error: 'Failed to process jobs', details: String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/jobs:', error);
    return NextResponse.json(
      { error: 'Unexpected error fetching jobs' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { formData } = await request.json();

    const { data: jobNumberData, error: jobNumberError } = await supabase
      .from('job_numbers')
      .select('id, job_number')
      .eq('job_number', formData.jobNumber)
      .single();

    if (jobNumberError || !jobNumberData) {
      console.error('Job number lookup error:', jobNumberError);
      return NextResponse.json({ message: 'Job number not found' }, { status: 404 });
    }

    if (formData.newJobNumber) {
      const lastHyphenIndex = formData.jobNumber.lastIndexOf('-');
      const prefix = formData.jobNumber.slice(0, lastHyphenIndex + 1); const newJobNumStr = String(formData.newJobNumber);

      const newYear = parseInt(newJobNumStr.slice(0, 4), 10);
      const newSequential = parseInt(newJobNumStr.slice(4), 10);

      const { error: updateJobNumberError } = await supabase
        .from('job_numbers')
        .update({
          job_number: prefix + formData.newJobNumber,
          year: newYear,
          sequential_number: newSequential
        })
        .eq('id', jobNumberData.id);

      if (updateJobNumberError) {
        console.error('Failed to update job number:', updateJobNumberError);
        return NextResponse.json(
          { message: 'Failed to update job number', error: updateJobNumberError.message },
          { status: 500 }
        );
      }

      const { error: updateJobReservedError } = await supabase
        .from('jobs')
        .update({
          reserved_job_number: String(prefix) + String(newSequential)
        })
        .eq('job_number_id', jobNumberData.id);

      if (updateJobReservedError) {
        console.error('Failed to update reserved_job_number in jobs:', updateJobReservedError);
        return NextResponse.json(
          { message: 'Failed to update reserved job number in jobs', error: updateJobReservedError.message },
          { status: 500 }
        );
      }
    }

    const transformedCountJson = { ...formData.countyJson, branch: formData.branch };

    const { data: adminDataResult, error: adminDataError } = await supabase
      .from('admin_data_entries')
      .update({
        county: transformedCountJson,
        location: formData.location,
        contract_number: formData.contractNumber,
        start_date: formData.startDate,
        end_date: formData.endDate
      })
      .eq('job_id', formData.id);

    if (adminDataError) {
      console.error('Supabase error:', adminDataError);
      return NextResponse.json(
        { message: 'Failed to update job admin data', error: adminDataError.message },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({
        bid_number: formData.bidNumber,
        project_status: formData.projectStatus,
        billing_status: formData.billingStatus
      })
      .eq('job_number_id', jobNumberData.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { message: 'Failed to update job status', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Job updated successfully', data: { data, adminDataResult } },
      { status: 200 }
    );

  } catch (error) {
    console.error('PATCH request error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    console.log('Request data:', requestData);

    const requiredFields = ['customer', 'contractNumber', 'estimator', 'owner', 'county', 'township', 'division'];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const { data: countyData, error: countyError } = await supabase
      .from('counties')
      .select('branch')
      .eq('name', requestData.county.name)
      .single();

    if (countyError || !countyData?.branch) {
      return NextResponse.json(
        { error: 'Invalid county selected or missing branch' },
        { status: 400 }
      );
    }

    const branchCode = countyData.branch;

    let year: number;
    let sequential: number;

    if (requestData.customJobNumber) {
      const str = String(requestData.customJobNumber);
      year = parseInt(str.slice(0, 4), 10);
      sequential = parseInt(str.slice(4), 10);
    } else {
      year = new Date().getFullYear();

      const { data: lastJob } = await supabase
        .from('job_numbers')
        .select('sequential_number')
        .eq('year', year)
        .order('sequential_number', { ascending: false })
        .limit(1)
        .single();

      sequential = lastJob ? lastJob.sequential_number + 1 : 1;
    }

    const jobNumberStr = `${branchCode}-${requestData.division === 'PUBLIC' ? '21' : '22'}-${year}${String(sequential).padStart(4, '0')}`;

    const payload: any = {
      job_number: jobNumberStr,
      year,
      owner_type: requestData.division === 'PUBLIC' ? '21' : '22',
      branch_code: branchCode,
      sequential_number: sequential
    };

    const { data: jobNumberData, error: jobNumberError } = await supabase
      .from('job_numbers')
      .insert(payload)
      .select('id')
      .single();

    if (jobNumberError || !jobNumberData) {
      console.error('Error inserting job number:', jobNumberError);
      return NextResponse.json({ error: 'Failed to create job number' }, { status: 500 });
    }

    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .insert({
        job_number_id: jobNumberData.id,
        reserved_job_number: jobNumberStr.toString()
      })
      .select('id')
      .single();

    if (jobError || !jobData) {
      console.error('Error inserting job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Insert admin_data
    const adminDataEntry = {
      job_id: jobData.id,
      contract_number: requestData.contractNumber,
      estimator: requestData.estimator,
      owner: requestData.owner,
      county: requestData.county,
      location: requestData.township,
      division: requestData.division as 'PRIVATE' | 'PUBLIC',
      bid_date: requestData.lettingDate ? new Date(requestData.lettingDate).toISOString() : null,
      start_date: requestData.startDate ? new Date(requestData.startDate).toISOString() : null,
      end_date: requestData.endDate ? new Date(requestData.endDate).toISOString() : null,
      sr_route: requestData.srRoute,
      dbe: requestData.dbePercentage,
      rated: requestData.workType as 'RATED' | 'NON-RATED' | null,
      fuel_cost_per_gallon: null,
      ow_travel_time_mins: null,
      ow_mileage: null,
      emergency_job: false,
      emergency_fields: {},
      winter_start: null,
      winter_end: null
    };

    const { data: adminData, error: adminError } = await supabase
      .from('admin_data_entries')
      .insert(adminDataEntry)
      .select('id')
      .single();

    if (adminError || !adminData) {
      console.error('Error inserting admin data:', adminError);
      return NextResponse.json({ error: 'Failed to create admin data' }, { status: 500 });
    }

    // Insert project metadata
    const projectMetadataEntry = {
      job_id: jobData.id,
      contractor_id: parseInt(requestData.customer),
      customer_contract_number: null,
      project_manager: null,
      pm_email: null,
      pm_phone: null,
      subcontractor_id: 1,
      bid_estimate_id: null
    };

    const { data: projectMetadata, error: projectMetadataError } = await supabase
      .from('project_metadata')
      .insert(projectMetadataEntry)
      .select('id')
      .single();

    if (projectMetadataError || !projectMetadata) {
      console.error('Error inserting project metadata:', projectMetadataError);
      return NextResponse.json({ error: 'Failed to create project metadata' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      job_number: jobNumberStr,
      job_id: jobData.id,
      message: 'Job created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/jobs:', error);
    return NextResponse.json(
      { error: 'Unexpected error creating job', details: String(error) },
      { status: 500 }
    );
  }
}
