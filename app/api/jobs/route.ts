import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    const { division } = formData;
    const ownerTypeMap: Record<string, string> = {
      'PUBLIC': '22',
      'PRIVATE': '21'
    };
    const ownerTypeCode = ownerTypeMap[division]
    
    const branchCode = '10';
    const currentYear = new Date().getFullYear();
    
    const { data: highestSequential } = await supabase
      .from('job_numbers')
      .select('sequential_number')
      .eq('branch_code', branchCode)
      .eq('owner_type', ownerTypeCode)
      .eq('year', currentYear)
      .order('sequential_number', { ascending: false })
      .limit(1);
    
    let sequentialNumber = 1;
    if (highestSequential && highestSequential.length > 0) {
      sequentialNumber = highestSequential[0].sequential_number + 1;
    }
    
    const { data: jobNumberData, error: jobNumberError } = await supabase
      .from('job_numbers')
      .insert({
        branch_code: branchCode,
        owner_type: ownerTypeCode,
        year: currentYear,
        sequential_number: sequentialNumber,
        is_assigned: false
      })
      .select()
      .single();
    
    console.log('Job number creation result:', { data: jobNumberData, error: jobNumberError });
    
    if (jobNumberError) {
      return NextResponse.json(
        { error: 'Failed to create job number', details: jobNumberError },
        { status: 500 }
      );
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        job_number: jobNumberData.job_number,
        branch_code: jobNumberData.branch_code,
        owner_type: jobNumberData.owner_type,
        year: jobNumberData.year,
        sequential_number: jobNumberData.sequential_number,
        job_details: formData
      })
      .select()
      .single();
    
    
    if (jobError) {
      await supabase
        .from('job_numbers')
        .update({ is_assigned: false })
        .eq('id', jobNumberData.id);
      
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError },
        { status: 500 }
      );
    }
    
    await supabase
      .from('job_numbers')
      .update({ is_assigned: true })
      .eq('id', jobNumberData.id);
    
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected error in job creation' },
      { status: 500 }
    );
  }
}
