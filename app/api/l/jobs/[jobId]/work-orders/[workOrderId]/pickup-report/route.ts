import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

type PickupItemUpdate = {
  item_id: string;
  condition: 'good' | 'serviceable' | 'damaged' | 'missing';
  images: string[]; // public URLs
};

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string; workOrderId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId, workOrderId } = params;

  const { data, error } = await supabase
    .from('work_order_items_l')
    .select(`
      *,
      pickup_condition,
      pickup_images
    `)
    .eq('work_order_id', workOrderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string; workOrderId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { items: PickupItemUpdate[] };

  const { jobId, workOrderId } = params;

  const updates = body.items.map(({ item_id, condition, images }) => ({
    id: item_id,
    pickup_condition: condition,
    pickup_images: images,
  }));

  const { data, error } = await supabase
    .from('work_order_items_l')
    .upsert(updates, { onConflict: 'id' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
