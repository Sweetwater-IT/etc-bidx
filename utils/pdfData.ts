import { supabase } from '@/lib/supabase';

export async function getTakeoffPdfData(takeoffId: string) {
  // Fetch takeoff with job and customer data
  const { data: takeoff, error: takeoffError } = await supabase
    .from('takeoffs_l')
    .select(`
      *,
      jobs_l:job_id (
        id,
        project_name,
        customer_name,
        customer_job_number,
        customer_pm,
        project_owner,
        county,
        etc_branch,
        etc_project_manager,
        etc_job_number,
        install_date,
        pickup_date,
        needed_by_date
      )
    `)
    .eq('id', takeoffId)
    .single();

  if (takeoffError || !takeoff) {
    throw new Error('Takeoff not found');
  }

  const job = takeoff.jobs_l;

  // Transform sign_rows into items array
  const items: any[] = [];
  const signRowsData = takeoff.sign_rows as Record<string, any[]> || {};

  for (const [category, rows] of Object.entries(signRowsData)) {
    for (const row of rows) {
      items.push({
        product_name: row.signDesignation || '',
        category: category,
        unit: 'EA',
        quantity: row.quantity || 0,
        notes: JSON.stringify({
          signLegend: row.signLegend || '',
          dimensionLabel: row.dimensionLabel || '',
          sheeting: row.sheeting || '',
          structureType: row.structureType || '',
          bLights: row.bLights || '',
          sqft: row.sqft || 0,
          totalSqft: row.totalSqft || 0,
          material: row.material || '',
          itemNumber: row.itemNumber || '',
          postSize: row.postSize || '',
          planSheetNum: row.planSheetNum || '',
          planSheetTotal: row.planSheetTotal || '',
          loadOrder: row.loadOrder || 0,
          cover: row.cover || false,
          secondarySigns: row.secondarySigns || []
        }),
        material: row.material || ''
      });
    }
  }

  return {
    title: takeoff.title || '',
    workType: takeoff.work_type || '',
    status: takeoff.status || '',
    installDate: job?.install_date || null,
    pickupDate: job?.pickup_date || null,
    neededByDate: job?.needed_by_date || null,
    notes: takeoff.notes || null,
    workOrderNumber: takeoff.work_order_number || null,
    contractedOrAdditional: takeoff.contracted_or_additional || 'contracted',
    projectName: job?.project_name || '',
    etcJobNumber: job?.etc_job_number || '',
    customerName: job?.customer_name || '',
    customerJobNumber: job?.customer_job_number || '',
    customerPM: job?.customer_pm || '',
    projectOwner: job?.project_owner || '',
    county: job?.county || '',
    etcBranch: job?.etc_branch || '',
    etcProjectManager: job?.etc_project_manager || '',
    crewNotes: takeoff.crew_notes || null,
    buildShopNotes: takeoff.build_shop_notes || null,
    items
  };
}

export async function getBillingPacketData(workOrderId: string) {
  // Fetch work order with job data
  const { data: workOrder, error: woError } = await supabase
    .from('work_orders')
    .select(`
      *,
      jobs_l:job_id (
        id,
        project_name,
        customer_name,
        customer_job_number,
        customer_pm,
        project_owner,
        county,
        etc_branch,
        etc_project_manager,
        etc_job_number,
        install_date,
        pickup_date
      )
    `)
    .eq('id', workOrderId)
    .single();

  if (woError || !workOrder) {
    throw new Error('Work order not found');
  }

  const job = workOrder.jobs_l;

  // Get work order items
  const { data: woItems, error: itemsError } = await supabase
    .from('work_order_items')
    .select('*')
    .eq('work_order_id', workOrderId);

  if (itemsError) {
    console.warn('Error fetching work order items:', itemsError);
  }

  const items = (woItems || []).map(item => ({
    item_number: item.item_number || '',
    description: item.description || '',
    uom: item.uom || 'EA',
    contract_quantity: item.contract_quantity || 0,
    work_order_quantity: item.work_order_quantity || 0
  }));

  return {
    woNumber: workOrder.work_order_number || workOrder.id,
    woTitle: workOrder.title || '',
    woDescription: workOrder.description || '',
    woNotes: workOrder.notes || '',
    etcAssignedTo: workOrder.etc_assigned_to || '',
    contractedOrAdditional: workOrder.contracted_or_additional || 'contracted',
    customerPocPhone: workOrder.customer_poc_phone || '',
    projectName: job?.project_name || '',
    etcJobNumber: job?.etc_job_number || '',
    customerName: job?.customer_name || '',
    customerJobNumber: job?.customer_job_number || '',
    customerPM: job?.customer_pm || '',
    projectOwner: job?.project_owner || '',
    county: job?.county || '',
    etcBranch: job?.etc_branch || '',
    etcProjectManager: job?.etc_project_manager || '',
    installDate: job?.install_date || '',
    pickupDate: job?.pickup_date || '',
    items,
    crewNotes: workOrder.crew_notes || '',
    customerNotOnSite: workOrder.customer_not_on_site || false,
    customerSignatureName: workOrder.customer_signature_name || '',
    signedAt: workOrder.signed_at || ''
  };
}