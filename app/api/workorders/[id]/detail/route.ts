import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface TakeoffSummary {
  id: string;
  title: string;
  status: string;
  work_type: string;
  is_pickup?: boolean;
  parent_takeoff_id?: string | null;
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
      .select('job_id, takeoff_id, is_pickup, parent_work_order_id')
      .eq('id', id)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const jobId = workOrder.job_id;
    const isPickup = Boolean(workOrder.is_pickup);
    const takeoffId = workOrder.takeoff_id;

    // Helper function to fetch takeoff with retry logic
    const fetchTakeoffWithRetry = async (takeoffId: string, maxRetries = 5) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { data: takeoff, error } = await supabase
            .from("takeoffs_l")
            .select("id, title, status, work_type, is_pickup, parent_takeoff_id, install_date, pickup_date")
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
    const [jobRes, takeoffRes, woItemsRes, sovRes, sovFullRes, docsRes, pickupRes, parentWORes] = await Promise.all([
      // Job info (fetch all fields like jobs API)
      supabase.from("jobs_l").select("*").eq("id", jobId).single(),

      // Takeoffs linked to this work order (by takeoff_id) - with retry logic
      takeoffId ? fetchTakeoffWithRetry(takeoffId) : Promise.resolve({ data: null }),

      // Work order items
      supabase.from("work_order_items_l").select("*").eq("work_order_id", id).order("sort_order", { ascending: true }),

      // SOV items for picklist — query sov_entries joined with sov_items for job-specific items
      supabase
        .from("sov_entries")
        .select(`
          id,
          quantity,
          unit_price,
          extended_price,
          retainage_type,
          retainage_value,
          retainage_amount,
          notes,
          sov_item_id,
          sov_items!inner (
            id,
            item_number,
            display_item_number,
            description,
            display_name,
            work_type,
            uom_1,
            uom_2,
            uom_3,
            uom_4,
            uom_5,
            uom_6
          )
        `)
        .eq("job_id", jobId)
        .order("sort_order", { ascending: true }),

      // Full SOV items with pricing for PDFs — same query but with all fields
      supabase
        .from("sov_entries")
        .select(`
          id,
          quantity,
          unit_price,
          extended_price,
          retainage_type,
          retainage_value,
          retainage_amount,
          notes,
          sov_item_id,
          sov_items!inner (
            id,
            item_number,
            display_item_number,
            description,
            display_name,
            work_type,
            uom_1,
            uom_2,
            uom_3,
            uom_4,
            uom_5,
            uom_6
          )
        `)
        .eq("job_id", jobId)
        .order("sort_order", { ascending: true }),

      // Documents linked to this work order (via job + checklist)
      supabase.from("documents_l").select("id, file_name, file_path, file_type, file_size, uploaded_at").eq("job_id", jobId).like("file_path", `%work-orders/${id}%`).order("uploaded_at", { ascending: false }),

      // Pickup work order if this is a parent
      !isPickup ? supabase.from("work_orders_l").select("id, wo_number, status").eq("parent_work_order_id", id).eq("is_pickup", true).limit(1) : Promise.resolve({ data: null }),

      // Parent work order if this is a pickup
      isPickup && workOrder.parent_work_order_id
        ? supabase.from("work_orders_l").select("id, wo_number, status, takeoff_id").eq("id", workOrder.parent_work_order_id).maybeSingle()
        : Promise.resolve({ data: null }),
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
          .from("takeoff_items_l")
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

    // Process SOV items (from joined query)
    let sovItems: { id: string; item_number: string; description: string; quantity: number; uom: string }[] = [];
    if (sovRes.data && sovRes.data.length > 0) {
      sovItems = sovRes.data.map((s: any) => ({
        id: s.sov_items?.id || s.sov_item_id, // Use the actual sov_items.id UUID, fallback to sov_item_id if join failed
        item_number: s.sov_items?.item_number || s.sov_items?.display_item_number || "",
        description: s.sov_items?.display_name || s.sov_items?.description || "",
        quantity: Number(s.quantity) || 0,
        uom: s.sov_items?.uom_1 || s.sov_items?.uom_2 || s.sov_items?.uom_3 || s.sov_items?.uom_4 || s.sov_items?.uom_5 || s.sov_items?.uom_6 || "EA",
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

    // Process full SOV items with pricing (from joined query)
    let sovItemsFull: { id: string; itemNumber: string; description: string; uom: string; quantity: number; unitPrice: number; extendedPrice: number; retainageType: 'percent' | 'dollar'; retainageValue: number; retainageAmount: number; notes?: string | null }[] = [];
    if (sovFullRes.data && sovFullRes.data.length > 0) {
      sovItemsFull = sovFullRes.data.map((s: any) => ({
        id: s.sov_items?.id || s.sov_item_id, // Use the actual sov_items.id UUID, fallback to sov_item_id if join failed
        itemNumber: s.sov_items?.item_number || s.sov_items?.display_item_number || "",
        description: s.sov_items?.display_name || s.sov_items?.description || "",
        uom: s.sov_items?.uom_1 || s.sov_items?.uom_2 || s.sov_items?.uom_3 || s.sov_items?.uom_4 || s.sov_items?.uom_5 || s.sov_items?.uom_6 || "EA",
        quantity: Number(s.quantity) || 0,
        unitPrice: Number(s.unit_price) || 0,
        extendedPrice: Number(s.extended_price) || 0,
        retainageType: (s.retainage_type as 'percent' | 'dollar') || 'percent',
        retainageValue: Number(s.retainage_value) || 0,
        retainageAmount: Number(s.retainage_amount) || 0,
        notes: s.notes || null,
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
      sovItemsFull,
      documents,
      pickupWO,
      parentWO: parentWORes.data || null,
      isPickup,
    });

  } catch (error) {
    console.error('Error in work order detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
