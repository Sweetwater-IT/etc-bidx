import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch a specific active bid by ID
export async function GET(
  _request: NextRequest,
  { params }: any
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // First try to fetch from bid_estimates (for existing bids)
    let { data, error } = await supabase
      .from('bid_estimates')
      .select('*')
      .eq('id', id)
      .single();
    
    // If not found in bid_estimates, try to fetch from available_jobs (for new bids from jobs)
    if (error && error.code === 'PGRST116') {
      const { data: jobData, error: jobError } = await supabase
        .from('available_jobs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!jobError) {
        data = jobData;
        error = null;
      }
    }
    
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch active bid', error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Update a specific active bid
export async function PATCH(
  request: NextRequest,
  { params }: any
) {
  try {
    // Await params before accessing
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // First, update the bid estimate
    const { data: updatedBid, error: updateError } = await supabase
      .from('bid_estimates')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to update active bid', error: updateError.message },
        { status: 500 }
      );
    }
    
    // If status is being changed to WON, create a job
    if (body.status === 'WON' && updatedBid) {
      // Check if a job already exists for this estimate
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('estimate_id', id)
        .single();
      
      if (!existingJob) {
        // Generate a random job number with P- prefix
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const jobNumber = `P-${randomString}`;
        
        // Create job_numbers entry
        const { data: jobNumberEntry, error: jobNumberError } = await supabase
          .from('job_numbers')
          .insert({
            job_number: jobNumber,
            branch_code: '', //keep these empty until the job is created and branch is confirmed
            owner_type: '',  //keep these empty until the job is created and branch is confirmed
            year: new Date().getFullYear(),
            sequential_number: parseInt(randomString, 36),
            is_assigned: true
          })
          .select()
          .single();
        
        if (jobNumberError) {
          console.error('Failed to create job number:', jobNumberError);
          return NextResponse.json(
            { success: false, message: 'Failed to create job number', error: jobNumberError.message },
            { status: 500 }
          );
        }
        
        // Create job entry
        const { data: newJob, error: jobError } = await supabase
          .from('jobs')
          .insert({
            estimate_id: id,
            job_number_id: jobNumberEntry.id,
            billing_status: 'NOT_STARTED',
            project_status: 'NOT_STARTED',
            certified_payroll: 'N/A',
            archived: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (jobError) {
          console.error('Failed to create job:', jobError);
          return NextResponse.json(
            { success: false, message: 'Failed to create job', error: jobError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          data: updatedBid,
          job: newJob,
          jobNumber: jobNumber
        });
      }
    }
    
    return NextResponse.json({ success: true, data: updatedBid });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Remove a specific active bid
export async function DELETE(
  _request: NextRequest,
  { params }: any
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('bid_estimates')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete active bid', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
