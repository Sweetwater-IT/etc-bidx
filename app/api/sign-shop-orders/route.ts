import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const orderBy = searchParams.get('orderBy') || 'order_date';
    const ascending = searchParams.get('ascending') === 'true';
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');
    const counts = searchParams.get('counts') === 'true';
    const countBy = searchParams.get('countBy');
    const filtersJson = searchParams.get('filters');
    const initialStatus = searchParams.get('initialStatus') || 'Submitted'; // Default to Submitted orders

    // Parse filters if present
    const filters = filtersJson ? JSON.parse(filtersJson) : {};

    // If we're just getting counts
    if (counts) {
      // If counting by status
      if (countBy === 'status') {
        const statusCounts = {
          'not-started': 0,
          'in-process': 0,
          'on-order': 0,
          'complete': 0
        };

        // Count each status
        const { data: notStartedCount, error: notStartedError } = await supabase
          .from('sign_orders')
          .select('id', { count: 'exact' })
          .eq('shop_status', 'Not Started')
          .eq('status', initialStatus);

        const { data: inProcessCount, error: inProcessError } = await supabase
          .from('sign_orders')
          .select('id', { count: 'exact' })
          .eq('shop_status', 'In Process')
          .eq('status', initialStatus);

        const { data: onOrderCount, error: onOrderError } = await supabase
          .from('sign_orders')
          .select('id', { count: 'exact' })
          .eq('shop_status', 'On Order')
          .eq('status', initialStatus);

        const { data: completeCount, error: completeError } = await supabase
          .from('sign_orders')
          .select('id', { count: 'exact' })
          .eq('shop_status', 'Complete')
          .eq('status', initialStatus);

        if (notStartedError || inProcessError || onOrderError || completeError) {
          console.error('Error fetching status counts:', { notStartedError, inProcessError, onOrderError, completeError });
          return NextResponse.json({ success: false, error: 'Failed to fetch status counts' }, { status: 500 });
        }

        statusCounts['not-started'] = notStartedCount?.length || 0;
        statusCounts['in-process'] = inProcessCount?.length || 0;
        statusCounts['on-order'] = onOrderCount?.length || 0;
        statusCounts['complete'] = completeCount?.length || 0;

        return NextResponse.json({
          success: true,
          counts: statusCounts
        });
      } 
      // Count by branch
      else {
        let query = supabase
          .from('sign_orders')
          .select('id', { count: 'exact' })
          .eq('status', initialStatus);

        // Apply status filter if present
        if (status && status !== 'all') {
          const shopStatus = 
            status === 'not-started' ? 'Not Started' : 
            status === 'in-process' ? 'In Process' : 
            status === 'on-order' ? 'On Order' : 
            'Complete';
            
          query = query.eq('shop_status', shopStatus);
        }

        // Get total count
        const { count: totalCount, error: totalError } = await query;

        // Count by branch (using branch ranges as a temporary solution)
        const { count: hatfieldCount, error: hatfieldError } = await query.lt('id', 100);
        const { count: turbotvilleCount, error: turbotvilleError } = await query.gte('id', 100).lt('id', 200);
        const { count: bedfordCount, error: bedfordError } = await query.gte('id', 200).lt('id', 300);
        const { count: archivedCount, error: archivedError } = await query.gte('id', 300);

        if (totalError || hatfieldError || turbotvilleError || bedfordError || archivedError) {
          console.error('Error fetching branch counts:', { totalError, hatfieldError, turbotvilleError, bedfordError, archivedError });
          return NextResponse.json({ success: false, error: 'Failed to fetch branch counts' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          counts: {
            all: totalCount || 0,
            hatfield: hatfieldCount || 0,
            turbotville: turbotvilleCount || 0,
            bedford: bedfordCount || 0,
            archived: archivedCount || 0
          }
        });
      }
    }

    // Build the main query
    let query = supabase
      .from('sign_orders')
      .select(`
        sign_orders.id,
        sign_orders.requestor,
        contractors:contractor_id (name),
        sign_orders.job_number,
        sign_orders.contract_number,
        sign_orders.order_date,
        sign_orders.need_date,
        sign_orders.shop_status,
        sign_orders.sale,
        sign_orders.rental,
        sign_orders.perm_signs,
        sign_orders.order_number
      `)
      .eq('sign_orders.status', initialStatus); // Only get submitted orders

    // Apply status filter if present
    if (status && status !== 'all') {
      const shopStatus = 
        status === 'not-started' ? 'Not Started' : 
        status === 'in-process' ? 'In Process' : 
        status === 'on-order' ? 'On Order' : 
        'Complete';
        
      query = query.eq('sign_orders.shop_status', shopStatus);
    }

    // Apply branch filter if present (using ID ranges as a temporary solution)
    if (branch) {
      if (branch === 'hatfield') {
        query = query.lt('sign_orders.id', 100);
      } else if (branch === 'turbotville') {
        query = query.gte('sign_orders.id', 100).lt('sign_orders.id', 200);
      } else if (branch === 'bedford') {
        query = query.gte('sign_orders.id', 200).lt('sign_orders.id', 300);
      } else if (branch === 'archived') {
        query = query.gte('sign_orders.id', 300);
      }
    }

    // Apply additional filters
    if (Object.keys(filters).length > 0) {
      for (const [field, values] of Object.entries(filters)) {
        if (Array.isArray(values) && values.length > 0) {
          if (field === 'customer') {
            // This would require a more complex query with Supabase
            // For now, we'll filter these after fetching
          } else if (field === 'type') {
            // Determine order type based on sale, rental, perm_signs fields
            if (values.includes('Sale')) {
              query = query.eq('sign_orders.sale', true);
            }
            if (values.includes('Rental')) {
              query = query.eq('sign_orders.rental', true);
            }
            if (values.includes('Permanent')) {
              query = query.eq('sign_orders.perm_signs', true);
            }
          } else {
            query = query.in(`sign_orders.${field}`, values);
          }
        }
      }
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('sign_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', initialStatus);
    
    const totalCount = count || 0;
    
    if (countError) {
      console.error('Error getting count:', countError);
      return NextResponse.json({ success: false, error: 'Failed to get count' }, { status: 500 });
    }

    // Apply sorting
    if (orderBy) {
      const orderColumn = orderBy === 'customer' ? 'contractors.name' : `sign_orders.${orderBy}`;
      query = query.order(orderColumn, { ascending });
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

    // Process the results
    const ordersWithType = orders?.map((order: any) => {
      // Handle nested contractors object from Supabase's join
      const customer = order.contractors?.name || 'N/A';
      const status = order.shop_status || 'Not Started';
      const type: string[] = [];
      
      if (order.sale) type.push('Sale');
      if (order.rental) type.push('Rental');
      if (order.perm_signs) type.push('Permanent');
      
      // Create a new object with the processed data
      return {
        id: order.id,
        requestor: order.requestor,
        customer,
        job_number: order.job_number,
        contract_number: order.contract_number,
        order_date: order.order_date,
        need_date: order.need_date,
        status,
        order_number: order.order_number,
        type: type.join(', ') || 'N/A'
      };
    }) || [];
    
    // Filter by customer if that filter was applied
    const filteredOrders = Object.keys(filters).includes('customer')
      ? ordersWithType.filter(order => filters.customer.includes(order.customer))
      : ordersWithType;

    return NextResponse.json({
      success: true,
      data: filteredOrders,
      totalCount,
      pageCount: Math.ceil(totalCount / limit)
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
    const { id, shop_status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Update the sign order status
    const { error } = await supabase
      .from('sign_orders')
      .update({
        shop_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating sign shop order:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update sign shop order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sign shop order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating sign shop order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sign shop order' },
      { status: 500 }
    );
  }
}
