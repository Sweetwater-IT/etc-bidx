import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Work order ID is required' }, { status: 400 });
    }

    console.log('Fetching work order items for work order:', id);

    const { data, error } = await supabase
      .from('work_order_items_l')
      .select('*')
      .eq('work_order_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching work order items:', error);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    console.log('Found work order items:', data?.length || 0, 'items');
    if (data && data.length > 0) {
      console.log('First item:', { id: data[0].id, item_number: data[0].item_number, description: data[0].description?.substring(0, 50) + '...' });
    }

    return NextResponse.json({ items: data || [] });

  } catch (error) {
    console.error('Error in work order items GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, itemData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Work order ID is required' }, { status: 400 });
    }

    if (action === 'add') {
      // Add new item
      const nextSort = body.nextSort || 0;
      const { data, error } = await supabase
        .from("work_order_items_l")
        .insert({
          work_order_id: id,
          item_number: itemData.item_number || "",
          description: itemData.description || "",
          contract_quantity: itemData.contract_quantity || 1,
          work_order_quantity: itemData.work_order_quantity || 1,
          uom: itemData.uom || "EA",
          sort_order: nextSort,
        })
        .select("*")
        .single();

      if (error) {
        console.error('Error adding work order item:', error);
        return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
      }

      return NextResponse.json({ item: data });

    } else if (action === 'update') {
      // Update existing item
      const { itemId, updates } = itemData;
      console.log('[WO Items API] Update request:', { itemId: itemId, itemIdType: typeof itemId, updates });

      let numericItemId: number;

      // Check if itemId is already a valid integer
      if (typeof itemId === 'number' && !isNaN(itemId)) {
        numericItemId = itemId;
        console.log('[WO Items API] itemId is already a valid integer:', numericItemId);
      } else if (typeof itemId === 'string') {
        // Try to parse as integer first
        const parsed = parseInt(itemId, 10);
        if (!isNaN(parsed)) {
          numericItemId = parsed;
          console.log('[WO Items API] Parsed string to integer:', numericItemId);
        } else {
          // itemId is a UUID string - need to find the actual database ID
          console.log('[WO Items API] itemId is a UUID string, attempting to resolve to database ID');

          // Try to find the item by work_order_id and sov_item_id (if available)
          if (updates.sov_item_id) {
            console.log('[WO Items API] Looking up item by work_order_id and sov_item_id');
            const { data: existingItem, error: lookupError } = await supabase
              .from("work_order_items_l")
              .select("id")
              .eq("work_order_id", id)
              .eq("sov_item_id", updates.sov_item_id)
              .single();

            if (lookupError || !existingItem) {
              console.error('[WO Items API] Could not find item by sov_item_id:', { workOrderId: id, sovItemId: updates.sov_item_id, error: lookupError });
              return NextResponse.json({ error: 'Could not find work order item to update' }, { status: 404 });
            }

            numericItemId = existingItem.id;
            console.log('[WO Items API] Resolved UUID to database ID:', numericItemId);
          } else {
            console.error('[WO Items API] Cannot resolve UUID itemId without sov_item_id in updates');
            return NextResponse.json({ error: 'Invalid item ID format - cannot resolve UUID' }, { status: 400 });
          }
        }
      } else {
        console.error('[WO Items API] Invalid itemId type:', typeof itemId, itemId);
        return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 });
      }

      console.log('[WO Items API] Final numericItemId for update:', numericItemId);

      const { error } = await supabase
        .from("work_order_items_l")
        .update(updates)
        .eq("id", numericItemId);

      if (error) {
        console.error('Error updating work order item:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
      }

      return NextResponse.json({ success: true });

    } else if (action === 'delete') {
      // Delete item
      const { itemId } = itemData;
      const { error } = await supabase
        .from("work_order_items_l")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error('Error deleting work order item:', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in work order items API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}