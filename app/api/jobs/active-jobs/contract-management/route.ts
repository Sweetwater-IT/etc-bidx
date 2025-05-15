import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { JobCompleteView } from '@/types/jobs-view';
import { Database } from '@/types/database.types';
import { County } from '@/types/TCounty';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';
    const status = searchParams.get('status'); // won, pending, or all
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Base query from the jobs_list view which already has the flattened data
    let query = supabase
      .from('jobs_list')
      .select(`
        id,
        job_number,
        contract_number,
        contractor,
        letting_date,
        county,
        branch,
        estimator,
        created_at,
        project_status,
        start_date,
        end_date,
        project_days,
        total_hours,
        total_revenue
      `, { count: 'exact' })
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    // Apply status filter based on job_number prefix
    if (status && status !== 'all') {
      if (status === 'pending') {
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

    // Transform the data for the frontend
    const transformedData = (data || []).map(job => ({
      id: job.id,
      job_number: job.job_number,
      letting_date: job.letting_date, 
      contract_number: job.contract_number || '',
      contractor: job.contractor || '',
      status: job.job_number?.startsWith('P-') ? 'Pending' : 'Won',
      county: job.county || '',
      branch: job.branch || '',
      estimator: job.estimator || '',
      created_at: job.created_at,
      project_status: job.project_status,
      project_days: job.project_days,
      total_hours: job.total_hours,
      total_revenue: job.total_revenue
    }));

    // Get counts for different statuses
    let countData = {
      all: 0,
      won: 0,
      pending: 0
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
        pending: pendingCount || 0,
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

interface ContractManagementData {
  adminData: {
    contractNumber: string;
    estimator: string;
    division: 'PUBLIC' | 'PRIVATE' | null;
    lettingDate: Date | null;
    owner: 'PENNDOT' | 'TURNPIKE' | 'PRIVATE' | 'OTHER' | 'SEPTA' | null;
    county: County;
    srRoute: string;
    location: string;
    dbe: string;
    startDate: Date | null;
    endDate: Date | null;
    winterStart?: Date | undefined;
    winterEnd?: Date | undefined;
    owTravelTimeMins?: number;
    owMileage?: number;
    fuelCostPerGallon?: number;
    emergencyJob: boolean;
    rated: 'RATED' | 'NON-RATED';
    emergencyFields: {
      emergencyHIVerticalPanels?: number;
      emergencyTypeXIVerticalPanels?: number;
      emergencyBLites?: number;
      emergencyACLites?: number;
      emergencySharps?: number;
    };
  };
  customer: {
    name: string;
    id?: string;
  } | null;
  customerContractNumber: string;
  projectManager: string;
  pmEmail: string;
  pmPhone: string;
  sender: {
    name: string;
    email: string;
    role: string;
  };
  evDescription: string;
  addedFiles: {
    'W-9': boolean;
    'EEO-SHARP Policy': boolean;
    'Safety Program': boolean;
    'Sexual Harassment Policy': boolean;
    'Avenue of Appeals': boolean;
  };
  files: string[]; // File names/URLs
  cpr: 'STATE' | 'FEDERAL' | 'N/A';
  useShopRates: boolean;
  laborRate: string;
  fringeRate: string;
  selectedContractor: string;
  laborGroup: string;
}

export async function POST(request: NextRequest) {
  try {
    const contractNumber = await request.json();

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
      .eq('admin_data->>contractNumber', contractNumber) // Use ->> for JSON text extraction
      .single();

    if (jobError || !jobData) {
      return NextResponse.json(
        { message: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobData as JobCompleteView;

    // Map the data to the contract management format
    const contractManagementData: ContractManagementData = {
      adminData: {
        contractNumber: job.admin_data.contractNumber,
        estimator: job.admin_data.estimator,
        division: null, // You'll need to map this based on your business rules
        lettingDate: job.admin_data.lettingDate ? new Date(job.admin_data.lettingDate) : null,
        owner: job.admin_data.owner,
        county: job.admin_data.county as County,
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
      customer: job.contractor_name ? { name: job.contractor_name } : null,
      customerContractNumber: job.customer_contract_number || '',
      projectManager: job.project_manager || '',
      pmEmail: job.pm_email || '',
      pmPhone: job.pm_phone || '',
      sender: {
        name: '',
        email: '',
        role: '',
      },
      evDescription: '',
      addedFiles: {
        'W-9': false,
        'EEO-SHARP Policy': false,
        'Safety Program': false,
        'Sexual Harassment Policy': false,
        'Avenue of Appeals': false,
      },
      files: [],
      cpr: job.certified_payroll,
      useShopRates: false,
      laborRate: '32.75', // Default values - you may want to fetch these from settings
      fringeRate: '25.5',  // Default values - you may want to fetch these from settings
      selectedContractor: job.contractor_name || '',
      laborGroup: 'labor-group-3',
    };

    return NextResponse.json(contractManagementData);
  } catch (error) {
    console.error('Error fetching contract management data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}