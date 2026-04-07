import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const normalizeItemNumber = (value: unknown): string => String(value || '').trim().toUpperCase();

async function getAllowedItemNumbersForJob(jobId: string): Promise<Set<string>> {
  const { data: entries } = await supabase
    .from('sov_entries')
    .select('sov_items(item_number)')
    .eq('job_id', jobId);

  const allowed = new Set<string>();
  for (const entry of entries || []) {
    const itemNumber = normalizeItemNumber((entry as any)?.sov_items?.item_number);
    if (itemNumber) allowed.add(itemNumber);
  }

  return allowed;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string, workOrderId: string }> }
) {
  try {
    const { jobId, workOrderId } = await params;
    const body = await request.json();
    const { action, itemData } = body;

    if (!workOrderId) {
      return NextResponse.json({ error: 'Work order ID is required' }, { status: 400 });
    }

    if (action === 'add') {
      const allowedItemNumbers = await getAllowedItemNumbersForJob(jobId);
      const requestedItemNumber = normalizeItemNumber(itemData.item_number);
      if (requestedItemNumber && !allowedItemNumbers.has(requestedItemNumber)) {
        return NextResponse.json({ error: `Item number ${requestedItemNumber} is not on this job's Schedule of Values` }, { status: 400 });
      }

      // Add new item
      const nextSort = body.nextSort || 0;
      const { data, error } = await supabase
        .from("work_order_items_l")
        .insert({
          work_order_id: workOrderId,
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

      if (updates?.item_number !== undefined) {
        const allowedItemNumbers = await getAllowedItemNumbersForJob(jobId);
        const requestedItemNumber = normalizeItemNumber(updates.item_number);
        if (requestedItemNumber && !allowedItemNumbers.has(requestedItemNumber)) {
          return NextResponse.json({ error: `Item number ${requestedItemNumber} is not on this job's Schedule of Values` }, { status: 400 });
        }
      }

      // Create a copy of updates to modify
      const processedUpdates = { ...updates };

      // Convert item_number from string to integer if present
      // Only convert if it looks like a formatted number (contains digits)
      // Skip built-in item types like "DELIVERY", "SERVICE"
      if (processedUpdates.item_number !== undefined) {
        const itemNumberStr = processedUpdates.item_number?.toString() || '';

        // Skip conversion for built-in item types
        const builtInTypes = ['DELIVERY', 'SERVICE'];
        if (builtInTypes.includes(itemNumberStr.toUpperCase())) {
          // Keep as string for built-in types
          processedUpdates.item_number = itemNumberStr;
        } else {
          // Check if it contains digits (likely a formatted number)
          const hasDigits = /\d/.test(itemNumberStr);
          if (hasDigits) {
            // Remove any non-numeric characters and parse as integer
            const cleanItemNumber = itemNumberStr.replace(/[^\d]/g, '');
            const itemNumberInt = parseInt(cleanItemNumber, 10);

            if (!isNaN(itemNumberInt) && itemNumberInt > 0) {
              processedUpdates.item_number = itemNumberInt;
            } else {
              // If conversion fails, keep original string
              processedUpdates.item_number = itemNumberStr;
            }
          } else {
            // No digits found, keep as string
            processedUpdates.item_number = itemNumberStr;
          }
        }
      }

      // Handle sov_item_id conversion - if it's a string that looks like an item number,
      // look up the actual UUID from the sov_items table
      if (processedUpdates.sov_item_id !== undefined && typeof processedUpdates.sov_item_id === 'string') {
        const sovItemIdStr = processedUpdates.sov_item_id;

        // If it looks like a UUID (has dashes), keep it as is
        if (sovItemIdStr.includes('-')) {
          // Already a UUID, keep as is
        } else {
          // Looks like an item number, look up the actual UUID from sov_items table
          const { data: sovItem, error: sovError } = await supabase
            .from('sov_items')
            .select('id')
            .eq('item_number', sovItemIdStr)
            .single();

          if (sovError || !sovItem) {
            console.error('Error looking up SOV item UUID for item_number:', sovItemIdStr, sovError);
            // If lookup fails, set to null to indicate no SOV association
            processedUpdates.sov_item_id = null;
          } else {
            processedUpdates.sov_item_id = sovItem.id;
          }
        }
      }

      const { error } = await supabase
        .from("work_order_items_l")
        .update(processedUpdates)
        .eq("id", itemId);

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