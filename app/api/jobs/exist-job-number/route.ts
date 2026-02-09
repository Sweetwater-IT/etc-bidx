import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customJobNumber = searchParams.get('customJobNumber');
  
  if (!customJobNumber || !/^\d{7}$/.test(customJobNumber)) {
    return NextResponse.json(
      { error: 'Invalid or missing customJobNumber. Expected format: 7 digits (YYYYXXX)' },
      { status: 400 }
    );
  }
  
  const year = parseInt(customJobNumber.slice(0, 4), 10);
  const sequential = parseInt(customJobNumber.slice(4), 10);

  const { data, error } = await supabase
    .from('job_numbers')
    .select('id')
    .eq('year', year)
    .eq('sequential_number', sequential)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Supabase error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ exists: !!data }, { status: 200 });
}