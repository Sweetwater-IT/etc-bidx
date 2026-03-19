import { supabase } from '@/lib/supabase';

const MPT_SECTION_LABELS: Record<string, string> = {
  trailblazers: 'Trailblazers / H-Stands',
  type_iii: 'Type IIIs',
  sign_stands: 'Sign Stands',
};

const formatVehicleType = (vehicleType?: string | null) => {
  const vehicleTypeMap: Record<string, string> = {
    message_board: 'Message Board',
    tma: 'TMA',
    pickup_truck: 'Pick Up Truck',
    arrow_panel: 'Arrow Panel',
    speed_trailer: 'Speed Trailer',
  };

  if (!vehicleType) return 'Vehicle';
  return vehicleTypeMap[vehicleType] || vehicleType;
};

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const getAdditionalItemName = (item: Record<string, any> | null | undefined) => {
  const rawName = typeof item?.name === 'string' ? item.name.trim() : '';
  const rawDescription = typeof item?.description === 'string' ? item.description.trim() : '';
  const genericNames = new Set(['', 'additional item', 'additional items', '__custom']);

  if (!genericNames.has(rawName.toLowerCase())) {
    return rawName;
  }

  if (rawDescription) {
    return rawDescription;
  }

  return 'Additional Item';
};

const isConfiguredRow = (row: Record<string, any> | null | undefined) =>
  Boolean(
    row &&
    (
      hasValue(row.signDesignation) ||
      hasValue(row.signLegend) ||
      hasValue(row.signDescription) ||
      Number(row.quantity || 0) > 0
    )
  );

export async function getTakeoffPdfData(takeoffId: string) {
  console.log('getTakeoffPdfData: Called with takeoffId:', takeoffId);

  // Fetch takeoff record first
  const { data: takeoff, error: takeoffError } = await supabase
    .from('takeoffs_l')
    .select('*')
    .eq('id', takeoffId)
    .single();

  console.log('getTakeoffPdfData: Supabase query result - error:', takeoffError);
  console.log('getTakeoffPdfData: Supabase query result - data exists:', !!takeoff);
  console.log('getTakeoffPdfData: takeoff data:', takeoff);

  if (takeoffError || !takeoff) {
    console.log('getTakeoffPdfData: Throwing error - takeoffError:', takeoffError, 'takeoff:', takeoff);
    throw new Error('Takeoff not found');
  }

  // Fetch related job explicitly to avoid relation-name mismatches
  const { data: job } = await supabase
    .from('jobs_l')
    .select('id, project_name, customer_name, customer_job_number, customer_pm, project_owner, contract_number, county, etc_branch, etc_project_manager, etc_job_number')
    .eq('id', takeoff.job_id)
    .single();

  const items: any[] = [];

  const workType = String(takeoff.work_type || '').toUpperCase();
  const signRowsData = (takeoff.sign_rows as Record<string, any[]>) || {};
  const activeSections = Array.isArray(takeoff.active_sections) && takeoff.active_sections.length > 0
    ? takeoff.active_sections
    : Object.keys(signRowsData);

  const permanentSignRows = (takeoff.permanent_sign_rows as Record<string, any[]>) || {};
  const permanentEntryRows = (takeoff.permanent_entry_rows as Record<string, any[]>) || {};
  const activePermanentItems = Array.isArray(takeoff.active_permanent_items) && takeoff.active_permanent_items.length > 0
    ? takeoff.active_permanent_items
    : Array.from(new Set([...Object.keys(permanentSignRows), ...Object.keys(permanentEntryRows)]));

  const pushMptLikeRows = () => {
    for (const sectionKey of activeSections) {
      const rows = signRowsData[sectionKey] || [];
      const categoryLabel = MPT_SECTION_LABELS[sectionKey] || sectionKey;

      for (const row of rows) {
        if (!isConfiguredRow(row)) continue;
        items.push({
          product_name: row.signDesignation || row.signDescription || 'Sign',
          category: categoryLabel,
          unit: 'EA',
          quantity: Number(row.quantity || 0),
          notes: JSON.stringify({
            ...row,
            itemType: 'mpt_sign',
            sectionKey,
          }),
          material: row.material || takeoff.default_sign_material || '',
        });
      }
    }
  };

  const pushPermanentRows = () => {
    for (const itemNumber of activePermanentItems) {
      const signRows = permanentSignRows[itemNumber] || [];
      const entryRows = permanentEntryRows[itemNumber] || [];

      for (const row of signRows) {
        if (!isConfiguredRow(row)) continue;
        items.push({
          product_name: row.signDesignation || row.signDescription || itemNumber || 'Permanent Sign',
          category: itemNumber,
          unit: 'EA',
          quantity: Number(row.quantity || 0),
          notes: JSON.stringify({
            ...row,
            itemType: 'permanent_sign',
            itemNumber,
          }),
          material: row.material || takeoff.default_permanent_sign_material || '',
        });
      }

      for (const row of entryRows) {
        if (!hasValue(row?.description) && Number(row?.quantity || 0) <= 0) continue;
        items.push({
          product_name: itemNumber || 'Permanent Sign Item',
          category: itemNumber,
          unit: 'EA',
          quantity: Number(row.quantity || 0),
          notes: JSON.stringify({
            ...row,
            itemType: 'permanent_entry',
            itemNumber,
          }),
          material: '',
        });
      }
    }
  };

  const vehicleItems = Array.isArray(takeoff.vehicle_items) ? takeoff.vehicle_items : [];
  for (const item of vehicleItems) {
    items.push({
      product_name: formatVehicleType(item?.vehicleType),
      category: 'Vehicles',
      unit: 'EA',
      quantity: Number(item?.quantity || 0),
      notes: JSON.stringify({
        ...item,
        itemType: 'vehicle',
      }),
      material: '',
    });
  }

  const rollingStockItems = Array.isArray(takeoff.rolling_stock_items) ? takeoff.rolling_stock_items : [];
  for (const item of rollingStockItems) {
    items.push({
      product_name: item?.equipmentLabel || item?.equipmentId || 'Rolling Stock',
      category: 'Rolling Stock',
      unit: 'EA',
      quantity: 1,
      notes: JSON.stringify({
        ...item,
        itemType: 'rolling_stock',
      }),
      material: '',
    });
  }

  const additionalItems = Array.isArray(takeoff.additional_items) ? takeoff.additional_items : [];
  for (const item of additionalItems) {
    items.push({
      product_name: getAdditionalItemName(item),
      category: 'Additional Items',
      unit: 'EA',
      quantity: Number(item?.quantity || 0),
      notes: JSON.stringify({
        ...item,
        itemType: 'additional',
        description: item?.description || '',
      }),
      material: '',
    });
  }

  if (workType === 'PERMANENT_SIGNS') {
    pushPermanentRows();
  } else if (['MPT', 'FLAGGING', 'LANE_CLOSURE', 'SERVICE', 'DELIVERY'].includes(workType)) {
    pushMptLikeRows();
  }

  if (items.length === 0) {
    // Fallback for legacy records stored only in the relational items table
    const { data: takeoffItems } = await supabase
      .from('takeoff_items_l')
      .select(`
        product_name,
        category,
        unit,
        quantity,
        notes,
        material,
        sign_details,
        sign_description,
        sheeting,
        width_inches,
        height_inches,
        sqft,
        total_sqft,
        load_order,
        cover
      `)
      .eq('takeoff_id', takeoffId)
      .order('load_order', { ascending: true });

    for (const item of takeoffItems || []) {
      const details = (item.sign_details && typeof item.sign_details === 'object') ? item.sign_details : {};
      const isAdditionalItem =
        String(item.category || '').toLowerCase().includes('additional') ||
        details?.itemType === 'additional';
      const fallbackAdditionalName = isAdditionalItem
        ? getAdditionalItemName({
            name: item.product_name,
            description: details?.description || item.notes || item.sign_description,
          })
        : item.product_name || '';

      items.push({
        product_name: fallbackAdditionalName,
        category: item.category || '',
        unit: item.unit || 'EA',
        quantity: item.quantity || 0,
        notes: JSON.stringify({
          ...details,
          signDescription: details?.signDescription || item.sign_description || '',
          sheeting: details?.sheeting || item.sheeting || '',
          width: details?.width || item.width_inches || 0,
          height: details?.height || item.height_inches || 0,
          dimensionLabel: details?.dimensionLabel || '',
          sqft: details?.sqft ?? item.sqft ?? 0,
          totalSqft: details?.totalSqft ?? item.total_sqft ?? 0,
          loadOrder: details?.loadOrder ?? item.load_order ?? 0,
          cover: details?.cover ?? item.cover ?? false,
        }),
        material: item.material || '',
      });
    }
  }

  return {
    title: takeoff.title || '',
    workType: takeoff.work_type || '',
    status: takeoff.status || '',
    installDate: takeoff.install_date || null,
    pickupDate: takeoff.pickup_date || null,
    neededByDate: takeoff.needed_by_date || null,
    notes: takeoff.notes || null,
    workOrderNumber: takeoff.work_order_number || null,
    contractedOrAdditional: takeoff.contracted_or_additional || 'contracted',
    projectName: job?.project_name || '',
    etcJobNumber: job?.etc_job_number?.toString() || '',
    customerName: job?.customer_name || '',
    customerJobNumber: job?.customer_job_number || '',
    customerPM: job?.customer_pm || '',
    projectOwner: job?.project_owner || '',
    contractNumber: job?.contract_number || '',
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
    .from('work_orders_l')
    .select(`
      *,
      jobs_l!work_orders_l_job_id_fkey (
        id,
        project_name,
        customer_name,
        customer_job_number,
        customer_pm,
        project_owner,
        contract_number,
        county,
        etc_branch,
        etc_project_manager,
        etc_job_number
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
    .from('work_order_items_l')
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
    woNumber: workOrder.wo_number || workOrder.work_order_number || '',
    woTitle: workOrder.title || '',
    woDescription: workOrder.description || '',
    woNotes: workOrder.notes || '',
    etcAssignedTo: workOrder.assigned_to || workOrder.etc_assigned_to || '',
    contractedOrAdditional: workOrder.contracted_or_additional || 'contracted',
    customerPocPhone: workOrder.customer_poc_phone || '',
    projectName: job?.project_name || '',
    etcJobNumber: job?.etc_job_number?.toString() || '',
    customerName: job?.customer_name || '',
    customerJobNumber: job?.customer_job_number || '',
    customerPM: job?.customer_pm || '',
    projectOwner: job?.project_owner || '',
    contractNumber: job?.contract_number || '',
    county: job?.county || '',
    etcBranch: job?.etc_branch || '',
    etcProjectManager: job?.etc_project_manager || '',
    primaryTakeoffId: workOrder.takeoff_id || '',
    installDate: workOrder.install_date || '',
    pickupDate: workOrder.pickup_date || '',
    items,
    crewNotes: workOrder.crew_notes || '',
    customerNotOnSite: workOrder.customer_not_on_site || false,
    customerSignatureName: workOrder.customer_signature_name || '',
    signedAt: workOrder.signed_at || ''
  };
}
