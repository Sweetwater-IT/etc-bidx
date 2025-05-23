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
    
    // Handle sorting parameters
    let orderBy = searchParams.get('orderBy') || 'created_at';
    // Map frontend column names to database column names
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
        default:
          // Use the sortBy value directly if it doesn't need mapping
          orderBy = sortBy || 'created_at';
      }
    }
    
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const ascending = sortOrder === 'asc';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    let tableName = 'available_jobs';
    let countQuery = supabase.from(tableName).select('id', { count: 'exact', head: true });
    let dataQuery = supabase
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);
      
    // Handle filter parameters
    const filtersParam = searchParams.get('filters');
    if (filtersParam) {
      try {
        const filters = JSON.parse(filtersParam);
        console.log('Parsed filters:', filters);
        
        // Apply each filter
        Object.entries(filters).forEach(([field, value]) => {
          console.log(`Processing filter: ${field} with value:`, value);
          
          // Skip empty values
          if (value === undefined || value === null || value === '') {
            console.log(`Skipping empty value for ${field}`);
            return;
          }
          
          let dbField = field;
          switch (field) {
            case 'county':
              dbField = 'county';
              break;
            case 'owner':
              dbField = 'owner';
              break;
            case 'branch':
              dbField = 'branch';
              console.log(`Branch filter with value: ${value}`);
              break;
            case 'estimator':
              dbField = 'estimator';
              break;
            case 'status':
              dbField = 'status';
              break;
            case 'dateField':
            case 'dateFrom':
            case 'dateTo':
              // Handle date filters separately
              console.log(`Date filter: ${field}`);
              return; // Skip the standard filter application
          }
          
          // Apply the filter
          if (field === 'estimator') {
            // For estimator, we need to match against the estimator field which might store the name
            // but we're filtering by ID, so we need to join with the users table
            // This is a simplification - in a real app, you'd need to handle this properly
            console.log('Estimator filter not fully implemented yet');
          } else {
            // Handle both array and single value cases
            if (Array.isArray(value)) {
              if (value.length > 0) {
                console.log(`Applying array filter: ${dbField} IN ${JSON.stringify(value)}`);
                dataQuery = dataQuery.in(dbField, value as string[]);
                countQuery = countQuery.in(dbField, value as string[]);
              }
            } else {
              console.log(`Applying single value filter: ${dbField} = ${value}`);
              dataQuery = dataQuery.eq(dbField, value);
              countQuery = countQuery.eq(dbField, value);
            }
          }
        });
        
        // Handle date range filters if present
        if (filters.dateField && filters.dateField.length > 0) {
          const dateField = filters.dateField[0];
          let dbDateField = '';
          
          // Map UI date field to database column
          if (dateField === 'Letting Date') {
            dbDateField = 'letting_date';
          } else if (dateField === 'Due Date') {
            dbDateField = 'due_date';
          }
          
          if (dbDateField && filters.dateFrom && filters.dateFrom.length > 0) {
            console.log(`Applying date from filter: ${dbDateField} >= ${filters.dateFrom[0]}`);
            dataQuery = dataQuery.gte(dbDateField, filters.dateFrom[0]);
            countQuery = countQuery.gte(dbDateField, filters.dateFrom[0]);
          }
          
          if (dbDateField && filters.dateTo && filters.dateTo.length > 0) {
            console.log(`Applying date to filter: ${dbDateField} <= ${filters.dateTo[0]}`);
            dataQuery = dataQuery.lte(dbDateField, filters.dateTo[0]);
            countQuery = countQuery.lte(dbDateField, filters.dateTo[0]);
          }
        }
      } catch (error) {
        console.error('Error parsing filters:', error);
      }
    }
    
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
            // Add filter parameters if any are active
            const filtersParam = searchParams.get('filters');
            if (filtersParam) {
              try {
                const filters = JSON.parse(filtersParam);
                console.log('Applying filters:', filters);
                
                // Apply each filter to the query
                Object.entries(filters).forEach(([field, values]) => {
                  if (Array.isArray(values) && values.length > 0) {
                    // Map frontend field names to database column names
                    let dbField = field;
                    switch (field) {
                      case 'county':
                        dbField = 'county';
                        break;
                      case 'owner':
                        dbField = 'owner';
                        break;
                      case 'status':
                        dbField = 'status';
                        break;
                    }
                    
                    // Apply the filter
                    dataQuery = dataQuery.in(dbField, values as string[]);
                    countQuery = countQuery.in(dbField, values as string[]);
                  }
                });
              } catch (error) {
                console.error('Error parsing filters:', error);
              }
            }
            dbStatus = 'Unset';
            break;
          default:
            dbStatus = status;
        }
        
        dataQuery = dataQuery.eq('status', dbStatus);
        countQuery = countQuery.eq('status', dbStatus);
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
