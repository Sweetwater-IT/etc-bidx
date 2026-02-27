import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { additional_notes } = body;

    if (additional_notes === undefined) {
      return NextResponse.json({ error: 'additional_notes is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('jobs_l')
      .update({ additional_notes: additional_notes })
      .eq('id', id);

    if (error) {
      console.error('Error updating job notes:', error);
      return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}