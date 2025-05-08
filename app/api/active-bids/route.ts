import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all active bids with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';
    const division = searchParams.get('division');

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Base query for both count and data
    const baseQuery = supabase.from('bid_estimates');
    
    // Count query to get total records
    let countQuery = baseQuery.select('id', { count: 'exact', head: true });
    
    // Data query to get paginated results
    let dataQuery = baseQuery
      .select('*')
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    console.log('API received status filter:', status);
    console.log('API received division filter:', division);

    // Apply filters to both queries
    if (status) {
      if (status === 'won-pending') {
        // Use case-insensitive matching for 'won-pending' status
        const orCondition = 'status.ilike.won-pending,status.ilike.Won-Pending,status.ilike.Won - Pending';
        countQuery = countQuery.or(orCondition);
        dataQuery = dataQuery.or(orCondition);
      } else if (status === 'won') {
        // Use case-insensitive matching for 'won' status
        const orCondition = 'status.ilike.won,status.ilike.Won';
        countQuery = countQuery.or(orCondition);
        dataQuery = dataQuery.or(orCondition);
      } else if (status === 'archived') {
        countQuery = countQuery.ilike('status', '%archived%').is('deleted_at', null);
        dataQuery = dataQuery.ilike('status', '%archived%').is('deleted_at', null);
      } else if (status === 'won,won-pending') {
        // Special case for getting both won and won-pending with all case variations
        const orCondition = 'status.ilike.won,status.ilike.Won,status.ilike.won-pending,status.ilike.Won-Pending,status.ilike.Won - Pending';
        countQuery = countQuery.or(orCondition);
        dataQuery = dataQuery.or(orCondition);
      } else {
        // Try case-insensitive filtering using ilike for text fields
        console.log('Using case-insensitive filter for status:', status);
        countQuery = countQuery.ilike('status', `%${status}%`);
        dataQuery = dataQuery.ilike('status', `%${status}%`);
      }
    }

    // Apply division filter if provided
    if (division && division !== 'all') {
      countQuery = countQuery.eq('division', division);
      dataQuery = dataQuery.eq('division', division);
    }

    // Execute both queries in parallel
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
    ]);

    if (countResult.error || dataResult.error) {
      const error = countResult.error || dataResult.error;
      return NextResponse.json(
        { success: false, message: 'Failed to fetch active bids', error: error?.message },
        { status: 500 }
      );
    }

    const totalCount = countResult.count || 0;
    const pageCount = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true, 
      data: dataResult.data || [],
      pagination: {
        page,
        pageSize: limit,
        pageCount,
        totalCount
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

// POST: Create a new active bid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = [
      'status', 'contract_number', 'owner', 'county', 'branch',
      'division', 'estimator', 'start_date', 'end_date', 'project_days',
      'base_rate', 'fringe_rate', 'rt_miles', 'rt_travel', 'rated_hours',
      'nonrated_hours', 'total_hours', 'phases'
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
          missingFields
        },
        { status: 400 }
      );
    }

    if (typeof body.start_date === 'string') {
      body.start_date = new Date(body.start_date).toISOString();
    }

    if (typeof body.end_date === 'string') {
      body.end_date = new Date(body.end_date).toISOString();
    }

    if (typeof body.letting_date === 'string' && body.letting_date) {
      body.letting_date = new Date(body.letting_date).toISOString();
    }

    const numericFields = [
      'type_iii_4ft', 'wings_6ft', 'h_stands', 'posts', 'sand_bags',
      'covers', 'spring_loaded_metal_stands', 'hi_vertical_panels',
      'type_xi_vertical_panels', 'b_lites', 'ac_lites', 'hi_signs_sq_ft',
      'dg_signs_sq_ft', 'special_signs_sq_ft', 'tma', 'arrow_board',
      'message_board', 'speed_trailer', 'pts', 'mpt_value',
      'mpt_gross_profit', 'mpt_gm_percent', 'perm_sign_value',
      'perm_sign_gross_profit', 'perm_sign_gm_percent', 'rental_value',
      'rental_gross_profit', 'rental_gm_percent'
    ];

    numericFields.forEach(field => {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        body[field] = 0;
      }
    });

    if (body.emergency_job === undefined) {
      body.emergency_job = false;
    }

    const { data, error } = await supabase
      .from('bid_estimates')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to create active bid', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('bid_estimates')
      .delete()
      .in('id', body.ids)
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete active bids', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data, count: body.ids.length });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}