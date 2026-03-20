import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type JsonRecord = Record<string, any>;

const roundTo = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const calcSqft = (width: number, height: number) => roundTo(((Number(width) || 0) * (Number(height) || 0)) / 144, 4);

function buildMptItems(takeoffId: string, signRows: Record<string, any[]>) {
  const items: JsonRecord[] = [];

  Object.entries(signRows || {}).forEach(([sectionKey, rows]) => {
    if (!Array.isArray(rows)) return;

    rows.forEach((row, index) => {
      const width = Number(row?.width || 0);
      const height = Number(row?.height || 0);
      const sqft = calcSqft(width, height);
      const quantity = Number(row?.quantity || 0);
      const secondarySigns = Array.isArray(row?.secondarySigns) ? row.secondarySigns : [];
      const secondaryTotal = secondarySigns.reduce((sum: number, sec: any) => {
        const secSqft = calcSqft(Number(sec?.width || 0), Number(sec?.height || 0));
        return sum + roundTo(secSqft * quantity, 4);
      }, 0);
      const totalSqft = roundTo((Number(row?.totalSqft || 0) || roundTo(sqft * quantity, 4)) + secondaryTotal, 4);

      items.push({
        takeoff_id: takeoffId,
        product_name: row?.signDesignation || row?.signDescription || 'MPT Sign',
        category: 'sign',
        unit: 'SF',
        quantity,
        requisition_type: 'none',
        notes: row?.signLegend || null,
        in_stock_qty: 0,
        to_order_qty: 0,
        inventory_status: 'pending_review',
        material: row?.material || null,
        sign_details: row,
        sign_description: row?.signDescription || null,
        sheeting: row?.sheeting || null,
        width_inches: width || null,
        height_inches: height || null,
        sqft,
        total_sqft: totalSqft,
        load_order: Number(row?.loadOrder || index + 1),
        cover: Boolean(row?.cover),
        secondary_signs: secondarySigns,
      });
    });
  });

  return items;
}

function buildPermanentItems(
  takeoffId: string,
  permanentSignRows: Record<string, any[]>,
  permanentEntryRows: Record<string, any[]>
) {
  const items: JsonRecord[] = [];

  Object.entries(permanentSignRows || {}).forEach(([itemNumber, rows]) => {
    if (!Array.isArray(rows)) return;

    rows.forEach((row, index) => {
      const width = Number(row?.width || 0);
      const height = Number(row?.height || 0);
      const sqft = calcSqft(width, height);
      const quantity = Number(row?.quantity || 0);
      const totalSqft = roundTo(Number(row?.totalSqft || 0) || roundTo(sqft * quantity, 4), 4);
      const sanitizedRow = {
        ...row,
        secondarySigns: [],
      };

      items.push({
        takeoff_id: takeoffId,
        product_name: row?.signDesignation || row?.signDescription || itemNumber || 'Permanent Sign',
        category: 'sign',
        unit: 'SF',
        quantity,
        requisition_type: 'none',
        notes: row?.signLegend || row?.planSheetNum || null,
        in_stock_qty: 0,
        to_order_qty: 0,
        inventory_status: 'pending_review',
        material: row?.material || null,
        sign_details: sanitizedRow,
        sign_description: row?.signDescription || null,
        sheeting: row?.sheeting || null,
        width_inches: width || null,
        height_inches: height || null,
        sqft,
        total_sqft: totalSqft,
        load_order: index + 1,
        cover: true,
        secondary_signs: [],
      });
    });
  });

  Object.entries(permanentEntryRows || {}).forEach(([itemNumber, rows]) => {
    if (!Array.isArray(rows)) return;

    rows.forEach((row, index) => {
      items.push({
        takeoff_id: takeoffId,
        product_name: itemNumber || 'Permanent Sign Item',
        category: 'sign',
        unit: 'EA',
        quantity: Number(row?.quantity || 0),
        requisition_type: 'none',
        notes: row?.description || null,
        in_stock_qty: 0,
        to_order_qty: 0,
        inventory_status: 'pending_review',
        material: null,
        sign_details: row,
        sign_description: row?.description || null,
        sheeting: null,
        width_inches: null,
        height_inches: null,
        sqft: null,
        total_sqft: null,
        load_order: index + 1,
        cover: true,
        secondary_signs: [],
      });
    });
  });

  return items;
}

function buildGeneralItems(takeoffId: string, workType: string, vehicleItems: any[], rollingStockItems: any[], additionalItems: any[]) {
  const items: JsonRecord[] = [];

  vehicleItems.forEach((item, index) => {
    const vehicleLabel = item?.vehicleType || 'Vehicle';
    items.push({
      takeoff_id: takeoffId,
      product_name: vehicleLabel,
      category: 'vehicle',
      unit: 'EA',
      quantity: Number(item?.quantity || 0),
      requisition_type: 'none',
      notes: item?.description || null,
      in_stock_qty: 0,
      to_order_qty: 0,
      inventory_status: 'pending_review',
      material: null,
      sign_details: item,
      sign_description: item?.description || vehicleLabel || null,
      sheeting: null,
      width_inches: null,
      height_inches: null,
      sqft: null,
      total_sqft: null,
      load_order: index + 1,
      cover: true,
      secondary_signs: [],
    });
  });

  rollingStockItems.forEach((item, index) => {
    items.push({
      takeoff_id: takeoffId,
      product_name: item?.equipmentLabel || item?.equipmentId || 'Rolling Stock',
      category: 'additional',
      unit: 'EA',
      quantity: 1,
      requisition_type: 'none',
      notes: null,
      in_stock_qty: 0,
      to_order_qty: 0,
      inventory_status: 'pending_review',
      material: null,
      sign_details: item,
      sign_description: item?.equipmentLabel || null,
      sheeting: null,
      width_inches: null,
      height_inches: null,
      sqft: null,
      total_sqft: null,
      load_order: index + 1,
      cover: true,
      secondary_signs: [],
    });
  });

  additionalItems.forEach((item, index) => {
    const productName = item?.name === '__custom'
      ? item?.customName || 'Custom Item'
      : item?.name || 'Additional Item';
    items.push({
      takeoff_id: takeoffId,
      product_name: productName,
      category: 'additional',
      unit: 'EA',
      quantity: Number(item?.quantity || 0),
      requisition_type: 'none',
      notes: item?.description || null,
      in_stock_qty: 0,
      to_order_qty: 0,
      inventory_status: 'pending_review',
      material: null,
      sign_details: item,
      sign_description: item?.description || null,
      sheeting: null,
      width_inches: null,
      height_inches: null,
      sqft: null,
      total_sqft: null,
      load_order: index + 1,
      cover: true,
      secondary_signs: [],
    });
  });

  return items;
}

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

    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedWorkType = typeof workType === 'string' ? workType.trim() : '';
    const sanitizedPermanentSignRows = Object.fromEntries(
      Object.entries(permanentSignRows || {}).map(([itemNumber, rows]) => [
        itemNumber,
        Array.isArray(rows)
          ? rows.map((row) => ({ ...row, secondarySigns: [] }))
          : [],
      ])
    );

    if (!jobId || !normalizedTitle || !normalizedWorkType) {
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
      title: normalizedTitle,
      work_type: normalizedWorkType,
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
      permanent_sign_rows: sanitizedPermanentSignRows,
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

    const normalizedItems = [
      ...buildMptItems(takeoff.id, signRows || {}),
      ...buildPermanentItems(takeoff.id, sanitizedPermanentSignRows, permanentEntryRows || {}),
      ...buildGeneralItems(takeoff.id, normalizedWorkType, vehicleItems || [], rollingStockItems || [], additionalItems || []),
    ];

    const { error: deleteItemsError } = await supabase
      .from('takeoff_items_l')
      .delete()
      .eq('takeoff_id', takeoff.id);

    if (deleteItemsError) {
      console.error('Error clearing existing takeoff items:', deleteItemsError);
      return NextResponse.json(
        { error: 'Failed to sync takeoff items' },
        { status: 500 }
      );
    }

    if (normalizedItems.length > 0) {
      const { error: insertItemsError } = await supabase
        .from('takeoff_items_l')
        .insert(normalizedItems);

      if (insertItemsError) {
        console.error('Error inserting takeoff items:', insertItemsError);
        return NextResponse.json(
          { error: 'Failed to sync takeoff items' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      takeoff,
      itemCount: normalizedItems.length,
    });

  } catch (error) {
    console.error('Unexpected error in takeoff creation/update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
