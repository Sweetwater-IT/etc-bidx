import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET endpoint to fetch jobs with filtering
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch');
    
    let query = supabase.from('jobs').select('*, job_numbers!inner(*)');
    
    if (branch && branch !== 'all') {
      const branchCodeMap: Record<string, string> = {
        'hatfield': '10',
        'turbotville': '20',
        'west': '30'
      };
      const branchCode = branchCodeMap[branch.toLowerCase()] || branch;
      query = query.eq('branch_code', branchCode);
    }
    
    const { data: jobs, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error },
        { status: 500 }
      );
    }
    
    const { data: counties } = await supabase.from('counties').select('id, name');
    const { data: contractors } = await supabase.from('contractors').select('id, name');
    
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
    
    if (jobs.length > 0) {
      console.log('First job from database:', jobs[0]);
      console.log('job_details content:', jobs[0].job_details);
    }

    const formattedJobs = jobs.map(job => {
      const jobDetails = job.job_details || {};
      
      const branchNameMap: Record<string, string> = {
        '10': 'Hatfield',
        '20': 'Turbotville',
        '30': 'West'
      };
      
      const contractNumber = jobDetails.contractNumber || '';
      
      const bidNumber = jobDetails.bidNumber || '';
      
      const contractorId = jobDetails.customer || jobDetails.contractor || '';
      const contractorName = contractorMap.get(contractorId) || contractorId;
      
      const projectStatus = jobDetails.projectStatus || 'In Progress';
      
      const billingStatus = jobDetails.billingStatus || 'Current';
      
      const location = jobDetails.township 
        ? `${jobDetails.township}${jobDetails.srRoute ? ` - ${jobDetails.srRoute}` : ''}` 
        : jobDetails.location || '';
      
      const countyId = jobDetails.county || '';
      const countyName = countyMap.get(countyId) || countyId;
      
      const startDate = jobDetails.startDate || '';
      const endDate = jobDetails.endDate || '';
      
      const laborRate = parseFloat(jobDetails.laborRate) || 0;
      const fringeRate = parseFloat(jobDetails.fringeRate) || 0;
      
      return {
        id: job.id,
        jobNumber: job.job_number,
        bidNumber: bidNumber,
        projectStatus: projectStatus,
        billingStatus: billingStatus,
        contractNumber: contractNumber,
        location: location,
        county: countyName,
        branch: branchNameMap[job.branch_code] || job.branch_code,
        contractor: contractorName,
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
    
    return NextResponse.json(formattedJobs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected error fetching jobs' },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    const { division } = formData;
    const ownerTypeMap: Record<string, string> = {
      'PUBLIC': '22',
      'PRIVATE': '21'
    };
    const ownerTypeCode = ownerTypeMap[division]
    
    const branchCode = '10';
    const currentYear = new Date().getFullYear();
    
    const { data: highestSequential } = await supabase
      .from('job_numbers')
      .select('sequential_number')
      .eq('branch_code', branchCode)
      .eq('owner_type', ownerTypeCode)
      .eq('year', currentYear)
      .order('sequential_number', { ascending: false })
      .limit(1);
    
    let sequentialNumber = 1;
    if (highestSequential && highestSequential.length > 0) {
      sequentialNumber = highestSequential[0].sequential_number + 1;
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
