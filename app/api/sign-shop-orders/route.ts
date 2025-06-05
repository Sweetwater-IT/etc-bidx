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
      // Prepare status filter values
      let statusValues: string[] = [];
      if (statusParam) {
        // Handle multiple statuses separated by commas
        const statuses = statusParam.split(',').map(s => s.trim());
        
        // Create an array with all case variations for each status
        statuses.forEach(status => {
          statusValues.push(status, status.toLowerCase(), status.toUpperCase());
        });
      } else {
        // Default behavior - include only Draft and Submitted status orders
        // Explicitly exclude shop statuses like 'in-process', 'not-started', 'on-order', 'complete'
        statusValues = ['Draft', 'draft', 'DRAFT', 'Submitted', 'submitted', 'SUBMITTED'];
        
        // Make sure we're not including any shop statuses
        statusValues = statusValues.filter(status => 
          !['in-process', 'not-started', 'on-order', 'complete'].includes(status.toLowerCase()));
      }

      // Get total count across all branches using the database function
      const { data: totalData, error: totalError } = await supabase
        .rpc('get_sign_orders_count', { status_values: statusValues });

      if (totalError) {
        console.error('Error fetching total count:', totalError);
        return NextResponse.json({ success: false, error: 'Failed to get total count' }, { status: 500 });
      }

      // Get count for Hatfield branch
      const { data: hatfieldData, error: hatfieldError } = await supabase
        .rpc('get_sign_orders_count_by_branch', { status_values: statusValues, branch_name: 'hatfield' });

      if (hatfieldError) {
        console.error('Error fetching Hatfield count:', hatfieldError);
        return NextResponse.json({ success: false, error: 'Failed to get Hatfield count' }, { status: 500 });
      }

      // Get count for Turbotville branch
      const { data: turbotvilleData, error: turbotvilleError } = await supabase
        .rpc('get_sign_orders_count_by_branch', { status_values: statusValues, branch_name: 'turbotville' });

      if (turbotvilleError) {
        console.error('Error fetching Turbotville count:', turbotvilleError);
        return NextResponse.json({ success: false, error: 'Failed to get Turbotville count' }, { status: 500 });
      }

      // Get count for Bedford branch
      const { data: bedfordData, error: bedfordError } = await supabase
        .rpc('get_sign_orders_count_by_branch', { status_values: statusValues, branch_name: 'bedford' });

      if (bedfordError) {
        console.error('Error fetching Bedford count:', bedfordError);
        return NextResponse.json({ success: false, error: 'Failed to get Bedford count' }, { status: 500 });
      }

      // Get count for archived orders
      const { data: archivedData, error: archivedError } = await supabase
        .rpc('get_sign_orders_count_by_branch', { status_values: statusValues, branch_name: 'archived' });

      if (archivedError) {
        console.error('Error fetching archived count:', archivedError);
        return NextResponse.json({ success: false, error: 'Failed to get archived count' }, { status: 500 });
      }

      // Return the counts for each branch
      const statusCounts = {
        'all': totalData || 0,
        'hatfield': hatfieldData || 0,
        'turbotville': turbotvilleData || 0,
        'bedford': bedfordData || 0,
        'archived': archivedData || 0
      };

      return NextResponse.json({
        success: true,
        counts: statusCounts
      });
    }

    // Build the query for fetching sign orders
    let query = supabase
      .from('sign_orders')
      .select(`
        id,
        requestor,
        contractor_id,
        contractors!contractor_id(name),
        job_number,
        contract_number,
        order_date,
        need_date,
        sale,
        rental,
        perm_signs,
        status,
        order_number
      `);
    
    // Filter by status
    if (statusParam) {
      // Handle multiple statuses separated by commas
      const statuses = statusParam.split(',').map(s => s.trim());
      
      // Create an array with all case variations for each status
      const statusValues: string[] = [];
      statuses.forEach(status => {
        statusValues.push(status, status.toLowerCase(), status.toUpperCase());
      });
      
      query = query.in('status', statusValues);
    } else {
      // Default behavior - include both Draft and Submitted status orders with all case variations
      query = query.in('status', ['Draft', 'draft', 'DRAFT', 'Submitted', 'submitted', 'SUBMITTED']);
    }

    // Apply branch filter if present
    // We need to use a raw SQL query to join with users and branches tables
    if (branch) {
      try {
        // Prepare status values for branch filtering
        let branchStatusValues: string[] = [];
        if (statusParam) {
          // Handle multiple statuses separated by commas
          const statuses = statusParam.split(',').map(s => s.trim());
          
          // Create an array with all case variations for each status
          statuses.forEach(status => {
            branchStatusValues.push(status, status.toLowerCase(), status.toUpperCase());
          });
        } else {
          // Default behavior - include both Draft and Submitted status orders
          branchStatusValues = ['Draft', 'draft', 'DRAFT', 'Submitted', 'submitted', 'SUBMITTED'];
        }
        
        // Use direct SQL query instead of RPC to avoid type issues
        const { data: branchFilteredData, error: branchFilterError } = await supabase
          .from('sign_orders')
          .select(`
            id, 
            requestor,
            contractor_id,
            contractors!contractor_id(name),
            job_number,
            contract_number,
            order_date,
            need_date,
            sale,
            rental,
            perm_signs,
            status,
            order_number
          `)
          .in('status', branchStatusValues)
          .order(orderBy || 'order_date', { ascending })
          .range((page - 1) * limit, page * limit - 1);

        // Debug: Log the raw branch-filtered data
        console.log('Raw branch-filtered data:', JSON.stringify(branchFilteredData, null, 2));
        // Check specifically for order with ID 27
        if (branchFilteredData && branchFilteredData.length > 0) {
          console.log('First branch order order_number:', branchFilteredData[0].order_number);
          console.log('Branch order with ID 27:', branchFilteredData.find((o: any) => o.id === 27));
        }

        if (branchFilterError) {
          console.error('Error filtering orders:', branchFilterError);
          return NextResponse.json({ success: false, error: 'Failed to filter orders' }, { status: 500 });
        }

        // Filter by branch using JavaScript since we can't join directly in Supabase query
        // Get all users with their branches
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('name, branches!branch_id(name)');

        if (usersError) {
          console.error('Error fetching users by branch:', usersError);
          return NextResponse.json({ success: false, error: 'Failed to fetch users by branch' }, { status: 500 });
        }

        // Get list of users in this branch
        const userNames = users
          .filter((user: any) => {
            // Check if user has branch data
            if (!user.branches) return false;
            
            // Handle both array and object formats
            if (Array.isArray(user.branches)) {
              return user.branches.some((b: any) => 
                b.name && b.name.toLowerCase() === branch.toLowerCase()
              );
            } else if (typeof user.branches === 'object') {
              return user.branches.name && 
                user.branches.name.toLowerCase() === branch.toLowerCase();
            }
            return false;
          })
          .map((user: any) => user.name);
          
        console.log(`Found ${userNames.length} users in branch ${branch}:`, userNames);
        
        // Filter orders by requestor being in the branch
        const branchOrders = branchFilteredData.filter((order: any) => 
          userNames.includes(order.requestor)
        );

        // Get total count for pagination
        let branchTotalCount = 0;
        
        if (userNames.length > 0) {
          const { count, error: countError } = await supabase
            .from('sign_orders')
            .select('id', { count: 'exact' })
            .in('status', branchStatusValues)
            .in('requestor', userNames);

          if (countError) {
            console.error('Error getting branch count:', countError);
            return NextResponse.json({ success: false, error: 'Failed to get branch count' }, { status: 500 });
          }
          
          branchTotalCount = count || 0;
        }
        
        console.log(`Branch ${branch} has ${branchTotalCount} orders with status ${branchStatusValues.join(', ')}`);
        
        // If no users in this branch or no orders, return empty results
        if (userNames.length === 0 || branchTotalCount === 0) {
          return NextResponse.json({
            success: true,
            orders: [],
            pagination: {
              total: 0,
              pages: 0,
              page: page,
              size: limit
            }
          });
        }

        // Format the response
        const formattedOrders = branchOrders.map((order: any) => {
          // Format the customer name from contractors object
          let customerName = 'N/A';
          if (order.contractors && typeof order.contractors === 'object' && order.contractors.name) {
            customerName = order.contractors.name;
          }
          
          return {
            id: order.id,
            requestor: order.requestor || '',
            customer: customerName,
            job_number: order.job_number || '',
            contract_number: order.contract_number || '',
            order_date: order.order_date,
            need_date: order.need_date,
            status: order.status,
            type: order.sale ? 'Sale' : order.rental ? 'Rental' : order.perm_signs ? 'Permanent Signs' : 'Unknown',
            order_number: order.order_number || 'N/A'
          };
        });

        return NextResponse.json({
          success: true,
          orders: formattedOrders,
          pagination: {
            total: branchTotalCount || 0,
            pages: Math.ceil((branchTotalCount || 0) / limit),
            page: page,
            size: limit
          }
        });
      } catch (error) {
        console.error('Error in branch filtering:', error);
        return NextResponse.json({ success: false, error: 'An error occurred during branch filtering' }, { status: 500 });
      }
    }

    // Apply additional filters if present
    if (filters) {
      // Example: Apply customer filter if present
      if (filters.customer) {
        query = query.ilike('contractors.name', `%${filters.customer}%`);
      }

      // Example: Apply job number filter if present
      if (filters.jobNumber) {
        query = query.ilike('job_number', `%${filters.jobNumber}%`);
      }
    }

    // Apply sorting
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    } else {
      query = query.order('order_date', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute the query
    const { data: orders, error } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }
    
    // Debug: Log the raw data to see what's coming from the database
    console.log('Raw orders data from DB:', JSON.stringify(orders, null, 2));
    // Check specifically for order_number field
    if (orders && orders.length > 0) {
      console.log('First order order_number:', orders[0].order_number);
      console.log('Order with ID 27:', orders.find((o: any) => o.id === 27));
    }
    
    // If debug mode is enabled, return the raw data structure
    if (debug) {
      return NextResponse.json({ success: true, rawData: orders });
    }

    // Process the results
    const formattedOrders = orders.map(order => {
      // Format the customer name from contractors object
      // Supabase returns the foreign key relationship as a nested object
      let customerName = 'N/A';
      if (order.contractors && typeof order.contractors === 'object' && order.contractors.name) {
        customerName = order.contractors.name;
      }
      
      // Format the combined status
      const combinedStatus = order.status || 'Unknown';
      
      // Derive the type from available fields
      let type = 'Unknown';
      if (order.sale) {
        type = 'Sale';
      } else if (order.rental) {
        type = 'Rental';
      } else if (order.perm_signs) {
        type = 'Permanent Signs';
      }
      
      return {
        id: order.id,
        requestor: order.requestor || '',
        customer: customerName,
        job_number: order.job_number || '',
        contract_number: order.contract_number || '',
        order_date: order.order_date,
        need_date: order.need_date,
        status: combinedStatus,
        sale: order.sale || false,
        rental: order.rental || false,
        perm_signs: order.perm_signs || false,
        type: type,
        order_number: order.order_number || 'N/A'
      };
    });

    // Get the total count for pagination
    let countQuery = supabase
      .from('sign_orders')
      .select('id', { count: 'exact' });
    
    // Apply the same status filter to the count query
    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim());
      const statusValues: string[] = [];
      statuses.forEach(status => {
        statusValues.push(status, status.toLowerCase(), status.toUpperCase());
      });
      countQuery = countQuery.in('status', statusValues);
    } else {
      // Default behavior - include only Draft and Submitted status orders
      // Explicitly exclude shop statuses like 'in-process', 'not-started', 'on-order', 'complete'
      let defaultStatusValues = ['Draft', 'draft', 'DRAFT', 'Submitted', 'submitted', 'SUBMITTED'];
      
      // Make sure we're not including any shop statuses
      defaultStatusValues = defaultStatusValues.filter(status => 
        !['in-process', 'not-started', 'on-order', 'complete'].includes(status.toLowerCase()));
      
      countQuery = countQuery.in('status', defaultStatusValues);
    }
    
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting count:', countError);
      return NextResponse.json({ success: false, error: 'Failed to get count' }, { status: 500 });
    }

    // Return the formatted orders with pagination info
    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in sign-shop-orders API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sign shop orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sign_orders')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating sign order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sign order' },
      { status: 500 }
    );
  }
}
