import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

      // Create a copy of updates to modify
      const processedUpdates = { ...updates };

      // Convert item_number from string to integer if present
      if (processedUpdates.item_number !== undefined) {
        const itemNumberStr = processedUpdates.item_number?.toString() || '';
        // Remove any non-numeric characters and parse as integer
        const cleanItemNumber = itemNumberStr.replace(/[^\d]/g, '');
        const itemNumberInt = parseInt(cleanItemNumber, 10);

        if (!isNaN(itemNumberInt)) {
          processedUpdates.item_number = itemNumberInt;
        } else {
          // If conversion fails, set to null or keep as string if database allows
          processedUpdates.item_number = null;
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