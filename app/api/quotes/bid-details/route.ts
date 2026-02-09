import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { contractNumber, type } = await request.json();

    if (!contractNumber || !type) {
      return NextResponse.json({ error: 'Contract number and type are required' }, { status: 400 });
    }

    const viewName = type === 'estimate' ? 'estimate_complete' : 'jobs_complete'
    const filterClause = type === 'estimate' ? 'admin_data->>contractNumber' : 'job_number'
      // Fetch detailed bid information from bid_estimates
      const { data: data, error: bidError } = await supabase
        .from(viewName)
        .select('id, contractor_name, admin_data, mpt_rental, equipment_rental, sale_items, flagging, service_work')
        .filter(filterClause, 'eq', contractNumber)
        .single() // this expects one row so will throw an error rather than returning an empty data object, which is what we want

      if (bidError) {
        console.error('Error fetching bid details:', bidError);
        return NextResponse.json({ error: bidError.message }, { status: 500 });
      }

      return NextResponse.json({
        data
      });
  } catch (error) {
    console.error('Error in bid-details API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}