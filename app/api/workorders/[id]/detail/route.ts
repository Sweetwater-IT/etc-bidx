import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface TakeoffSummary {
  id: string;
  title: string;
  status: string;
  work_type: string;
  install_date: string | null;
  pickup_date: string | null;
  item_count: number;
}

interface WOItem {
  id: string;
  item_number: string;
  description: string | null;
  contract_quantity: number;
  work_order_quantity: number;
  uom: string | null;
  sort_order: number;
}

interface JobInfo {
  id: string;
  project_name: string;
  etc_job_number: string | null;
  etc_branch: string | null;
  customer_name: string | null;
  customer_job_number: string | null;
  customer_pm: string | null;
  project_owner: string | null;
  county: string | null;
  etc_project_manager: string | null;
  contract_number: string | null;
}

interface WODocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
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

    // Get work order to get job_id
    const { data: workOrder, error: woError } = await supabase
      .from('work_orders_l')
      .select('job_id, is_pickup')
      .eq('id', id)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const jobId = workOrder.job_id;
    const isPickup = workOrder.is_pickup;

    // Fetch all related data in parallel
    const [jobRes, takeoffRes, woItemsRes, sovRes, docsRes, pickupRes] = await Promise.all([
      // Job info
      supabase.from("jobs_l").select("id, project_name, etc_job_number, etc_branch, customer_name, customer_job_number, customer_pm, project_owner, county, etc_project_manager, contract_number").eq("id", jobId).single(),

      // Takeoffs linked to this work order
      supabase.from("takeoffs").select("id, title, status, work_type, install_date, pickup_date").eq("work_order_id", id).order("created_at", { ascending: true }),

      // Work order items
      supabase.from("work_order_items").select("*").eq("work_order_id", id).order("sort_order", { ascending: true }),

      // SOV items for picklist — try dedicated table first, fall back to JSONB column
      supabase.from("sov_items").select("id, item_number, description, quantity, uom").eq("job_id", jobId).order("sort_order", { ascending: true }),

      // Documents linked to this work order (via job + checklist)
      supabase.from("documents").select("id, file_name, file_path, file_type, file_size, uploaded_at").eq("job_id", jobId).like("file_path", `%work-orders/${id}%`).order("uploaded_at", { ascending: false }),

      // Pickup work order if this is a parent
      !isPickup ? supabase.from("work_orders_l").select("id, wo_number, status").eq("parent_work_order_id", id).eq("is_pickup", true).limit(1) : Promise.resolve({ data: null }),
    ]);

    // Process job data
    let job: JobInfo | null = null;
    if (jobRes.data) {
      job = jobRes.data as JobInfo;
    }

    // Process takeoff data with item counts
    let takeoffs: TakeoffSummary[] = [];
    if (takeoffRes.data && takeoffRes.data.length > 0) {
      const takeoffIds = takeoffRes.data.map((t: any) => t.id);
      const itemCounts = new Map<string, number>();
      if (takeoffIds.length > 0) {
        const { data: items } = await supabase
          .from("takeoff_items")
          .select("takeoff_id")
          .in("takeoff_id", takeoffIds);
        (items || []).forEach((i: any) => {
          itemCounts.set(i.takeoff_id, (itemCounts.get(i.takeoff_id) || 0) + 1);
        });
      }
      takeoffs = takeoffRes.data.map((t: any) => ({
        ...t,
        item_count: itemCounts.get(t.id) || 0
      }));
    }

    // Process work order items
    const woItems: WOItem[] = (woItemsRes.data || []) as WOItem[];

    // Process SOV items
    let sovItems: { id: string; item_number: string; description: string; quantity: number; uom: string }[] = [];
    if (sovRes.data && sovRes.data.length > 0) {
      sovItems = sovRes.data.map((s: any) => ({
        id: s.id,
        item_number: s.item_number || "",
        description: s.description || "",
        quantity: Number(s.quantity) || 0,
        uom: s.uom || "EA",
      }));
    } else if (jobRes.data) {
      // Fallback: read from JSONB sov_items column on jobs table
      const { data: jobFull } = await supabase
        .from("jobs_l")
        .select("sov_items")
        .eq("id", jobId)
        .single();
      const jsonItems = (jobFull?.sov_items as any[]) || [];
      sovItems = jsonItems.map((s: any) => ({
        id: s.id || crypto.randomUUID(),
        item_number: s.itemNumber || s.item_number || "",
        description: s.description || "",
        quantity: Number(s.quantity) || 0,
        uom: s.uom || "EA",
      }));
    }

    // Process documents
    const documents: WODocument[] = (docsRes.data || []) as WODocument[];

    // Process pickup work order
    let pickupWO: { id: string; wo_number: string | null; status: string } | null = null;
    if (pickupRes.data && pickupRes.data.length > 0) {
      pickupWO = pickupRes.data[0] as any;
    }

    return NextResponse.json({
      job,
      takeoffs,
      woItems,
      sovItems,
      documents,
      pickupWO,
    });

  } catch (error) {
    console.error('Error in work order detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}