import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface DailyTrackerEntry {
  id?: number;
  signDesignation: string;
  dimension: string;
  quantity: number;
  created_at?: string;
}

export async function createDailyTrackerEntry(entryData: Omit<DailyTrackerEntry, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('daily_tracker_entries')
      .insert({
        sign_designation: entryData.signDesignation,
        dimension: entryData.dimension,
        quantity: entryData.quantity,
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return data ? data[0] : null;
  } catch (error) {
    console.error('Error creating daily tracker entry:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newEntry = await createDailyTrackerEntry(body);
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
