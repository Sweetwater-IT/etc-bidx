import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type BuildRequestRow = {
  id: string;
  job_id: string;
  takeoff_id: string;
  work_order_id: string | null;
  branch: string | null;
  requested_by: string | null;
  requested_at: string;
  priority: string;
  status: string;
  pm_notes: string | null;
  builder_notes: string | null;
  inventory_notes: string | null;
  rejection_reason: string | null;
  assigned_builder: string | null;
  signs_ordered_at: string | null;
  signs_ready_at: string | null;
  materials_received: boolean;
  build_started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  archived_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  cancel_notes: string | null;
  revision_number: number;
  chain_root_takeoff_id: string;
  superseded_by_takeoff_id: string | null;
  last_snapshot_json: unknown;
  created_at: string;
  updated_at: string;
};

type JobRow = {
  id: string;
  project_name: string | null;
  customer_name: string | null;
  etc_job_number: string | null;
  etc_branch: string | null;
  project_owner: string | null;
  contract_number: string | null;
};

type TakeoffRow = {
  id: string;
  title: string | null;
  needed_by_date: string | null;
  priority: string | null;
  build_shop_notes: string | null;
  destination: string | null;
  status: string | null;
  revision_number: number | null;
};

type WorkOrderRow = {
  id: string;
  wo_number: string | null;
  status: string | null;
  scheduled_date: string | null;
};

type BuildRequestItemStatRow = {
  build_request_id: string;
  quantity: number | string | null;
  category: string | null;
  structure_type: string | null;
  order_required: boolean | null;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const archived = searchParams.get("archived") === "true";

    let query = supabase
      .from("build_requests_l")
      .select("*")
      .order("requested_at", { ascending: false });

    if (archived) {
      query = query.not("archived_at", "is", null);
    } else {
      query = query.is("archived_at", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching build requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch build requests" },
        { status: 500 }
      );
    }

    const requests = (data || []) as BuildRequestRow[];
    if (requests.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const jobIds = [...new Set(requests.map((request) => request.job_id))];
    const takeoffIds = [...new Set(requests.map((request) => request.takeoff_id))];
    const workOrderIds = [
      ...new Set(
        requests
          .map((request) => request.work_order_id)
          .filter((value): value is string => Boolean(value))
      ),
    ];
    const requestIds = requests.map((request) => request.id);

    const [jobsResult, takeoffsResult, workOrdersResult, itemsResult] =
      await Promise.all([
        supabase
          .from("jobs_l")
          .select(
            "id, project_name, customer_name, etc_job_number, etc_branch, project_owner, contract_number"
          )
          .in("id", jobIds),
        supabase
          .from("takeoffs_l")
          .select(
            "id, title, needed_by_date, priority, build_shop_notes, destination, status, revision_number"
          )
          .in("id", takeoffIds),
        workOrderIds.length > 0
          ? supabase
              .from("work_orders_l")
              .select("id, wo_number, status, scheduled_date")
              .in("id", workOrderIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("build_request_items_l")
          .select(
            "build_request_id, quantity, category, structure_type, order_required"
          )
          .in("build_request_id", requestIds),
      ]);

    if (jobsResult.error || takeoffsResult.error || workOrdersResult.error || itemsResult.error) {
      console.error("Error enriching build requests:", {
        jobsError: jobsResult.error,
        takeoffsError: takeoffsResult.error,
        workOrdersError: workOrdersResult.error,
        itemsError: itemsResult.error,
      });
      return NextResponse.json(
        { error: "Failed to load build request details" },
        { status: 500 }
      );
    }

    const jobs = (jobsResult.data || []) as JobRow[];
    const takeoffs = (takeoffsResult.data || []) as TakeoffRow[];
    const workOrders = (workOrdersResult.data || []) as WorkOrderRow[];
    const itemRows = (itemsResult.data || []) as BuildRequestItemStatRow[];

    const jobMap = new Map<string, JobRow>();
    jobs.forEach((job) => {
      jobMap.set(job.id, job);
    });

    const takeoffMap = new Map<string, TakeoffRow>();
    takeoffs.forEach((takeoff) => {
      takeoffMap.set(takeoff.id, takeoff);
    });

    const workOrderMap = new Map<string, WorkOrderRow>();
    workOrders.forEach((workOrder) => {
      workOrderMap.set(workOrder.id, workOrder);
    });

    const itemStats = new Map<
      string,
      {
        itemCount: number;
        structureCount: number;
        typeIII: number;
        hStand: number;
        anyOrderRequired: boolean;
      }
    >();

    for (const item of itemRows) {
      const current = itemStats.get(item.build_request_id) || {
        itemCount: 0,
        structureCount: 0,
        typeIII: 0,
        hStand: 0,
        anyOrderRequired: false,
      };

      const quantity = Number(item.quantity) || 0;
      const category = (item.category || "").toLowerCase();
      const hasStructure = Boolean(item.structure_type);

      current.itemCount += quantity;
      current.anyOrderRequired = current.anyOrderRequired || Boolean(item.order_required);
      if (hasStructure) {
        current.structureCount += 1;
      }
      if (category.includes("type iii") || category.includes("type-iii") || category.includes("barricade")) {
        current.typeIII += quantity;
      }
      if (category.includes("h-stand") || category.includes("hstand") || category.includes("h stand")) {
        current.hStand += quantity;
      }

      itemStats.set(item.build_request_id, current);
    }

    const enriched = requests.map((request) => {
      const job = jobMap.get(request.job_id);
      const takeoff = takeoffMap.get(request.takeoff_id);
      const workOrder = request.work_order_id
        ? workOrderMap.get(request.work_order_id)
        : null;
      const stats = itemStats.get(request.id);

      return {
        ...request,
        job_name: job?.project_name || "",
        customer_name: job?.customer_name || "",
        etc_job_number: job?.etc_job_number || "",
        etc_branch: request.branch || job?.etc_branch || "",
        project_owner: job?.project_owner || "",
        contract_number: job?.contract_number || "",
        takeoff_title: takeoff?.title || "",
        takeoff_needed_by: takeoff?.needed_by_date || null,
        takeoff_priority: takeoff?.priority || "standard",
        takeoff_build_shop_notes: takeoff?.build_shop_notes || "",
        takeoff_destination: takeoff?.destination || "",
        takeoff_status: takeoff?.status || "",
        takeoff_revision_number: takeoff?.revision_number || 1,
        wo_number: workOrder?.wo_number || null,
        work_order_status: workOrder?.status || null,
        scheduled_date: workOrder?.scheduled_date || null,
        item_count: stats?.itemCount || 0,
        structure_count: stats?.structureCount || 0,
        type_iii_count: stats?.typeIII || 0,
        hstand_count: stats?.hStand || 0,
        any_order_required: stats?.anyOrderRequired || false,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error in build requests API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
