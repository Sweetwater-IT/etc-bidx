import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { normalizeWorkOrderStatusForDb, normalizeWorkOrderStatusForUi } from '@/lib/workOrderStatus';

const WORK_ORDER_DESCRIPTION_MIN_LENGTH = 40;
const WORK_ORDER_DESCRIPTION_MAX_LENGTH = 256;

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const resolvedParams = await context.params;
    const workOrderId = resolvedParams.id;

    const { data: workOrder, error } = await supabase
      .from('work_orders_l')
      .select('*')
      .eq('id', workOrderId)
      .single();

    if (error) {
      console.error('Error fetching work order:', error);
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...workOrder,
      status: normalizeWorkOrderStatusForUi(workOrder.status),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const resolvedParams = await context.params;
    const workOrderId = resolvedParams.id;
    const patch = await request.json();
    const description =
      typeof patch.description === 'string'
        ? patch.description
        : patch.description === null
          ? null
          : undefined;

    if (typeof description === 'string' && description.trim().length < WORK_ORDER_DESCRIPTION_MIN_LENGTH) {
      return NextResponse.json(
        { error: `Description must be at least ${WORK_ORDER_DESCRIPTION_MIN_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (typeof description === 'string' && description.length > WORK_ORDER_DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Description must be ${WORK_ORDER_DESCRIPTION_MAX_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const normalizedPatch = {
      ...patch,
      ...(Object.prototype.hasOwnProperty.call(patch, 'status')
        ? { status: normalizeWorkOrderStatusForDb(patch.status) }
        : {}),
    };

    const { data: workOrder, error } = await supabase
      .from('work_orders_l')
      .update(normalizedPatch)
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating work order:', error);
      return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 });
    }

    return NextResponse.json({
      ...workOrder,
      status: normalizeWorkOrderStatusForUi(workOrder.status),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const resolvedParams = await context.params;
    const workOrderId = resolvedParams.id;

    // Get current status and job_id before deleting
    const { data: workOrder } = await supabase
      .from('work_orders_l')
      .select('job_id, status')
      .eq('id', workOrderId)
      .single();

    const deletableStatuses = new Set(['draft', 'ready', 'scheduled']);
    const currentStatus = String(workOrder?.status || '').toLowerCase();

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (!deletableStatuses.has(currentStatus)) {
      return NextResponse.json(
        { error: 'Work orders can only be deleted through scheduled status' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('work_orders_l')
      .delete()
      .eq('id', workOrderId);

    if (error) {
      console.error('Error deleting work order:', error);
      return NextResponse.json({ error: 'Failed to delete work order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobId: workOrder?.job_id
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
