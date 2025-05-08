import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch');
    const status = url.searchParams.get('status');
    const counts = url.searchParams.get('counts');
    
    if (counts) {
      try {
        const { data: allJobs, error: allJobsError } = await supabase
          .from('jobs')
          .select('id, branch_code, status');
        
        if (allJobsError) {
          return NextResponse.json(
            { error: 'Failed to fetch job counts', details: allJobsError },
            { status: 500 }
          );
        }
        
        const countData = {
          all: allJobs.length,
          west: allJobs.filter(job => job.branch_code === '30').length,
          turbotville: allJobs.filter(job => job.branch_code === '20').length,
          hatfield: allJobs.filter(job => job.branch_code === '10').length,
          archived: allJobs.filter(job => job.status === 'Archived').length
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
    
    // Get pagination parameters
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 25;
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Base query for both count and data
    const baseQuery = supabase.from('jobs');
    
    // Count query to get total records
    let countQuery = baseQuery.select('id', { count: 'exact', head: true });
    
    // Data query to get paginated results
    let dataQuery = baseQuery
      .select('*, job_numbers!inner(*)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters based on parameters
    if (status) {
      // Filter by status (e.g., 'Archived')
      countQuery = countQuery.eq('status', status);
      dataQuery = dataQuery.eq('status', status);
    } else if (branch && branch !== 'all') {
      if (branch === 'archived') {
        // Legacy support for 'archived' in branch parameter
        countQuery = countQuery.eq('status', 'Archived');
        dataQuery = dataQuery.eq('status', 'Archived');
      } else {
        // Filter by branch code
        const branchCodeMap: Record<string, string> = {
          'hatfield': '10',
          'turbotville': '20',
          'west': '30',
        };
        const branchCode = branchCodeMap[branch];
        if (branchCode) {
          countQuery = countQuery.eq('branch_code', branchCode);
          dataQuery = dataQuery.eq('branch_code', branchCode);
        }
      }
    }
    
    // Execute both queries in parallel
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
    ]);
    
    if (countResult.error || dataResult.error) {
      const error = countResult.error || dataResult.error;
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error },
        { status: 500 }
      );
    }
    
    const jobs = dataResult.data || [];
    const totalCount = countResult.count || 0;
    const pageCount = Math.ceil(totalCount / limit);
    
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
    
    // Process all jobs    
    const formattedJobs = jobs.map(job => {
      const jobDetails = job.job_details || {};
      
      const branchNameMap: Record<string, string> = {
        '10': 'Hatfield',
        '20': 'Turbotville',
        '30': 'West'
      };
      
      // Extract contract number
      const contractNumber = jobDetails.contractNumber || '';
      
      // Extract contractor information
      const contractorId = jobDetails.customer || jobDetails.contractor || '';
      const contractorName = contractorMap.get(contractorId) || contractorId;
      
      // Extract project status
      const projectStatus = jobDetails.projectStatus || 'In Progress';
      
      // Extract billing status
      const billingStatus = jobDetails.billingStatus || 'Current';
      
      // Extract location
      const location = jobDetails.township 
        ? `${jobDetails.township}${jobDetails.srRoute ? ` - ${jobDetails.srRoute}` : ''}` 
        : jobDetails.location || '';
      
      // Extract county
      const countyId = jobDetails.county || '';
      const countyName = countyMap.get(countyId) || countyId;
      
      // Extract dates
      const startDate = jobDetails.startDate || '';
      const endDate = jobDetails.endDate || '';
      
      // Extract rates
      const laborRate = parseFloat(jobDetails.laborRate) || 0;
      const fringeRate = parseFloat(jobDetails.fringeRate) || 0;
     
      return {
        id: job.id,
        jobNumber: job.job_number,
        contractNumber: contractNumber,
        contractor: contractorName,
        projectStatus: projectStatus,
        billingStatus: billingStatus,
        location: location,
        county: countyName,
        branch: branchNameMap[job.branch_code] || job.branch_code,
        startDate: startDate,
        endDate: endDate,
        laborRate: laborRate,
        fringeRate: fringeRate,
        mpt: jobDetails.mpt || false,
        rental: jobDetails.rental || false,
        permSigns: jobDetails.permSigns || false,
        flagging: jobDetails.flagging || false,
        saleItems: jobDetails.saleItems || false,
        overdays: parseInt(jobDetails.overdays) || 0,
        createdAt: job.created_at
      };
    });
    
    return NextResponse.json({
      data: formattedJobs,
      pagination: {
        page,
        pageSize: limit,
        pageCount,
        totalCount
      }
    });
  } catch (error) {
    console.error('Error in GET /api/jobs:', error);
    return NextResponse.json(
      { error: 'Unexpected error fetching jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    const { division, customSequentialNumber } = formData;
    const ownerTypeMap: Record<string, string> = {
      'PUBLIC': '22',
      'PRIVATE': '21'
    };
    const ownerTypeCode = ownerTypeMap[division]
    
    const branchCode = '10';
    const currentYear = new Date().getFullYear();
    
    let sequentialNumber: number;
    
    if (customSequentialNumber) {
      sequentialNumber = parseInt(customSequentialNumber, 10);
      if (isNaN(sequentialNumber) || sequentialNumber < 1 || sequentialNumber > 999) {
        return NextResponse.json(
          { error: 'Invalid sequential number. Must be between 1 and 999.' },
          { status: 400 }
        );
      }
      
      const { data: existingJobNumber } = await supabase
        .from('job_numbers')
        .select('id')
        .eq('branch_code', branchCode)
        .eq('owner_type', ownerTypeCode)
        .eq('year', currentYear)
        .eq('sequential_number', sequentialNumber)
        .single();
      
      if (existingJobNumber) {
        return NextResponse.json(
          { error: 'This job number is already taken. Please choose another.' },
          { status: 409 }
        );
      }
    } else {
      const { data: highestSequential } = await supabase
        .from('job_numbers')
        .select('sequential_number')
        .eq('branch_code', branchCode)
        .eq('owner_type', ownerTypeCode)
        .eq('year', currentYear)
        .order('sequential_number', { ascending: false })
        .limit(1);
      
      sequentialNumber = 1;
      if (highestSequential && highestSequential.length > 0) {
        sequentialNumber = highestSequential[0].sequential_number + 1;
      }
    }
    
    const { data: jobNumberData, error: jobNumberError } = await supabase
      .from('job_numbers')
      .insert({
        branch_code: branchCode,
        owner_type: ownerTypeCode,
        year: currentYear,
        sequential_number: sequentialNumber,
        is_assigned: false
      })
      .select()
      .single();
    
    console.log('Job number creation result:', { data: jobNumberData, error: jobNumberError });
    
    if (jobNumberError) {
      return NextResponse.json(
        { error: 'Failed to create job number', details: jobNumberError },
        { status: 500 }
      );
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        job_number: jobNumberData.job_number,
        branch_code: jobNumberData.branch_code,
        owner_type: jobNumberData.owner_type,
        year: jobNumberData.year,
        sequential_number: jobNumberData.sequential_number,
        job_details: formData
      })
      .select()
      .single();
    
    
    if (jobError) {
      await supabase
        .from('job_numbers')
        .update({ is_assigned: false })
        .eq('id', jobNumberData.id);
      
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError },
        { status: 500 }
      );
    }
    
    await supabase
      .from('job_numbers')
      .update({ is_assigned: true })
      .eq('id', jobNumberData.id);
    
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected error in job creation' },
      { status: 500 }
    );
  }
}
