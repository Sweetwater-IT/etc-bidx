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

    // Get work order to get job_id and takeoff_id
    const { data: workOrder, error: woError } = await supabase
      .from('work_orders_l')
      .select('job_id, is_pickup, takeoff_id')
      .eq('id', id)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const jobId = workOrder.job_id;
    const isPickup = workOrder.is_pickup;
    const takeoffId = workOrder.takeoff_id;

    // Helper function to fetch takeoff with retry logic
    const fetchTakeoffWithRetry = async (takeoffId: string, maxRetries = 5) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { data: takeoff, error } = await supabase
            .from("takeoffs_l")
            .select("id, title, status, work_type, install_date, pickup_date")
            .eq("id", takeoffId)
            .single();

          if (takeoff && !error) {
            return { data: [takeoff], error: null };
          }

          // If takeoff not found and this isn't the last attempt, wait and retry
          if (attempt < maxRetries - 1) {
            console.log(`Takeoff ${takeoffId} not found on attempt ${attempt + 1}, retrying in ${500 * (attempt + 1)}ms...`);
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          } else {
            console.error(`Takeoff ${takeoffId} not found after ${maxRetries} attempts`);
          }
        } catch (err) {
          console.error(`Error fetching takeoff ${takeoffId} on attempt ${attempt + 1}:`, err);
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }
      return { data: null, error: { message: 'Takeoff not found after retries' } };
    };

    // Fetch all related data in parallel
    const [jobRes, takeoffRes, woItemsRes, sovRes, docsRes, pickupRes] = await Promise.all([
      // Job info (fetch all fields like jobs API)
      supabase.from("jobs_l").select("*").eq("id", jobId).single(),

      // Takeoffs linked to this work order (by takeoff_id) - with retry logic
      takeoffId ? fetchTakeoffWithRetry(takeoffId) : Promise.resolve({ data: null }),

      // Work order items
      supabase.from("work_order_items_l").select("*").eq("work_order_id", id).order("sort_order", { ascending: true }),

      // SOV items for picklist — try dedicated table first, fall back to JSONB column
      supabase.from("sov_items").select("id, item_number, description, quantity, uom").eq("job_id", jobId).order("sort_order", { ascending: true }),

      // Documents linked to this work order (via job + checklist)
      supabase.from("documents").select("id, file_name, file_path, file_type, file_size, uploaded_at").eq("job_id", jobId).like("file_path", `%work-orders/${id}%`).order("uploaded_at", { ascending: false }),

      // Pickup work order if this is a parent
      !isPickup ? supabase.from("work_orders_l").select("id, wo_number, status").eq("parent_work_order_id", id).eq("is_pickup", true).limit(1) : Promise.resolve({ data: null }),
    ]);

    // Process job data (transform like jobs API)
    let job = null;
    if (jobRes.data) {
      const jobData = jobRes.data;
      const projectInfo = {
        projectName: jobData.project_name,
        etcJobNumber: jobData.etc_job_number,
        customerName: jobData.customer_name,
        customerJobNumber: jobData.customer_job_number,
        customerPM: jobData.customer_pm,
        customerPMEmail: jobData.customer_pm_email,
        customerPMPhone: jobData.customer_pm_phone,
        projectOwner: jobData.project_owner,
        contractNumber: jobData.contract_number,
        county: jobData.county,
        projectStartDate: jobData.project_start_date,
        projectEndDate: jobData.project_end_date,
        extensionDate: jobData.extension_date,
        otherNotes: jobData.additional_notes,
      };

      job = {
        projectInfo,
        ...jobData,
      };
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