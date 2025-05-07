import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET endpoint to fetch jobs with filtering
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch');
    
    // First, fetch all users to create a map of user IDs to names
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    }
    
    console.log('Users query result:', users ? `Found ${users.length} users` : 'No users found or null result');
    
    // Check if the users table exists
    const { data: tables } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    console.log('Available tables:', tables?.map(t => t.tablename));
    
    // Create a map of user IDs to full names
    const userMap = new Map();
    
    if (users && users.length > 0) {
      console.log('Processing users:', users.length);
      
      users.forEach(user => {
        // Create a full name for each user
        const fullName = user.name || user.email || `User ${user.id}`;
        
        console.log(`User ID ${user.id} (${typeof user.id}): ${fullName}`);
        
        // Store the ID as a number (since database IDs are integers)
        userMap.set(Number(user.id), fullName);
      });
    } else {
      console.log('No users found, creating fallback map');
      // Create a fallback map with some common IDs
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(id => {
        userMap.set(id, `User ${id}`);
      });
    }
    
    // Now fetch jobs with filtering
    let query = supabase.from('jobs')
      .select('*, job_numbers!inner(*)')
      .order('created_at', { ascending: false });
    
    if (branch && branch !== 'all') {
      if (branch === 'archived') {
        query = query.contains('job_details', { projectStatus: 'Archived' });
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
    
    query = query.order('created_at', { ascending: false });
    
    const { data: jobs, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error },
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
      
      // Extract letting date - check multiple possible field names
      const lettingDate = 
        jobDetails.lettingDate || 
        jobDetails.letting_date || 
        jobDetails.bidDate || 
        jobDetails.bid_date || 
        null;
      
      // Extract estimator ID and convert to number
      let estimatorId: string | null = null;
      let estimatorName = 'Not Assigned';
      
      const rawEstimatorId = 
        jobDetails.estimator || 
        jobDetails.Estimator || 
        jobDetails.bidEstimator || 
        jobDetails.bid_estimator || 
        null;
      
      if (rawEstimatorId !== null && rawEstimatorId !== undefined) {
        // Convert string ID to number (since database IDs are integers)
        estimatorId = String(rawEstimatorId);
        const numericId = parseInt(estimatorId);
        
        if (!isNaN(numericId)) {
          // Look up the name in our map using the numeric ID
          const lookupName = userMap.get(numericId);
          if (lookupName) {
            estimatorName = lookupName;
          } else {
            estimatorName = `Unknown User (ID: ${numericId})`;
          }
        } else {
          estimatorName = `Unknown User (ID: ${estimatorId})`;
        }
      }
      
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
        createdAt: job.created_at,
        lettingDate: lettingDate,
        estimator: estimatorName,
        estimatorId: estimatorId
      };
    });
    
    return NextResponse.json(formattedJobs);
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
