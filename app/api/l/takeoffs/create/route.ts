import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const {
      jobId,
      title,
      workType,
      workOrderNumber,
      workOrderId,
      contractedOrAdditional,
      installDate,
      pickupDate,
      neededByDate,
      isMultiDayJob,
      endDate,
      priority,
      notes,
      crewNotes,
      buildShopNotes,
      pmNotes,
      activeSections,
      signRows,
      defaultSignMaterial,
      activePermanentItems,
      permanentSignRows,
      permanentEntryRows,
      defaultPermanentSignMaterial,
      vehicleItems,
      rollingStockItems,
      additionalItems,
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

    const takeoffData = {
      job_id: jobId,
      title: title.trim(),
      work_type: workType,
      work_order_number: workOrderNumber || null,
      work_order_id: workOrderId || null,
      contracted_or_additional: contractedOrAdditional || 'contracted',
      install_date: installDate || null,
      pickup_date: pickupDate || null,
      needed_by_date: neededByDate || null,
      is_multi_day_job: Boolean(isMultiDayJob),
      end_date: endDate || null,
      priority: priority || 'standard',
      notes: notes?.trim() || null,
      crew_notes: crewNotes?.trim() || null,
      build_shop_notes: buildShopNotes?.trim() || null,
      pm_notes: pmNotes?.trim() || null,
      active_sections: activeSections || [],
      sign_rows: signRows || {},
      default_sign_material: defaultSignMaterial || 'PLASTIC',
      active_permanent_items: activePermanentItems || [],
      permanent_sign_rows: permanentSignRows || {},
      permanent_entry_rows: permanentEntryRows || {},
      default_permanent_sign_material: defaultPermanentSignMaterial || 'ALUMINUM',
      vehicle_items: vehicleItems || [],
      rolling_stock_items: rollingStockItems || [],
      additional_items: additionalItems || [],
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
