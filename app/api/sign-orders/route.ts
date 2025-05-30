import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req : NextRequest) {
  try {
    // Parse the request body
    const signOrderData = await req.json();
    
    // Insert the record into the sign_orders table
    const { data, error } = await supabase
      .from('sign_orders')
      .insert({
        requestor: signOrderData.requestor,
        contractor_id: signOrderData.contractor_id,
        contract_number: signOrderData.contract_number,
        order_date: signOrderData.order_date,
        need_date: signOrderData.need_date,
        start_date: signOrderData.start_date,
        end_date: signOrderData.end_date,
        sale: signOrderData.order_type.includes('sale'),
        rental: signOrderData.order_type.includes('rental'),
        perm_signs: signOrderData.order_type.includes('permanent signs'),
        job_number: signOrderData.job_number,
        signs: signOrderData.signs,
        status: 'in-process'
      })
      .select();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        data: data[0],
        message: 'Sign order created successfully' 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req : NextRequest) {
    try {
      const url = new URL(req.url);
      const params = url.searchParams;
      
      // Get query parameters
      const status = params.get('status');
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '25');
      const orderBy = params.get('orderBy') || 'quote_created_at';
      const ascending = params.get('ascending') === 'true';
      const detailed = params.get('detailed') === 'true';
      const getCounts = params.get('counts') === 'true';
  
      // If we're just getting counts
      if (getCounts) {
        const counts = {
          all: 0,
          not_started: 0,
          in_process: 0,
          on_order: 0,
          complete: 0
        };
        
        // Get all counts
        const { data: allData, error: allError } = await supabase
          .from('sign_orders')
          .select('*', { count: 'exact', head: true });
        
        if (allError) throw allError;
        counts.all = allData?.length || 0;
        
        // Get not started counts
        const { data: notStartedData, error: notStartedError } = await supabase
          .from('sign_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'not-started');
        
        if (notStartedError) throw notStartedError;
        counts.not_started = notStartedData?.length || 0;
        
        // Get in process counts
        const { data: inProcessData, error: inProcessError } = await supabase
          .from('sign_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'in-process');
        
        if (inProcessError) throw inProcessError;
        counts.in_process = inProcessData?.length || 0;
        
        // Get on order counts
        const { data: onOrderData, error: onOrderError } = await supabase
          .from('sign_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'on-order');
        
        if (onOrderError) throw onOrderError;
        counts.on_order = onOrderData?.length || 0;
        
        // Get complete counts
        const { data: completeData, error: completeError } = await supabase
          .from('sign_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'complete');
        
        if (completeError) throw completeError;
        counts.complete = completeData?.length || 0;
        
        return NextResponse.json(counts);
      }
  
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Start building the query
      let query = supabase
        .from('sign_orders')
        .select(`
          id,
          requestor,
          contractor_id,
          contractors(name),
          order_date,
          need_date,
          start_date,
          end_date,
          sale,
          rental,
          perm_signs,
          job_number,
          contract_number,
          status
        `, { count: 'exact' });
      
      // Apply status filter if provided
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      // Apply sorting
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      // Transform the data to match the expected format
      const transformedData = data.map(item => ({
        id: item.id,
        requestor: item.requestor,
        customer: (item.contractors as any).name || '',
        order_date: item.order_date,
        need_date: item.need_date,
        start_date: item.start_date,
        end_date: item.need_date,
        job_number: item.job_number,
        contract_number: item.contract_number,
        type: `${!!item.sale ? 'S' : ''}${!!item.rental ? !!item.sale ? ', R' : 'R' : ''}${!!item.perm_signs ? !!item.rental ? ', P' : 'P' : ''}`,
        status: item.status
      }));
      
      // Calculate pagination data
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
        }
      });
      
    } catch (error) {
      console.error('Server error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }