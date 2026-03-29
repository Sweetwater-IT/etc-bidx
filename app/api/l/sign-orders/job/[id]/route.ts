import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    console.log('[sign-orders/job] Fetch requested', { jobId: id });

    const { data: job, error: jobError } = await supabase
      .from('jobs_l')
      .select('id, contract_number, etc_job_number, customer_name')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      console.error('[sign-orders/job] Failed to resolve job', {
        jobId: id,
        error: jobError,
      });
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const collectedOrders = new Map<number, any>();
    const queryConfigs = [
      { field: 'contract_number', value: job.contract_number },
      { field: 'job_number', value: job.etc_job_number ? String(job.etc_job_number) : null },
    ].filter((config): config is { field: 'contract_number' | 'job_number'; value: string } => Boolean(config.value));

    for (const config of queryConfigs) {
      console.log('[sign-orders/job] Querying sign orders', {
        jobId: id,
        field: config.field,
        value: config.value,
      });

      const { data, error } = await supabase
        .from('sign_orders')
        .select('id, order_number, status, submitted_date, requestor, contract_number, order_date, created_at, job_number, contractors(name)')
        .eq(config.field, config.value)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[sign-orders/job] Error fetching sign orders', {
          jobId: id,
          field: config.field,
          value: config.value,
          error,
        });
        return NextResponse.json({ error: 'Failed to fetch sign orders' }, { status: 500 });
      }

      (data || []).forEach((order: any) => {
        collectedOrders.set(order.id, order);
      });
    }

    const dedupedOrders = Array.from(collectedOrders.values()).sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    // Get item counts for each order
    const ordersWithCounts = await Promise.all(
      dedupedOrders.map(async (order: any) => {
        const { count } = await supabase
          .from('sign_order_items')
          .select('id', { count: 'exact', head: true })
          .eq('sign_order_id', order.id);

        return {
          ...order,
          customer_name: order.contractors?.name || '',
          item_count: count || 0
        };
      })
    );

    console.log('[sign-orders/job] Returning sign orders', {
      jobId: id,
      contractNumber: job.contract_number,
      etcJobNumber: job.etc_job_number,
      orderCount: ordersWithCounts.length,
    });

    return NextResponse.json(ordersWithCounts);
  } catch (error) {
    console.error('[sign-orders/job] Unhandled error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
