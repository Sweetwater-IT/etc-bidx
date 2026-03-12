import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Use local API route instead of edge function to avoid function deployment dependency.
    // This keeps SOV upsert in the same Next.js deployment surface.
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

      const targetUrl = `${request.nextUrl.origin}/api/l/jobs/${jobId}/sov-items`;

      console.log('[SOV contract upsert] Forwarding item to jobs endpoint', {
        requestId,
        jobId,
        index,
        targetUrl,
        payload,
      });

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawBody = await resp.text();
      let parsedBody: any = null;
      if (rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = null;
        }
      }

      if (!resp.ok) {
        const errorDetails = {
          requestId,
          jobId,
          index,
          status: resp.status,
          statusText: resp.statusText,
          payload,
          responseBody: parsedBody ?? rawBody ?? null,
        };

        console.error('[SOV contract upsert] Error upserting item via API fallback', errorDetails);

        return NextResponse.json(
          { error: 'Failed to upsert SOV items', details: errorDetails },
          { status: resp.status || 500 }
        );
      }

      const normalized = parsedBody?.data ?? parsedBody ?? { rawBody };
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