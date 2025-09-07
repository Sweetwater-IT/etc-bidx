import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { safeNumber } from '@/lib/safe-number';

type AvailableJob = Database['public']['Tables']['available_jobs']['Insert'];

// GET: Fetch all bids with optional filtering, plus counts and stats
export async function GET(request: NextRequest) {
  try {    
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get date filter parameters for stats
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Handle sorting parameters
    let orderBy = searchParams.get('orderBy') || 'created_at';
    if (searchParams.get('sortBy')) {
      const sortBy = searchParams.get('sortBy');
      switch (sortBy) {
        case 'contractNumber':
          orderBy = 'contract_number';
          break;
        case 'lettingDate':
          orderBy = 'letting_date';
          break;
        case 'dueDate':
          orderBy = 'due_date';
          break;
        case 'createdAt':
          orderBy = 'created_at';
          break;
        default:
          orderBy = sortBy || 'created_at';
      }
    }

    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const ascending = sortOrder === 'asc';
    const offset = (page - 1) * limit;

    const tableName = 'available_jobs';
    const status = searchParams.get('status');
    const archived = searchParams.get('archived') === 'true';

    // First, get all contract numbers that exist in bid_estimates
    const existingBidsResult = await supabase
      .from('bid_estimates')
      .select('contract_number')

    const existingBidContracts = existingBidsResult.data?.map(item => item.contract_number) || [];

    // Build base queries with exclusion of jobs that already have bid estimates
    let countQuery = supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);

    let dataQuery = supabase
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);

    // Default: Exclude archived jobs unless explicitly requested
    if (!archived) {
      dataQuery = dataQuery.eq('archived', false);
      countQuery = countQuery.eq('archived', false);
    }

    // Handle filter parameters
    const filtersParam = searchParams.get('filters');
    if (filtersParam) {
      try {
        const filters = JSON.parse(filtersParam);

        Object.entries(filters).forEach(([field, value]) => {
          if (value === undefined || value === null || value === '') {
            return;
          }

          let dbField = field;
          switch (field) {
            case 'county':
            case 'owner':
            case 'branch':
            case 'estimator':
              dbField = field;
              break;
            case 'dateField':
            case 'dateFrom':
            case 'dateTo':
              return;
          }

          if (field === 'estimator') {
            console.log('Estimator filter not fully implemented yet');
          } else {
            if (Array.isArray(value)) {
              if (value.length > 0) {
                dataQuery = dataQuery.in(dbField, value as string[]);
                countQuery = countQuery.in(dbField, value as string[]);
              }
            } else {
              dataQuery = dataQuery.eq(dbField, value);
              countQuery = countQuery.eq(dbField, value);
            }
          }
        });

        // Handle date range filters
        if (filters.dateField && filters.dateField.length > 0) {
          const dateField = filters.dateField[0];
          let dbDateField = '';

          if (dateField === 'Letting Date') {
            dbDateField = 'letting_date';
          } else if (dateField === 'Due Date') {
            dbDateField = 'due_date';
          }

          if (dbDateField && filters.dateFrom && filters.dateFrom.length > 0) {
            dataQuery = dataQuery.gte(dbDateField, filters.dateFrom[0]);
            countQuery = countQuery.gte(dbDateField, filters.dateFrom[0]);
          }

          if (dbDateField && filters.dateTo && filters.dateTo.length > 0) {
            dataQuery = dataQuery.lte(dbDateField, filters.dateTo[0]);
            countQuery = countQuery.lte(dbDateField, filters.dateTo[0]);
          }
        }
      } catch (error) {
        console.error('Error parsing filters:', error);
      }
    }

    // Handle status and archived filtering
    if (archived) {
      dataQuery = dataQuery.eq('archived', true);
      countQuery = countQuery.eq('archived', true);
    } else if (status) {
      let dbStatus: string;
      switch (status) {
        case 'bid':
          dbStatus = 'Bid';
          break;
        case 'no-bid':
          dbStatus = 'No Bid';
          break;
        case 'unset':
          dbStatus = 'Unset';
          break;
        default:
          dbStatus = status;
      }
      dataQuery = dataQuery.eq('status', dbStatus);
      countQuery = countQuery.eq('status', dbStatus);
    }

    // Execute main queries
    const countResult = await countQuery;
    const dataResult = await dataQuery;

    if (countResult.error || dataResult.error) {
      const error = countResult.error || dataResult.error;
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bids', error: error?.message },
        { status: 500 }
      );
    }

    const totalCount = countResult.count || 0;
    const pageCount = Math.ceil(totalCount / limit);

    // Process alreadyBid information
    const processedData = dataResult.data || [];

    const response: any = {
      success: true,
      data: processedData,
      pagination: {
        page,
        pageSize: limit,
        pageCount,
        totalCount
      }
    };

    // Execute count queries if stats are requested
    if (includeStats) {
      const allCountResult = await supabase.from('available_jobs').select('id', { count: 'exact', head: true }).eq('archived', false)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`); // Exclude archived for 'all' count
      const unsetCountResult = await supabase.from('available_jobs').select('id', { count: 'exact', head: true }).eq('status', 'Unset').eq('archived', false)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);
      const bidCountResult = await supabase.from('available_jobs').select('id', { count: 'exact', head: true }).eq('status', 'Bid').eq('archived', false)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);
      const noBidCountResult = await supabase.from('available_jobs').select('id', { count: 'exact', head: true }).eq('status', 'No Bid').eq('archived', false)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);
      const archivedCountResult = await supabase.from('available_jobs').select('id', { count: 'exact', head: true }).eq('archived', true)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999);

      let filteredUnsetQuery = supabase.from('available_jobs').select('id', { count: 'exact', head: true }).eq('status', 'Unset').eq('archived', false)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);
      let filteredBidQuery = supabase.from('available_jobs').select('id', { count: 'exact', head: true }).eq('status', 'Bid').eq('archived', false)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);
      let filteredNoBidQuery = supabase.from('available_jobs').select('id', { count: 'exact', head: true }).eq('status', 'No Bid').eq('archived', false)
      .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);
      let filteredDueSoonQuery = supabase
        .from('available_jobs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['Unset', 'Bid'])
        .eq('archived', false)
        .gte('due_date', today.toISOString())
        .lte('due_date', sevenDaysFromNow.toISOString())
        .not('contract_number', 'in', `(${existingBidContracts.join(',')})`);

      if (startDate && endDate) {
        filteredUnsetQuery = filteredUnsetQuery.gte('letting_date', startDate).lte('letting_date', endDate);
        filteredBidQuery = filteredBidQuery.gte('letting_date', startDate).lte('letting_date', endDate);
        filteredNoBidQuery = filteredNoBidQuery.gte('letting_date', startDate).lte('letting_date', endDate);
        filteredDueSoonQuery = filteredDueSoonQuery.gte('letting_date', startDate).lte('letting_date', endDate);
      }

      const filteredUnsetResult = await filteredUnsetQuery;
      const filteredBidResult = await filteredBidQuery;
      const filteredNoBidResult = await filteredNoBidQuery;
      const dueSoonCountResult = await filteredDueSoonQuery;

      const counts = {
        all: allCountResult.count || 0,
        unset: unsetCountResult.count || 0,
        bid: bidCountResult.count || 0,
        'no-bid': noBidCountResult.count || 0,
        archived: archivedCountResult.count || 0
      };

      const filteredOpenBidsCount = (filteredUnsetResult.count || 0) + (filteredBidResult.count || 0);
      const filteredTotalBids = (filteredBidResult.count || 0) + (filteredNoBidResult.count || 0);
      const bidNoRatio = filteredTotalBids > 0
        ? ((filteredBidResult.count || 0) / filteredTotalBids * 100).toFixed(1)
        : '0.0';

      const stats = [
        { title: 'Open bids', value: filteredOpenBidsCount.toString() },
        { title: 'Jobs due in next 7 days', value: (dueSoonCountResult.count || 0).toString() },
        { title: 'Bid / No Bid Ratio', value: `${bidNoRatio}%` }
      ];

      response.counts = counts;
      response.stats = stats;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

// POST: Create a new bid (unchanged)
export async function POST(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Authentication status:', session ? 'Authenticated' : 'Not authenticated');

    const body = await request.json();

    const requiredFields = [
      'branch', 'contract_number', 'county', 'due_date',
      'letting_date', 'entry_date', 'location', 'owner',
      'platform', 'requestor', 'dbe_percentage', 'state_route'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = body[field];
      return value === null || value === undefined || value === '';
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields', missingFields },
        { status: 400 }
      );
    }

    if (typeof body.due_date === 'string' && !body.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = new Date(body.due_date).toISOString().split('T')[0].split('-');
      body.due_date = `${parts[0]}-${parts[1]}-${parts[2]}`;
    }

    if (typeof body.letting_date === 'string' && !body.letting_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = new Date(body.letting_date).toISOString().split('T')[0].split('-');
      body.letting_date = `${parts[0]}-${parts[1]}-${parts[2]}`;
    }

    if (typeof body.entry_date === 'string' && !body.entry_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = new Date(body.entry_date).toISOString().split('T')[0].split('-');
      body.entry_date = `${parts[0]}-${parts[1]}-${parts[2]}`;
    }

    console.log('Creating new bid with formatted dates:', {
      letting_date: body.letting_date,
      due_date: body.due_date,
      entry_date: body.entry_date
    });

    const newBid: AvailableJob = {
      ...body,
      dbe_percentage: parseInt(body.dbe_percentage),
      status: body.status || 'Unset',
      mpt: body.mpt ?? false,
      flagging: body.flagging ?? false,
      perm_signs: body.perm_signs ?? false,
      equipment_rental: body.equipment_rental ?? false,
      other: body.other ?? false,
    };

    const { data, error } = await supabase
      .from('available_jobs')
      .insert(newBid)
      .select();

    if (error) {
      console.error('Error creating bid:', error);
      if (error.code === '42501') {
        return NextResponse.json({
          error: 'Permission denied: Row-level security prevented this operation. Please check your database permissions.',
          details: 'You need to either disable RLS for this table or create appropriate policies in Supabase.',
          code: error.code
        }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Bid created successfully', data: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

