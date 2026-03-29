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

    console.log('[sign-orders/job/counts] Fetch requested', { jobId: id });

    const { data: job, error: jobError } = await supabase
      .from('jobs_l')
      .select('id, contract_number, etc_job_number')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      console.error('[sign-orders/job/counts] Failed to resolve job', {
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
      const { data, error } = await supabase
        .from('sign_orders')
        .select('id, status')
        .eq(config.field, config.value);

      if (error) {
        console.error('[sign-orders/job/counts] Error fetching sign orders', {
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

    const counts = { submitted: 0, in_production: 0, complete: 0, closed: 0 };

    Array.from(collectedOrders.values()).forEach((order: any) => {
        if (order.status === 'submitted' || order.status === 'draft') counts.submitted++;
        else if (order.status === 'in_production' || order.status === 'partial_complete') counts.in_production++;
        else if (order.status === 'complete') counts.complete++;
        else if (order.status === 'closed') counts.closed++;
    });

    console.log('[sign-orders/job/counts] Returning counts', {
      jobId: id,
      contractNumber: job.contract_number,
      etcJobNumber: job.etc_job_number,
      counts,
    });

    return NextResponse.json(counts);
  } catch (error) {
    console.error('[sign-orders/job/counts] Unhandled error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
