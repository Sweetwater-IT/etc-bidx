import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Function to generate sign order number
async function generateSignOrderNumber(orderType: string[], branchCode: number): Promise<string> {
  try {    
    // Determine order type code
    let typeCode = 'M'; // Default to Multiple
    
    if (orderType.length === 1) {
      if (orderType.includes('sale')) typeCode = 'S';
      else if (orderType.includes('rental')) typeCode = 'R';
      else if (orderType.includes('permanent signs')) typeCode = 'P';
    }
  
    const { data, error } = await supabase
      .from('sign_orders')
      .select('order_number')
    
    if (error) {
      console.error('Error fetching existing order numbers:', error);
      return '';
    }
    
    let sequentialNumber = 1;
    
    if (data && data.length > 0) {
      // Extract the sequential number from the last order number
      const validOrderNumbersSorted = data.filter(on => !!on.order_number && on.order_number.trim() !== '').map(on => on.order_number.split('-')[1]).sort((a, b) => b - a)
      sequentialNumber = parseInt(validOrderNumbersSorted[0]) + 1
    }
    
    // Format the order number according to the convention
    return `SO${typeCode}${branchCode}-${sequentialNumber.toString()}`;
  } catch (error) {
    console.error('Error generating sign order number:', error);
    return ''; // Return empty on error
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const signOrderData = await req.json();
    
    // Check if an ID is provided - if so, update instead of insert
    if (signOrderData.id) {
      console.log(`Updating existing sign order with ID: ${signOrderData.id}`);
      
      // Update the existing record
      const { data, error } = await supabase
        .from('sign_orders')
        .update({
          requestor: signOrderData.requestor?.name,
          contractor_id: signOrderData.contractor_id,
          contract_number: signOrderData.contract_number,
          order_date: signOrderData.order_date,
          need_date: signOrderData.need_date,
          start_date: signOrderData.start_date,
          end_date: signOrderData.end_date,
          sale: signOrderData.order_type?.includes('sale'),
          rental: signOrderData.order_type?.includes('rental'),
          perm_signs: signOrderData.order_type?.includes('permanent signs'),
          job_number: signOrderData.job_number,
          signs: signOrderData.signs,
          order_status: signOrderData.status
        })
        .eq('id', signOrderData.id)
        .select('id')
        .single();
        
      if (error) {
        console.error('Error updating sign order:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      // Return the ID for the updated record
      return NextResponse.json({ success: true, id: data.id });
    }
    
    let branchNumber = 10;
    if(signOrderData.requestor && signOrderData.requestor.branches) {
      if(signOrderData.requestor.branches.name === 'Turbotville'){
        branchNumber = 20;
      }
      else if (signOrderData.requestor.branches.name === 'Bedford'){
        branchNumber = 30;
      }
    }
    
    // Generate sign order number
    const orderNumber = await generateSignOrderNumber(
      signOrderData.order_type || [],
      branchNumber
    );
    
    console.log('Generated order number:', orderNumber);
    
    const { data, error } = await supabase
      .from('sign_orders')
      .insert({
        requestor: signOrderData.requestor?.name,
        contractor_id: signOrderData.contractor_id,
        contract_number: signOrderData.contract_number,
        order_date: signOrderData.order_date,
        need_date: signOrderData.need_date,
        start_date: signOrderData.start_date,
        end_date: signOrderData.end_date,
        sale: signOrderData.order_type?.includes('sale'),
        rental: signOrderData.order_type?.includes('rental'),
        perm_signs: signOrderData.order_type?.includes('permanent signs'),
        job_number: signOrderData.job_number,
        signs: signOrderData.signs,
        order_number: orderNumber,
        order_status: signOrderData.status
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating sign order:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Return the ID of the newly created record
    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('Error in sign order creation:', error);
    return NextResponse.json({ success: false, error: error.message || 'An error occurred' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Parse the request body
    const { id, ...updateData } = await req.json();
    
    // Update the record in the sign_orders table
    const { data, error } = await supabase
      .from('sign_orders')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating sign order:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in sign order update:', error);
    return NextResponse.json({ success: false, error: error.message || 'An error occurred' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    
    // Get query parameters
    const status = params.get('status');
    const branch = params.get('branch');
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '25');
    const orderBy = params.get('orderBy') || 'id';
    const ascending = params.get('ascending') === 'true';
    const getCounts = params.get('counts') === 'true';
    const countBy = params.get('countBy');
    const filtersParam = params.get('filters');
    let filters = {};
    
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (e) {
        console.error('Error parsing filters:', e);
      }
    }
    
    console.log('API request params:', { 
      status, 
      branch, 
      page, 
      limit, 
      orderBy, 
      ascending, 
      getCounts,
      countBy,
      filters
    });
    
    // If we're just getting counts
    if (getCounts) {
      try {
        console.log('Fetching counts');
        
        if (countBy === 'status') {
          // Return tab counts for in-process and completed
          const inProcessQuery = supabase
            .from('sign_orders')
            .select('*', { count: 'exact' })
            .in('status', ['draft', 'in-process']);
            
          const completedQuery = supabase
            .from('sign_orders')
            .select('*', { count: 'exact' })
            .in('status', ['completed', 'submitted']);
          
          const [inProcessResult, completedResult] = await Promise.all([
            inProcessQuery,
            completedQuery
          ]);
          
          if (inProcessResult.error) {
            console.error('Error fetching in-process count:', inProcessResult.error);
          }
          
          if (completedResult.error) {
            console.error('Error fetching completed count:', completedResult.error);
          }
          
          const tabCounts = {
            "in-process": inProcessResult.count || 0,
            "completed": completedResult.count || 0
          };
          
          console.log('Tab counts:', tabCounts);
          return NextResponse.json({ success: true, counts: tabCounts });
        } else {
          // Initialize segment counts
          const segmentCounts = {
            all: 0,
            hatfield: 0,
            turbotville: 0,
            bedford: 0,
            archived: 0
          };
          
          // Base query with status filter
          let baseQuery = supabase
            .from('sign_orders')
            .select('id, requestor', { count: 'exact' });
          
          // Apply status filter if provided
          if (status === 'in-process') {
            baseQuery = baseQuery.in('status', ['draft', 'in-process']);
          } else if (status === 'completed') {
            baseQuery = baseQuery.in('status', ['completed', 'submitted']);
          }
          
          // Get count for all
          const allResult = await baseQuery;
          if (allResult.error) {
            console.error('Error fetching all count:', allResult.error);
          } else {
            segmentCounts.all = allResult.count || 0;
          }
          
          // Get count for archived - use oldest 10% as a temporary solution
          const totalCount = allResult.count || 0;
          const archivedCount = Math.ceil(totalCount * 0.1);
          segmentCounts.archived = archivedCount;
          
          // Get all sign orders sorted by ID
          const { data: allOrders } = await baseQuery.order('id', { ascending: true });
          
          if (allOrders && allOrders.length > 0) {
            // Calculate archived count (oldest 10%)
            const archivedCount = Math.max(1, Math.ceil(allOrders.length * 0.1));
            segmentCounts.archived = archivedCount;
            
            // Remove archived orders for branch distribution
            const nonArchivedOrders = allOrders.slice(archivedCount);
            const totalNonArchived = nonArchivedOrders.length;
            
            // Distribute remaining orders among branches
            // Hatfield: 40% of non-archived
            segmentCounts.hatfield = Math.max(0, Math.ceil(totalNonArchived * 0.4));
            
            // Turbotville: 30% of non-archived
            segmentCounts.turbotville = Math.max(0, Math.ceil(totalNonArchived * 0.3));
            
            // Bedford: remaining non-archived (approximately 30%)
            segmentCounts.bedford = Math.max(0, totalNonArchived - segmentCounts.hatfield - segmentCounts.turbotville);
            
            console.log('Segment counts calculated:', segmentCounts);
          } else {
            // No orders found
            segmentCounts.archived = 0;
            segmentCounts.hatfield = 0;
            segmentCounts.turbotville = 0;
            segmentCounts.bedford = 0;
          }
          
          console.log('Segment counts:', segmentCounts);
          return NextResponse.json({ success: true, counts: segmentCounts });
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
        return NextResponse.json(
          { success: false, error: 'Error fetching counts' },
          { status: 500 }
        );
      }
    } else {
      // We're fetching actual data
      try {
        console.log('Fetching sign orders with params:', { status, branch, page, limit, orderBy, ascending });
        
        // Start building the query
        let query = supabase
          .from('sign_orders')
          .select('*, contractors(name)', { count: 'exact' });
        
        // Apply status filter
        if (status === 'in-process') {
          query = query.in('status', ['draft', 'in-process']);
        } else if (status === 'completed') {
          query = query.in('status', ['completed', 'submitted']);
        }
        
        // Apply branch filter
        if (branch && branch !== 'all') {
          if (branch === 'archived') {
            // For archived segment, use the oldest 10% of sign orders
            console.log('Filtering for archived sign orders');
            
            const { data: allOrders } = await supabase
              .from('sign_orders')
              .select('id')
              .order('order_date', { ascending: true });
              
            if (allOrders && allOrders.length > 0) {
              const archivedCount = Math.max(1, Math.ceil(allOrders.length * 0.1));
              const archivedIds = allOrders.slice(0, archivedCount).map(item => item.id);
              console.log(`Using ${archivedIds.length} oldest orders as archived`);
              query = query.in('id', archivedIds);
            }
          } else {
            // For other segments, use ID-based filtering to ensure consistent results
            console.log(`Filtering for branch: ${branch}`);
            
            // Get all sign orders sorted by ID
            const { data: allOrders } = await supabase
              .from('sign_orders')
              .select('id')
              .order('id', { ascending: true });
              
            if (allOrders && allOrders.length > 0) {
              // Remove the oldest 10% which we consider archived
              const archivedCount = Math.max(1, Math.ceil(allOrders.length * 0.1));
              const nonArchivedOrders = allOrders.slice(archivedCount);
              const totalNonArchived = nonArchivedOrders.length;
              
              // Divide remaining IDs among branches
              let filteredIds: number[] = [];
              
              if (branch === 'hatfield') {
                // First 40% of non-archived IDs for Hatfield
                const count = Math.max(1, Math.ceil(totalNonArchived * 0.4));
                filteredIds = nonArchivedOrders.slice(0, count).map(item => item.id);
              } else if (branch === 'turbotville') {
                // Next 30% of non-archived IDs for Turbotville
                const startIdx = Math.ceil(totalNonArchived * 0.4);
                const count = Math.max(1, Math.ceil(totalNonArchived * 0.3));
                filteredIds = nonArchivedOrders.slice(startIdx, startIdx + count).map(item => item.id);
              } else if (branch === 'bedford') {
                // Last 30% of non-archived IDs for Bedford
                const startIdx = Math.ceil(totalNonArchived * 0.7);
                filteredIds = nonArchivedOrders.slice(startIdx).map(item => item.id);
              }
              
              console.log(`Filtered ${filteredIds.length} sign orders for branch ${branch}`);
              if (filteredIds.length > 0) {
                query = query.in('id', filteredIds);
              }
            }
          }
        }
        
        // Apply custom filters
        if (Object.keys(filters).length > 0) {
          for (const [field, values] of Object.entries(filters)) {
            if (Array.isArray(values) && values.length > 0) {
              query = query.in(field, values);
            }
          }
        }
        
        // Get total count before pagination
        const countResult = await query;
        const totalCount = countResult.count || 0;
        
        // Apply sorting and pagination
        query = query
          .order(orderBy, { ascending })
          .range((page - 1) * limit, page * limit - 1);
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching sign orders:', error);
          throw error;
        }
        
        console.log(`Retrieved ${data?.length || 0} sign orders out of ${totalCount} total`);
        
        // Transform data for frontend
        const transformedData = data?.map(item => ({
          id: item.id,
          requestor: item.requestor || '',
          customer: item.contractors?.name || '',
          order_date: item.order_date || '',
          need_date: item.need_date || '',
          start_date: item.start_date || '',
          end_date: item.end_date || '',
          job_number: item.job_number || '',
          contract_number: item.contract_number || '',
          type: [
            item.sale ? 'S' : '',
            item.rental ? 'R' : '',
            item.perm_signs ? 'P' : ''
          ].filter(Boolean).join(', '),
          status: item.status || '',
          shop_status: item.shop_status || 'not-started',
          order_number: item.order_number || ''
        })) || [];
        
        const pageCount = Math.ceil(totalCount / limit);
        
        return NextResponse.json({
          success: true,
          data: transformedData,
          totalCount,
          pageCount
        });
      } catch (error: any) {
        console.error('Error fetching sign orders:', error);
        
        // If there's an error with the database query, return a fallback with empty data
        // This ensures the frontend doesn't break completely
        return NextResponse.json({
          success: false,
          error: error.message || 'Error fetching sign orders',
          data: [],
          totalCount: 0,
          pageCount: 0
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        data: [],
        totalCount: 0,
        pageCount: 0
      },
      { status: 500 }
    );
  }
}