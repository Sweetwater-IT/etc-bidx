import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const {
      jobId,
      title,
      workType,
      workOrderNumber,
      contractedOrAdditional,
      installDate,
      pickupDate,
      neededByDate,
      priority,
      notes,
      crewNotes,
      buildShopNotes,
      pmNotes,
      activeSections,
      signRows,
      defaultSignMaterial,
      takeoffId, // For updates
    } = await request.json();

    if (!jobId || !title || !workType) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, title, workType' },
        { status: 400 }
      );
    }

    // Verify the job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs_l')
      .select('id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Validate that the work type exists in the job's SOV entries
    const { data: sovEntries, error: sovError } = await supabase
      .from('sov_entries')
      .select(`
        id,
        sov_items (
          work_type
        )
      `)
      .eq('job_id', jobId);

    if (sovError) {
      console.error('Error fetching SOV entries:', sovError);
      return NextResponse.json(
        { error: 'Failed to validate work type' },
        { status: 500 }
      );
    }

    // Extract unique work types from the job's SOV entries
    const allowedWorkTypes: string[] = [...new Set(
      (sovEntries || []).map((entry: any) => entry.sov_items?.work_type).filter(Boolean)
    )];

    // Check if the requested work type is allowed
    if (!allowedWorkTypes.includes(workType)) {
      return NextResponse.json(
        {
          error: `Work type "${workType}" is not allowed for this job. Allowed work types: ${allowedWorkTypes.join(', ')}`
        },
        { status: 400 }
      );
    }

    const takeoffData = {
      job_id: jobId,
      title: title.trim(),
      work_type: workType,
      work_order_number: workOrderNumber || null,
      contracted_or_additional: contractedOrAdditional || 'contracted',
      install_date: installDate || null,
      pickup_date: workType === 'MPT' ? (pickupDate || null) : null,
      needed_by_date: neededByDate || null,
      priority: priority || 'standard',
      notes: notes?.trim() || null,
      crew_notes: crewNotes?.trim() || null,
      build_shop_notes: buildShopNotes?.trim() || null,
      pm_notes: pmNotes?.trim() || null,
      active_sections: activeSections || [],
      sign_rows: signRows || {},
      default_sign_material: defaultSignMaterial || 'PLASTIC',
      status: 'draft',
    };

    let takeoff;

    if (takeoffId) {
      // Update existing takeoff
      const { data: updatedTakeoff, error: updateError } = await supabase
        .from('takeoffs_l')
        .update(takeoffData)
        .eq('id', takeoffId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating takeoff:', updateError);
        return NextResponse.json(
          { error: 'Failed to update takeoff' },
          { status: 500 }
        );
      }

      takeoff = updatedTakeoff;
    } else {
      // Create new takeoff
      const { data: newTakeoff, error: createError } = await supabase
        .from('takeoffs_l')
        .insert(takeoffData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating takeoff:', createError);
        return NextResponse.json(
          { error: 'Failed to create takeoff' },
          { status: 500 }
        );
      }

      takeoff = newTakeoff;
    }

    return NextResponse.json({
      success: true,
      takeoff,
    });

  } catch (error) {
    console.error('Unexpected error in takeoff creation/update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
