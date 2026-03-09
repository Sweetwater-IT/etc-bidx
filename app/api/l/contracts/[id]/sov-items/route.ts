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

    // Use the upsert-sov-items function
    const { data, error } = await supabase.functions.invoke('upsert-sov-items', {
      body: { jobId, items },
    });

    if (error) {
      console.error('Error upserting SOV items:', error);
      return NextResponse.json({ error: 'Failed to upsert SOV items' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in SOV items API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}