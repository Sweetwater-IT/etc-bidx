import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const orderBy = searchParams.get('orderBy') || 'order_date';
    const ascending = searchParams.get('ascending') === 'true';
    const counts = searchParams.get('counts') === 'true';
    const branch = searchParams.get('branch');
    const filtersJson = searchParams.get('filters');
    const statusParam = searchParams.get('status');
    const debug = searchParams.get('debug') === 'true';

    // Parse filters if present
    const filters = filtersJson ? JSON.parse(filtersJson) : {};

    // If we're just getting counts
    if (counts) {
      // Check if we're coming from the load-sheet page which needs both Draft and Submitted
      // The load-sheet page sends status=Draft,Submitted in the request
      let statusValues: string[] = [];
      if (statusParam && statusParam.includes('Draft')) {
        // Handle multiple statuses separated by commas for the load-sheet page
        const statuses = statusParam.split(',').map(s => s.trim());
        
        // Create an array with all case variations for each status
        statuses.forEach(status => {
          statusValues.push(status, status.toLowerCase(), status.toUpperCase());
        });

      } else {
        // For sign-shop-orders page, count all orders (including those with null/empty status)
        statusValues = []; // Empty array means no status filter
      }

      // Get total count with or without status filter
      let countQuery = supabase
        .from('sign_orders')
        .select('*', { count: 'exact', head: true });
      
      if (statusValues.length > 0) {
        countQuery = countQuery.in('status', statusValues);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        console.error('Error getting total count:', countError);
        return NextResponse.json({ success: false, error: 'Failed to get counts' }, { status: 500 });
      }
      
      // Get all users with their branch_ids
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('name, branch_id');
        
      if (usersError) {
        console.error('Error getting users:', usersError);
      }
      
      // Create a map of user names to branch_ids
      const userBranchMap = (users || []).reduce((map: any, user: any) => {
        map[user.name] = user.branch_id;
        return map;
      }, {});
      
      // Get all orders with their requestors that match the status filter (or all if no filter)
      let ordersQuery = supabase
        .from('sign_orders')
        .select('requestor');
      
      if (statusValues.length > 0) {
        ordersQuery = ordersQuery.in('status', statusValues);
      }
      
      const { data: allOrders, error: allOrdersError } = await ordersQuery;
        
      if (allOrdersError) {
        console.error('Error getting all orders:', allOrdersError);
      }
      
      // Initialize branch counts with proper naming convention
      const branchCounts: Record<string, number> = {
        all: totalCount || 0,
        turbotville: 0,   // branch_id 1
        hatfield: 0,      // branch_id 2
        bedford: 0,       // branch_id 3
        archived: 0
      };
      
      // Map branch IDs to the expected frontend names (correct mapping)
      const branchIdToNameMap: Record<number, string> = {
        1: 'turbotville',
        2: 'hatfield', 
        3: 'bedford'
      };
      
      // Count orders by branch using the requestor's branch
      (allOrders || []).forEach((order: any) => {
        const branchId = userBranchMap[order.requestor];
        if (branchId && branchIdToNameMap[branchId]) {
          const branchName = branchIdToNameMap[branchId];
          branchCounts[branchName] = (branchCounts[branchName] || 0) + 1;
        }
      });

      return NextResponse.json({ success: true, counts: branchCounts });
    }

    // Build the query for fetching sign orders
    let query = supabase
      .from('sign_orders')
      .select(`
        id,
        requestor,
        contractor_id,
        job_number,
        contract_number,
        order_date,
        need_date,
        sale,
        rental,
        perm_signs,
        status,
        shop_status,
        order_number
      `);
    
    // Check if we're coming from the load-sheet page which needs both Draft and Submitted
    // The load-sheet page sends status=Draft,Submitted in the request
    if (statusParam && statusParam.includes('Draft')) {
      // Handle multiple statuses separated by commas for the load-sheet page
      const statuses = statusParam.split(',').map(s => s.trim());
      
      // Create an array with all case variations for each status
      const statusValues: string[] = [];
      statuses.forEach(status => {
        statusValues.push(status, status.toLowerCase(), status.toUpperCase());
      });
      
      query = query.in('status', statusValues);

    } else {
      // For sign-shop-orders page, show all orders (including those with null/empty status)
      // Don't filter by status unless specifically requested
      // query = query.in('status', ['Submitted', 'submitted', 'SUBMITTED']);
    }

    // Apply branch filter if present
    if (branch && branch !== 'all') {
      // Map branch names to IDs (correct mapping)
      const branchNameToIdMap: Record<string, number> = {
        'turbotville': 1,
        'hatfield': 2,
        'bedford': 3,
        'archived': -1  // Special case for archived
      };
      
      // Get branch ID from name (case insensitive)
      let branchId: number | null = null;
      const lowerBranch = branch.toLowerCase();
      
      if (branchNameToIdMap[lowerBranch] !== undefined) {
        branchId = branchNameToIdMap[lowerBranch];
      }
      
      if (branchId !== null && branchId !== -1) {
        // Get users from the specified branch
        const { data: branchUsers, error: branchUsersError } = await supabase
          .from('users')
          .select('name')
          .eq('branch_id', branchId);
          
        if (branchUsersError) {
          console.error('Error fetching branch users:', branchUsersError);
        } else if (branchUsers && branchUsers.length > 0) {
          // Get the names of users in this branch
          const userNames = branchUsers.map(user => user.name);
          
          // Filter orders by requestor name
          query = query.in('requestor', userNames);
        }
      } else if (branchId === -1) {
        // Handle archived filter - you might want to add an archived field or different logic here
        // For now, this will return no results since we don't have archived logic implemented
        query = query.eq('status', 'Archived'); // This might need adjustment based on your archive strategy
      }
    }

    // Apply any additional filters from the query params
    if (filters) {
      // Example: filter by job_number if provided
      if (filters.job_number) {
        query = query.ilike('job_number', `%${filters.job_number}%`);
      }
      
      // Example: filter by requestor if provided
      if (filters.requestor) {
        query = query.ilike('requestor', `%${filters.requestor}%`);
      }
    }

    // Apply sorting
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    // Apply pagination
    if (page && limit) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit - 1;
      query = query.range(startIndex, endIndex);
    }

    // Execute the query
    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Get contractor information for all orders
    const contractorIds = orders?.map(order => order.contractor_id).filter(Boolean) || [];
    
    // Fetch contractor data for all orders in a single query
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('id, display_name')
      .in('id', contractorIds);
      
    if (contractorsError) {
      console.error('Error fetching contractors:', contractorsError);
    }
    
    // Create a map of contractor_id to display_name for quick lookup
    const contractorMap = (contractors || []).reduce((map: any, contractor: any) => {
      map[contractor.id] = contractor.display_name;
      return map;
    }, {});
    
    // Get branch information from users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('name, branch_id');
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
    }
    
    // Get branch names
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name');
      
    if (branchesError) {
      console.error('Error fetching branches:', branchesError);
    }
    
    // Create maps for quick lookups
    const userBranchMap = (users || []).reduce((map: any, user: any) => {
      map[user.name] = user.branch_id;
      return map;
    }, {});
    
    // Map branch IDs to expected UI branch names (correct mapping)
    // The UI expects specific branch names like 'Turbotville', 'Hatfield', 'Bedford'
    const branchNameMap: Record<number, string> = {
      1: 'Turbotville',
      2: 'Hatfield',
      3: 'Bedford'
    };
    
    // Add any branch names from the database as a fallback
    (branches || []).forEach((branch: any) => {
      if (!branchNameMap[branch.id]) {
        branchNameMap[branch.id] = branch.name;
      }
    });
    
    // Process the orders to add customer names and other fields
    const processedOrders = orders?.map((order: any) => {
      // Format dates for consistent display
      const orderDate = order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : null;
      const needDate = order.need_date ? new Date(order.need_date).toISOString().split('T')[0] : null;
      
      // Get customer name from the contractors map
      const customerName = order.contractor_id && contractorMap[order.contractor_id] 
        ? contractorMap[order.contractor_id] 
        : '-';
      
      // Get branch name based on requestor
      let branchName = 'Unknown';
      if (order.requestor) {
        const branchId = userBranchMap[order.requestor];
        if (branchId && branchNameMap[branchId]) {
          branchName = branchNameMap[branchId];
        }
      }
      
      const processedOrder = {
        ...order,
        customer: customerName,
        branch: branchName,
        assigned_to: order.assigned_to || 'Unassigned',
        type: '-',
        order_date: orderDate,
        need_date: needDate,
        shop_status: order.shop_status || 'not-started'
      };
      
      return processedOrder;
    }) || [];

    // Get total count for pagination (without status filter for sign-shop-orders)
    let paginationCountQuery = supabase
      .from('sign_orders')
      .select('*', { count: 'exact', head: true });
    
    // Apply the same filters that were applied to the main query
    if (statusParam && statusParam.includes('Draft')) {
      const statuses = statusParam.split(',').map(s => s.trim());
      const statusValues: string[] = [];
      statuses.forEach(status => {
        statusValues.push(status, status.toLowerCase(), status.toUpperCase());
      });
      paginationCountQuery = paginationCountQuery.in('status', statusValues);
    }
    
    const { count: totalCount, error: countError } = await paginationCountQuery;

    if (countError) {
      console.error('Error fetching total count:', countError);
      return NextResponse.json({ success: false, error: 'Failed to fetch total count' }, { status: 500 });
    }

    // Calculate total pages for pagination
    const pages = Math.ceil((totalCount || 0) / limit);
    
    return NextResponse.json({
      success: true,
      orders: processedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages
      }
    });
  } catch (error) {
    console.error('Error processing sign shop orders request:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}