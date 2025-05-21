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
          .from('jobs_complete')
          .select('id, branch_code, project_status');
        
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
          archived: allJobs.filter(job => job.project_status === 'Archived').length
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
        billing_status,
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
        sale_items
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (branch && branch !== 'all') {
      if (branch === 'archived') {
        query = query.eq('project_status', 'Archived');
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

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, count, error } = await query;

    // Handle errors
    if (error) {
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
      // Process all jobs
      interface Job {
        id: any;
        job_number: string;
        branch_code: string;
        owner_type: string;
        created_at: string;
        project_status: string;
        billing_status: string;
        admin_data: any;
        contractor_name: string;
        customer_contract_number: string;
        project_manager: string;
        pm_email: string;
        pm_phone: string;
        total_cost: number;
        total_revenue: number;
        total_gross_profit: number;
        total_days: number;
        total_hours: number;
        total_phases: number;
        overdays: number;
        job_summary: string;
        equipment_rental: boolean;
        mpt_rental: boolean;
        flagging: boolean;
        service_work: boolean;
        sale_items: boolean;
        county?: { name: string; };
      }

      const formattedJobs = data?.map((job: Job) => {
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
        if (job.county && typeof job.county === 'object' && job.county.name) {
          countyName = job.county.name;
        } else if (adminData && adminData.county) {
          if (typeof adminData.county === 'string') {
            countyName = adminData.county;
          } else if (typeof adminData.county === 'object' && adminData.county.name) {
            countyName = adminData.county.name;
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
          contractNum = job.customer_contract_number;
        } else if (adminData && adminData.contractNumber) {
          contractNum = adminData.contractNumber;
        }
        
        return {
          id: job.id,
          jobNumber: job.job_number || '',
          bidNumber: adminData?.bidNumber || '',
          projectStatus: job.project_status || 'In Progress',
          billingStatus: job.billing_status || 'Current',
          contractNumber: contractNum,
          location: adminData?.location || '',
          county: countyName,
          branch: branchName,
          contractor: job.contractor_name || '',
          startDate: adminData?.startDate || '',
          endDate: adminData?.endDate || '',
          laborRate: adminData?.laborRate || 0,
          fringeRate: adminData?.fringeRate || 0,
          mpt: Boolean(job.mpt_rental),
          rental: Boolean(job.equipment_rental),
          permSigns: Boolean(adminData?.permSigns),
          flagging: Boolean(job.flagging),
          saleItems: Boolean(job.sale_items),
          overdays: job.overdays || 0,
          createdAt: job.created_at || '',
          status: job.project_status || 'In Progress',
        };
      }) || [];

      return NextResponse.json({
        data: formattedJobs,
        pagination: {
          page,
          pageSize: limit,
          pageCount: Math.ceil((count || 0) / limit),
          totalCount: count || 0
        }
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