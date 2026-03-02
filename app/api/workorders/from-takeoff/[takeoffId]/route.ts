// app/api/workorders/from-takeoff/[takeoffId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ takeoffId: string }> }   // ← this is the fix
) {
  try {
    const resolvedParams = await params;                    // ← await it
    const { takeoffId } = resolvedParams;

    const { data, error } = await supabase.functions.invoke(
      'generate-work-order-from-takeoff',
      {
        body: { takeoff_id: takeoffId }
      }
    );

    if (error || !data) {
      console.error('Function error:', error);
      return NextResponse.json(
        { error: 'Failed to generate work order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, workOrder: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
