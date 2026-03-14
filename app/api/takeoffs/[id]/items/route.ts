import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: takeoffId } = await params;
    const body = await request.json();

    console.log('🔍 [ITEMS API] Starting item update for takeoff:', takeoffId);
    console.log('🔍 [ITEMS API] Request body:', body);

    if (!takeoffId) {
      return NextResponse.json({ error: 'Takeoff ID is required' }, { status: 400 });
    }

    const { itemId, return_details, return_condition, damage_photos } = body;

    console.log('🔍 [ITEMS API] Extracted itemId:', itemId, 'fields:', {
      hasReturnDetails: !!return_details,
      hasReturnCondition: !!return_condition,
      hasDamagePhotos: !!damage_photos
    });

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Check if this is a pickup takeoff
    const { data: takeoff, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .select('is_pickup')
      .eq('id', takeoffId)
      .single();

    if (takeoffError) {
      console.error('Error fetching takeoff:', takeoffError);
      return NextResponse.json({ error: 'Takeoff not found' }, { status: 404 });
    }

    let updateResult;

    if (takeoff.is_pickup) {
      // Update pickup takeoff item
      console.log('🔍 [ITEM UPDATE] Updating pickup takeoff item:', itemId);

      const updateData: any = {};
      if (return_details !== undefined) updateData.return_details = return_details;
      if (damage_photos !== undefined) updateData.pickup_images = damage_photos;

      // Handle individual condition updates
      if (return_details && typeof return_details === 'object') {
        if (return_details.sign !== undefined) updateData.sign_condition = return_details.sign;
        if (return_details.structure !== undefined) updateData.structure_condition = return_details.structure;
        if (return_details.lights !== undefined) updateData.light_condition = return_details.lights;
      }

      console.log('🔍 [ITEM UPDATE] Prepared update data for pickup item:', {
        updateDataKeys: Object.keys(updateData),
        hasReturnDetails: !!updateData.return_details,
        hasPickupImages: !!updateData.pickup_images,
        signCondition: updateData.sign_condition,
        structureCondition: updateData.structure_condition,
        lightCondition: updateData.light_condition
      });

      updateResult = await supabase
        .from('pickup_takeoff_items_l')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      console.log('🔍 [ITEM UPDATE] Pickup item update result:', {
        success: !updateResult.error,
        error: updateResult.error?.message,
        updatedId: updateResult.data?.id
      });
    } else {
      // Update regular takeoff item
      console.log('🔍 [ITEM UPDATE] Updating regular takeoff item:', itemId);

      const updateData: any = {};
      if (return_details !== undefined) updateData.return_details = return_details;
      if (return_condition !== undefined) updateData.return_condition = return_condition;
      if (damage_photos !== undefined) updateData.damage_photos = damage_photos;

      updateResult = await supabase
        .from('takeoff_items_l')
        .update(updateData)
        .eq('id', itemId)
        .eq('takeoff_id', takeoffId)
        .select()
        .single();
    }

    if (updateResult.error) {
      console.error('Error updating takeoff item:', updateResult.error);
      return NextResponse.json({ error: 'Failed to update takeoff item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updateResult.data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
