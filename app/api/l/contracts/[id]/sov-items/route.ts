import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { items } = await request.json();
    const { id: jobId } = await params;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Use local API route instead of edge function to avoid function deployment dependency.
    // This keeps SOV upsert in the same Next.js deployment surface.
    const results: any[] = [];

    for (const item of items) {
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

      const resp = await fetch(`${request.nextUrl.origin}/api/l/jobs/${jobId}/sov-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        console.error('Error upserting SOV items via API fallback:', json);
        return NextResponse.json(
          { error: 'Failed to upsert SOV items', details: json },
          { status: resp.status || 500 }
        );
      }

      results.push(json.data ?? json);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in SOV items API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}