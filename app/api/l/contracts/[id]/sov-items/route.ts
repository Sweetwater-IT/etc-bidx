import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SovUpsertError, upsertSovEntry } from '@/lib/server/sov/upsertSovEntry';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const { data, error } = await supabase
      .from('sov_entries')
      .select(`
        id,
        job_id,
        sov_item_id,
        quantity,
        unit_price,
        extended_price,
        retainage_type,
        retainage_value,
        retainage_amount,
        notes,
        sort_order,
        created_at,
        updated_at,
        sov_items (
          id,
          item_number,
          display_item_number,
          description,
          display_name,
          work_type,
          uom
        )
      `)
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[SOV contract GET] Failed to fetch SOV entries', { jobId, error });
      return NextResponse.json({ error: 'Failed to fetch SOV entries' }, { status: 500 });
    }

    const transformedData = (data || []).map((entry: any) => ({
      id: entry.id,
      job_id: entry.job_id,
      sov_item_id: entry.sov_item_id,
      item_number: (entry as any).sov_items?.item_number,
      display_item_number: (entry as any).sov_items?.display_item_number,
      description: (entry as any).sov_items?.description,
      display_name: (entry as any).sov_items?.display_name,
      work_type: (entry as any).sov_items?.work_type,
      uom: (entry as any).sov_items?.uom,
      quantity: entry.quantity,
      unit_price: entry.unit_price,
      extended_price: entry.extended_price,
      retainage_type: entry.retainage_type,
      retainage_value: entry.retainage_value,
      retainage_amount: entry.retainage_amount,
      notes: entry.notes,
      sort_order: entry.sort_order,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    }));

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('[SOV contract GET] Internal server error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = `sov-contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const { items } = await request.json();
    const { id: jobId } = await params;

    console.log('[SOV contract upsert] Request started', {
      requestId,
      jobId,
      itemCount: Array.isArray(items) ? items.length : 0,
      origin: request.nextUrl.origin,
    });

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const results: any[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const payload = {
        sov_item_id: item.sov_item_id ?? null,
        item_number: item.item_number ?? null,
        description: item.description ?? '',
        uom: item.uom ?? 'EA',
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
        retainage_type: item.retainage_type ?? 'percent',
        retainage_value: Number(item.retainage_value ?? 0),
        notes: item.notes ?? null,
        sort_order: item.sort_order ?? null,
      };

      console.log('[SOV contract upsert] Forwarding item to jobs endpoint', {
        requestId,
        jobId,
        index,
        payload,
      });

      let normalized: any;
      try {
        normalized = await upsertSovEntry({
          jobId,
          ...payload,
        });
      } catch (error) {
        if (error instanceof SovUpsertError) {
          const errorDetails = {
            requestId,
            jobId,
            index,
            status: error.status,
            payload,
            responseBody: error.details ?? error.message,
          };

          console.error('[SOV contract upsert] Error upserting item via shared helper', errorDetails);

          return NextResponse.json(
            { error: 'Failed to upsert SOV items', details: errorDetails },
            { status: error.status || 500 }
          );
        }

        throw error;
      }

      results.push(normalized);

      console.log('[SOV contract upsert] Successfully upserted item', {
        requestId,
        jobId,
        index,
        item_number: payload.item_number,
        resultId: normalized?.id,
      });
    }

    console.log('[SOV contract upsert] Request completed successfully', {
      requestId,
      jobId,
      savedCount: results.length,
    });

    return NextResponse.json({ success: true, requestId, data: results });
  } catch (error) {
    const details = {
      requestId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error('[SOV contract upsert] Unhandled error', details);
    return NextResponse.json({ error: 'Internal server error', details }, { status: 500 });
  }
}