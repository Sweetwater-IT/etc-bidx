import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const normalizeItemNumber = (value: unknown): string => String(value || '').trim().toUpperCase();

async function getAllowedItemNumbersForWorkOrder(workOrderId: string): Promise<Set<string>> {
  const { data: wo } = await supabase
    .from('work_orders_l')
    .select('job_id')
    .eq('id', workOrderId)
    .single();

  if (!wo?.job_id) return new Set<string>();

  const { data: entries } = await supabase
    .from('sov_entries')
    .select('sov_items(item_number)')
    .eq('job_id', wo.job_id);

  const allowed = new Set<string>();
  for (const entry of entries || []) {
    const itemNumber = normalizeItemNumber((entry as any)?.sov_items?.item_number);
    if (itemNumber) allowed.add(itemNumber);
  }

  return allowed;
}

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
      const allowedItemNumbers = await getAllowedItemNumbersForWorkOrder(id);
      const requestedItemNumber = normalizeItemNumber(itemData.item_number);
      if (requestedItemNumber && !allowedItemNumbers.has(requestedItemNumber)) {
        return NextResponse.json({ error: `Item number ${requestedItemNumber} is not on this job's Schedule of Values` }, { status: 400 });
      }

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

      if (updates?.item_number !== undefined) {
        const allowedItemNumbers = await getAllowedItemNumbersForWorkOrder(id);
        const requestedItemNumber = normalizeItemNumber(updates.item_number);
        if (requestedItemNumber && !allowedItemNumbers.has(requestedItemNumber)) {
          return NextResponse.json({ error: `Item number ${requestedItemNumber} is not on this job's Schedule of Values` }, { status: 400 });
        }
      }

      // The itemId is the database primary key - use it directly
      let dbItemId: string | number;

      if (typeof itemId === 'number' && !isNaN(itemId)) {
        // itemId is already a number (integer primary key)
        dbItemId = itemId;
        console.log('[WO Items API] itemId is already a valid integer:', dbItemId);
      } else if (typeof itemId === 'string') {
        // Check if it's a UUID (contains dashes)
        if (itemId.includes('-')) {
          // itemId is a UUID string - use it directly as the database ID
          dbItemId = itemId;
          console.log('[WO Items API] itemId is a UUID, using directly:', dbItemId);
        } else {
          // Try to parse as integer
          const parsed = parseInt(itemId, 10);
          if (!isNaN(parsed)) {
            dbItemId = parsed;
            console.log('[WO Items API] Parsed string to integer:', dbItemId);
          } else {
            console.error('[WO Items API] Invalid itemId format:', itemId);
            return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 });
          }
        }
      } else {
        console.error('[WO Items API] Invalid itemId type:', typeof itemId, itemId);
        return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 });
      }

      console.log('[WO Items API] Final dbItemId for update:', dbItemId);

      const { error } = await supabase
        .from("work_order_items_l")
        .update(updates)
        .eq("id", dbItemId);

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