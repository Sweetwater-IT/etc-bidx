import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type PickupItemUpdate = {
  item_id: string;
  condition: 'good' | 'serviceable' | 'damaged' | 'missing';
  images: string[]; // public URLs
};

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; workOrderId: string }> }
) {
  const { jobId, workOrderId } = await params;
  const supabase = getServerSupabase();

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
  { params }: { params: Promise<{ jobId: string; workOrderId: string }> }
) {
  const body = await req.json() as { items: PickupItemUpdate[] };

  const { jobId, workOrderId } = await params;
  const supabase = getServerSupabase();

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