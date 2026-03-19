import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SovUpsertError, upsertSovEntry } from '@/lib/server/sov/upsertSovEntry';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabaseResult = await supabase
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
          uom_1,
          uom_2,
          uom_3,
          uom_4,
          uom_5,
          uom_6
        )
      `)
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true });

     
    const { data, error } = supabaseResult;

    if (error) {
      console.error('Error fetching SOV entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SOV entries' },
        { status: 500 }
      );
    }

    // Transform the data to match expected format
    const transformedData = (data || []).map((entry: any) => ({
      id: entry.id,
      job_id: entry.job_id,
      sov_item_id: entry.sov_item_id,
      item_number: (entry as any).sov_items?.item_number,
      display_item_number: (entry as any).sov_items?.display_item_number,
      description: (entry as any).sov_items?.description,
      display_name: (entry as any).sov_items?.display_name,
      work_type: (entry as any).sov_items?.work_type,
      uom: (entry as any).sov_items?.uom_1 || (entry as any).sov_items?.uom_2 || (entry as any).sov_items?.uom_3 || (entry as any).sov_items?.uom_4 || (entry as any).sov_items?.uom_5 || (entry as any).sov_items?.uom_6,
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
    console.error('Error in SOV entries GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  console.log('[SOV API POST] Starting POST request');
  try {
    const { jobId } = await params;
    console.log('[SOV API POST] Job ID:', jobId);

    const body = await request.json();
    console.log('[SOV API POST] Request body:', JSON.stringify(body, null, 2));

    const {
      sov_item_id,
      item_number,
      description,
      work_type,
      uom,
      quantity,
      unit_price,
      retainage_type,
      retainage_value,
      notes,
      sort_order,
    } = body;

    console.log('[SOV API POST] Extracted fields:', {
      sov_item_id,
      item_number,
      description,
      work_type,
      uom,
      quantity,
      unit_price,
      retainage_type,
      retainage_value,
      notes,
      sort_order
    });

    const transformedData = await upsertSovEntry({
      jobId,
      sov_item_id,
      item_number,
      description,
      uom,
      quantity,
      unit_price,
      retainage_type,
      retainage_value,
      notes,
      sort_order,
    });

    console.log('[SOV API POST] Transformed response data:', JSON.stringify(transformedData, null, 2));
    console.log('[SOV API POST] POST request completed successfully');

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    if (error instanceof SovUpsertError) {
      console.error('[SOV API POST] Business error in POST handler:', error.message, error.details);
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    console.error('[SOV API POST] Unexpected error in POST handler:', error);
    console.error('[SOV API POST] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
