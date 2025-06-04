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
    // Use lowercase 'submitted' as the default status
    const orderStatus = searchParams.get('status') || 'submitted';

    // Parse filters if present
    const filters = filtersJson ? JSON.parse(filtersJson) : {};

    // If we're just getting counts
    if (counts) {
      // Count by branch
      const query = supabase
        .from('sign_orders')
        .select('id', { count: 'exact' })
        .eq('status', orderStatus);

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

    // Build the main query
    let query = supabase
      .from('sign_orders')
      .select(`
        id,
        requestor,
        contractors:contractor_id (name),
        job_number,
        contract_number,
        order_date,
        need_date,
        status,
        sale,
        rental,
        perm_signs
      `)
      .eq('status', orderStatus); // Filter by the requested status

    // Apply branch filter if present (using ID ranges as a temporary solution)
    if (branch) {
      if (branch === 'hatfield') {
        query = query.lt('id', 100);
      } else if (branch === 'turbotville') {
        query = query.gte('id', 100).lt('id', 200);
      } else if (branch === 'bedford') {
        query = query.gte('id', 200).lt('id', 300);
      } else if (branch === 'archived') {
        query = query.gte('id', 300);
      }
    }

    // Apply any additional filters
    if (Object.keys(filters).length > 0) {
      for (const [field, values] of Object.entries(filters)) {
        if (Array.isArray(values) && values.length > 0) {
          query = query.in(field, values);
        }
      }
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('sign_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', orderStatus);
    
    const totalCount = count || 0;
    
    // Apply pagination and sorting
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    
    query = query.range((page - 1) * limit, page * limit - 1);
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching sign orders:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Format the data for the frontend
    const formattedData = data.map(order => ({
      id: order.id,
      requestor: order.requestor,
      customer: order.contractors?.[0]?.name || 'N/A',  // Access first contractor's name from the array
      job_number: order.job_number,
      contract_number: order.contract_number,
      order_date: order.order_date,
      need_date: order.need_date,
      status: order.status,
      type: order.sale ? 'Sale' : order.rental ? 'Rental' : order.perm_signs ? 'Permanent' : 'Unknown'
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      totalCount,
      pageCount: Math.ceil(totalCount / limit)
    });
    
  } catch (error: any) {
    console.error('Error in sign shop orders API:', error);
    return NextResponse.json({ success: false, error: error.message || 'An error occurred' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shop_status } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('sign_orders')
      .update({ status: shop_status })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating sign order status:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data
    });
    
  } catch (error: any) {
    console.error('Error in sign shop orders API:', error);
    return NextResponse.json({ success: false, error: error.message || 'An error occurred' }, { status: 500 });
  }
}
