import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { contractNumber, type } = await request.json();

    if (!contractNumber || !type) {
      return NextResponse.json({ error: 'Contract number and type are required' }, { status: 400 });
    }

    if (type === 'estimate') {
      // Fetch detailed bid information from bid_estimates
      const { data: bidData, error: bidError } = await supabase
        .from('bid_estimates')
        .select('*')
        .eq('contract_number', contractNumber)
        .single();

      if (bidError) {
        console.error('Error fetching bid details:', bidError);
        return NextResponse.json({ error: bidError.message }, { status: 500 });
      }

      // TODO: Fetch bid items and other related data as needed

      return NextResponse.json({
        county: bidData?.county || '',
        branch: bidData?.branch || '',
        ecms_po_number: bidData?.ecms_po_number || '',
        // TODO: Add state_route when column is added to bid_estimates table
        state_route: '',
        // Add any other fields you need to populate in the form
        ...bidData
      });
    } else if (type === 'job') {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('job_number', contractNumber)
        .single();

      if (jobError) {
        console.error('Error fetching job details:', jobError);
        return NextResponse.json({ error: jobError.message }, { status: 500 });
      }

      // Return placeholder data for now since jobs table needs modification
      return NextResponse.json({
        county: 'Bucks', // Placeholder
        branch: 'Turbotville', // Placeholder
        state_route: 'SR-101', // Placeholder
        ecms_po_number: jobData?.po_number || '',
        ...jobData
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in bid-details API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}