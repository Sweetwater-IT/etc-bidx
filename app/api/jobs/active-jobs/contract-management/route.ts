import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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