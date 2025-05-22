import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type AvailableJob = Database['public']['Tables']['available_jobs']['Insert'];

// GET: Fetch all bids with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    let tableName = 'available_jobs';
    let countQuery = supabase.from(tableName).select('id', { count: 'exact', head: true });
    let dataQuery = supabase
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);
    
    if (status) {
      // Special case for 'archived' filter - fetch from archived_available_jobs table instead
      if (status === 'archived') {
        tableName = 'archived_available_jobs';
        countQuery = supabase.from(tableName).select('id', { count: 'exact', head: true }).is('deleted_at', null);
        dataQuery = supabase
          .from(tableName)
          .select('*')
          .is('deleted_at', null)
          .order(orderBy, { ascending })
          .range(offset, offset + limit - 1);
      } else {
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
        
        countQuery = countQuery.eq('status', dbStatus);
        dataQuery = dataQuery.eq('status', dbStatus);
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
        { success: false, message: 'Failed to fetch bids', error: error?.message },
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

// POST: Create a new bid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'branch', 'contract_number', 'county', 'due_date', 
      'letting_date', 'entry_date', 'location', 'owner', 
      'platform', 'requestor', 'dbe_percentage', 'state_route'
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
    
    // Format dates if they are provided as strings
    if (typeof body.due_date === 'string') {
      body.due_date = new Date(body.due_date).toISOString();
    }
    
    if (typeof body.letting_date === 'string') {
      body.letting_date = new Date(body.letting_date).toISOString();
    }
    
    if (typeof body.entry_date === 'string') {
      // For entry_date, we only need the date part
      body.entry_date = new Date(body.entry_date).toISOString().split('T')[0];
    }
    
    // Set default values if not provided
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
      console.error(error)
      return NextResponse.json(
        { success: false, message: 'Failed to create bid', error: error.message },
        { status: 500 }
      );
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
