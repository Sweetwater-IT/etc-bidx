import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchCode = searchParams.get('branchCode');
  const division = searchParams.get('division'); 
  const customJobNumber = searchParams.get('customJobNumber');

  if (!branchCode || !division || !customJobNumber) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const divisionCode = division === 'PUBLIC' ? '21' : '22';
  const fullJobNumber = `${branchCode}-${divisionCode}-${customJobNumber}`;

  const { data, error } = await supabase
    .from('jobs_list')
    .select('id')
    .eq('job_number', fullJobNumber)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Supabase error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }

  const exists = !!data;

  return NextResponse.json({ exists, jobNumber: fullJobNumber }, { status: 200 });
}