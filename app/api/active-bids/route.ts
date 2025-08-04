import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MPTRentalEstimating } from '@/types/MPTEquipment';
import { AdminData } from '@/types/TAdminData';
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject';
import { calculateFlaggingCostSummary, calculateLaborCostSummary, calculateRentalSummary, getAllTotals, getEquipmentTotalsPerPhase, returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions';
import { Flagging } from '@/types/TFlagging';
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem';
import { SaleItem } from '@/types/TSaleItem';
import { EstimateCompleteView, EstimateGridView } from '@/types/estimate-view';
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject';
import { determineItemType, PermanentSigns } from '@/types/TPermanentSigns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';
    const division = searchParams.get('division');
    const counts = searchParams.get('counts');
    const detailed = searchParams.get('detailed') === 'true';
    const filters = searchParams.get('filters');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    
    // NEW: Handle archived parameter
    const archived = searchParams.get('archived');
    const isArchivedFilter = archived === 'true';
    const excludeArchived = archived === 'false';
    
    // Parse filters if they exist
    let parsedFilters: Record<string, string[]> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (error) {
        console.error('Error parsing filters:', error);
      }
    }

    // Helper function to get job data and determine won-pending status
    const getJobsDataForBids = async (bidIds: number[]) => {
      if (bidIds.length === 0) return [];
      
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          estimate_id,
          job_numbers!jobs_job_number_id_fkey(job_number)
        `)
        .in('estimate_id', bidIds)
        
      if (jobsError || !jobs) return [];
      return jobs;
    };

    // Helper function to determine actual status including won-pending
    const getActualStatus = (bid: any, jobsData: any[]) => {
      if (bid.status === 'WON') {
        const hasWonPendingJob = jobsData.some(job => 
          job.estimate_id === bid.id && 
          job.job_numbers?.job_number?.startsWith('P-')
        );
        return hasWonPendingJob ? 'won-pending' : 'won';
      }
      return bid.status?.toLowerCase();
    };
    
    if (counts) {
      try {
        // Get all bids
        const { data: allBids, error: allBidsError } = await supabase
          .from('estimate_complete')
          .select('id, status, archived, admin_data')
          .eq('deleted', false);
        
        if (allBidsError || !allBids) {
          return NextResponse.json(
            { error: 'Failed to fetch bid counts', details: allBidsError },
            { status: 500 }
          );
        }

        // Get job data for won bids
        const wonBidIds = allBids.filter(bid => bid.status === 'WON').map(bid => bid.id);
        const jobsData = await getJobsDataForBids(wonBidIds);
        
        // FIXED: Only count non-archived items for main counts
        const nonArchivedBids = allBids.filter(bid => bid.archived !== true);
        
        const countData = {
          all: nonArchivedBids.length,
          won: nonArchivedBids.filter(bid => bid.status === 'WON' && getActualStatus(bid, jobsData) === 'won').length,
          'won-pending': nonArchivedBids.filter(bid => bid.status === 'WON' && getActualStatus(bid, jobsData) === 'won-pending').length,
          pending: nonArchivedBids.filter(bid => bid.status === 'PENDING').length,
          lost: nonArchivedBids.filter(bid => bid.status === 'LOST').length,
          draft: nonArchivedBids.filter(bid => bid.status === 'DRAFT').length,
          archived: allBids.filter(bid => bid.archived === true).length
        };
        
        return NextResponse.json(countData);
      } catch (error) {
        console.error('Error fetching bid counts:', error);
        return NextResponse.json(
          { error: 'Unexpected error fetching bid counts' },
          { status: 500 }
        );
      }
    }

    // Calculate stats for all non-archived, non-deleted bids
    const { data: allBidsForStats, error: allBidsError } = await supabase
      .from('estimate_complete')
      .select('id, status, archived, admin_data')
      .eq('deleted', false)
      .or('archived.is.null,archived.eq.false'); // Exclude archived bids

    if (allBidsError || !allBidsForStats) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bids for stats', error: allBidsError?.message },
        { status: 500 }
      );
    }

    // Get job data for won bids to determine won-pending status
    const wonBidIdsForStats = allBidsForStats.filter(bid => bid.status === 'WON').map(bid => bid.id);
    const jobsDataForStats = await getJobsDataForBids(wonBidIdsForStats);

    // Calculate actual counts for stats
    const pendingCount = allBidsForStats.filter(bid => bid.status === 'PENDING').length;
    const wonCount = allBidsForStats.filter(bid => bid.status === 'WON' && getActualStatus(bid, jobsDataForStats) === 'won').length;
    const wonPendingCount = allBidsForStats.filter(bid => bid.status === 'WON' && getActualStatus(bid, jobsDataForStats) === 'won-pending').length;
    const draftCount = allBidsForStats.filter(bid => bid.status === 'DRAFT').length;
    const lostCount = allBidsForStats.filter(bid => bid.status === 'LOST').length;

    // Calculate win-loss ratio: (won + won-pending) / (all bids excluding drafts) * 100
    const totalNonDraftBids = allBidsForStats.length - draftCount;
    const totalWonBids = wonCount + wonPendingCount;
    const winLossRatio = totalNonDraftBids > 0 ? (totalWonBids / totalNonDraftBids) * 100 : 0;

    const stats = {
      winLossRatio: parseFloat(winLossRatio.toFixed(2)),
      draft: draftCount,
      pending: pendingCount,
      wonPending: wonPendingCount
    };

    // First, build a query to get all bids that match our filters (for counting)
    let countQuery = supabase
      .from('estimate_complete')
      .select('id, status, archived, deleted, admin_data', { count: 'exact', head: false })
      .eq('deleted', false)

    // FIXED: Apply archived filtering first
    if (isArchivedFilter) {
      countQuery = countQuery.eq('archived', true);
    } else if (excludeArchived) {
      countQuery = countQuery.or('archived.is.null,archived.eq.false');
    }

    // Apply the same basic filters we'll use for the main query
    if (status) {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'WON' || upperStatus === 'WON-PENDING') {
        countQuery = countQuery.eq('status', 'WON');
      } else if (upperStatus === 'PENDING' || upperStatus === 'LOST' || upperStatus === 'DRAFT') {
        countQuery = countQuery.eq('status', upperStatus);
      }
      // REMOVED: else if (upperStatus === 'ARCHIVED') - this is now handled by archived parameter
    }

    if (division && division !== 'all') {
      const statusValues = ['PENDING', 'WON', 'LOST', 'DRAFT', 'WON-PENDING'];
      if (statusValues.includes(division.toUpperCase())) {
        if (division.toUpperCase() === 'WON' || division.toUpperCase() === 'WON-PENDING') {
          countQuery = countQuery.eq('status', 'WON');
        } else {
          countQuery = countQuery.eq('status', division.toUpperCase());
        }
      } else {
        countQuery = countQuery.eq('admin_data->>division', division);
      }
    }

    // Apply additional filters
    if (Object.keys(parsedFilters).length > 0) {
      for (const [field, values] of Object.entries(parsedFilters)) {
        if (values && values.length > 0) {
          switch (field) {
            case 'county':
              countQuery = countQuery.in('admin_data->county->>name', values);
              break;
            case 'owner':
              countQuery = countQuery.in('admin_data->>owner', values);
              break;
            case 'requestor':
            case 'estimator':
              // Get the estimator name from the users table
              const { data: estimatorData, error: estimatorError } = await supabase
                .from('users')
                .select('name')
                .in('id', parsedFilters[field]);
              
              if (estimatorError) throw estimatorError;
              
              if (estimatorData && estimatorData.length > 0) {
                const estimatorNames = estimatorData.map(e => e.name);
                countQuery = countQuery.in('admin_data->>estimator', estimatorNames);
              }
              break;
            case 'branch':
              countQuery = countQuery.in('admin_data->county->>branch', values);
              break;
            case 'status':
              countQuery = countQuery.in('status', values.map(v => v.toUpperCase()));
              break;
          }
        }
      }
    }

    // Get the filtered count data first
    const { data: filteredBids, count: totalFilteredCount, error: countError } = await countQuery;
    
    if (countError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bid count', error: countError.message },
        { status: 500 }
      );
    }

    // Now we need to handle won-pending filtering for the count
    let actualTotalCount = totalFilteredCount || 0;
    
    if (status && (status.toLowerCase() === 'won' || status.toLowerCase() === 'won-pending')) {
      // We need to get job data to determine actual won vs won-pending count
      const wonBidIds = (filteredBids || []).filter(bid => bid.status === 'WON').map(bid => bid.id);
      const jobsData = await getJobsDataForBids(wonBidIds);
      
      if (status.toLowerCase() === 'won') {
        actualTotalCount = (filteredBids || []).filter(bid => 
          bid.status === 'WON' && getActualStatus(bid, jobsData) === 'won'
        ).length;
      } else if (status.toLowerCase() === 'won-pending') {
        actualTotalCount = (filteredBids || []).filter(bid => 
          bid.status === 'WON' && getActualStatus(bid, jobsData) === 'won-pending'
        ).length;
      }
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build main query for the actual data we'll return
    let query = supabase
      .from('estimate_complete')
      .select(detailed ? '*' : `
        id, status, total_revenue, total_cost, total_gross_profit, created_at, archived, deleted,
        admin_data->>contractNumber as contract_number,
        admin_data->>estimator as estimator,
        admin_data->>division as division,
        admin_data->>owner as owner,
        admin_data->county->>name as county,
        admin_data->county->>branch as branch,
        admin_data->>lettingDate as letting_date,
        project_manager, contractor_name, subcontractor_name,
        total_phases, total_days, total_hours,
        mpt_rental->_summary->>revenue as mpt_revenue,
        mpt_rental->_summary->>grossProfit as mpt_gross_profit
      `)
      .eq('deleted', false);

    // FIXED: Apply archived filtering to main query
    if (isArchivedFilter) {
      query = query.eq('archived', true);
    } else if (excludeArchived) {
      query = query.or('archived.is.null,archived.eq.false');
    }

    // Apply sorting
    if (sortBy) {
      const ascending = sortOrder === 'asc';
      switch (sortBy) {
        case 'contractNumber':
          query = query.order('admin_data->>contractNumber', { ascending });
          break;
        case 'status':
          query = query.order('status', { ascending });
          break;
        case 'owner':
          query = query.order('admin_data->>owner', { ascending });
          break;
        case 'county':
          query = query.order('admin_data->county->>name', { ascending });
          break;
        case 'branch':
          query = query.order('admin_data->county->>branch', { ascending });
          break;
        case 'estimator':
          query = query.order('admin_data->>estimator', { ascending });
          break;
        case 'lettingDate':
          query = query.order('admin_data->>lettingDate', { ascending });
          break;
        case 'contractor':
          query = query.order('contractor_name', { ascending });
          break;
        case 'subcontractor':
          query = query.order('subcontractor_name', { ascending });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply the same basic status filters
    if (status) {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'WON' || upperStatus === 'WON-PENDING') {
        query = query.eq('status', 'WON');
      } else if (upperStatus === 'PENDING' || upperStatus === 'LOST' || upperStatus === 'DRAFT') {
        query = query.eq('status', upperStatus);
      }
      // REMOVED: else if (upperStatus === 'ARCHIVED') - handled by archived parameter
    }

    if (division && division !== 'all') {
      const statusValues = ['PENDING', 'WON', 'LOST', 'DRAFT', 'WON-PENDING'];
      if (statusValues.includes(division.toUpperCase())) {
        if (division.toUpperCase() === 'WON' || division.toUpperCase() === 'WON-PENDING') {
          query = query.eq('status', 'WON');
        } else {
          query = query.eq('status', division.toUpperCase());
        }
      } else {
        query = query.eq('admin_data->>division', division);
      }
    }

    // Apply additional filters
    if (Object.keys(parsedFilters).length > 0) {
      for (const [field, values] of Object.entries(parsedFilters)) {
        if (values && values.length > 0) {
          switch (field) {
            case 'county':
              query = query.in('admin_data->county->>name', values);
              break;
            case 'owner':
              query = query.in('admin_data->>owner', values);
              break;
            case 'requestor':
            case 'estimator':
              // Get the estimator name from the users table
              const { data: estimatorData, error: estimatorError } = await supabase
                .from('users')
                .select('name')
                .in('id', parsedFilters[field]);
              
              if (estimatorError) throw estimatorError;
              
              if (estimatorData && estimatorData.length > 0) {
                const estimatorNames = estimatorData.map(e => e.name);
                query = query.in('admin_data->>estimator', estimatorNames);
              }
              break;
            case 'branch':
              query = query.in('admin_data->county->>branch', values);
              break;
            case 'status':
              query = query.in('status', values.map(v => v.toUpperCase()));
              break;
          }
        }
      }
    }

    // For won/won-pending filtering, we need to fetch more records than we need
    // because we'll filter them after determining the actual status
    let fetchLimit = limit;
    let fetchOffset = offset;
    
    if (status && (status.toLowerCase() === 'won' || status.toLowerCase() === 'won-pending')) {
      // Fetch more records to account for filtering
      fetchLimit = Math.min(limit * 3, 1000); // Fetch up to 3x the needed amount, max 1000
      fetchOffset = Math.max(0, offset - limit); // Start a bit earlier
    }

    const { data, error } = await query.range(fetchOffset, fetchOffset + fetchLimit - 1);
    
    if (error || !data) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch active bids', error: error?.message },
        { status: 500 }
      );
    }

    // Get job data for won bids to determine won-pending status
    const wonBidIds = data.filter(bid => (bid as any).status === 'WON').map(bid => (bid as any).id);
    const jobsData = await getJobsDataForBids(wonBidIds);

    // Transform data
    let transformedData = data.map((bid: any) => {
      const actualStatus = getActualStatus(bid, jobsData);
      if (detailed) {
        return {
          ...bid,
          contractNumber: (actualStatus === 'draft' && !bid.admin_data.contractNumber.endsWith('-DRAFT')) ? bid.admin_data.contractNumber + '-DRAFT' : bid.admin_data.contractNumber,
          status: actualStatus,
        };
      } else {
        return {
          id: bid.id,
          status: actualStatus,
          total_revenue: bid.total_revenue,
          total_cost: bid.total_cost,
          total_gross_profit: bid.total_gross_profit,
          created_at: bid.created_at,
          archived: bid.archived, // FIXED: Include archived field
          contract_number: (actualStatus === 'draft' && !bid.admin_data?.contractNumber?.endsWith('-DRAFT')) ? bid.contract_number + '-DRAFT' : bid.contract_number,
          estimator: bid.estimator,
          division: bid.division,
          owner: bid.owner,
          county: bid.county,
          branch: bid.branch,
          letting_date: bid.letting_date,
          project_manager: bid.project_manager,
          contractor: bid.contractor_name,
          subcontractor: bid.subcontractor_name,
          phases: bid.total_phases,
          project_days: bid.total_days,
          total_hours: bid.total_hours,
          mpt_value: parseFloat(bid.mpt_revenue || '0'),
          mpt_gross_profit: parseFloat(bid.mpt_gross_profit || '0'),
          mpt_gm_percent: bid.mpt_revenue > 0 
            ? ((parseFloat(bid.mpt_gross_profit) / parseFloat(bid.mpt_revenue)) * 100).toFixed(2) 
            : 0
        };
      }
    });

    // Apply final status filtering after determining actual status
    if (status) {
      const targetStatus = status.toLowerCase();
      transformedData = transformedData.filter(bid => bid.status === targetStatus);
    }
    if (division && ['won', 'won-pending'].includes(division.toLowerCase())) {
      const targetStatus = division.toLowerCase();
      transformedData = transformedData.filter(bid => bid.status === targetStatus);
    }

    // Apply proper pagination to the filtered results
    const startIndex = status && (status.toLowerCase() === 'won' || status.toLowerCase() === 'won-pending') 
      ? Math.max(0, offset - fetchOffset) 
      : 0;
    const endIndex = startIndex + limit;
    const paginatedData = transformedData.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true, 
      data: paginatedData,
      pagination: {
        page,
        pageSize: limit,
        pageCount: Math.ceil(actualTotalCount / limit),
        totalCount: actualTotalCount
      },
      stats
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, status, permanentSigns, notes } = body.data as {
      id: number | undefined
      adminData: AdminData;
      mptRental: MPTRentalEstimating;
      equipmentRental: EquipmentRentalItem[];
      flagging: Flagging;
      serviceWork: Flagging;
      saleItems: SaleItem[];
      permanentSigns: PermanentSigns;
      status: 'PENDING' | 'DRAFT';
notes: { text: string, timestamp: number }[]
    };

    // Calculate totals
    const allTotals = getAllTotals(
      adminData, 
      mptRental, 
      equipmentRental || [], 
      flagging || defaultFlaggingObject, 
      serviceWork || defaultFlaggingObject, 
      saleItems || [],
      permanentSigns || defaultPermanentSignsObject
    );

    let bidEstimateId: string;

    if (!!id) {
      bidEstimateId = id.toString();
      // Update existing bid
      const { data: updatedBid, error: updateError } = await supabase
        .from('bid_estimates')
        .update({
          status: status,
          total_revenue: allTotals.totalRevenue,
          total_cost: allTotals.totalCost,
          total_gross_profit: allTotals.totalGrossProfit,
        })
        .eq('id', id)
        .select('id')
        .single();

      if (updateError) {
        throw new Error(`Failed to update bid estimate: ${updateError.message}`);
      }
    } else {
      // Create new bid
      const { data: newBid, error: bidError } = await supabase
        .from('bid_estimates')
        .insert({
          contract_number: adminData.contractNumber, // Add this to track unique bids
          notes: notes,
          status: status,
          total_revenue: allTotals.totalRevenue,
          total_cost: allTotals.totalCost,
          total_gross_profit: allTotals.totalGrossProfit,
        })
        .select('id')
        .single();

      if (bidError) {
        throw new Error(`Failed to create bid estimate: ${bidError.message}`);
      }
      
      bidEstimateId = newBid.id;
    }

    if (notes && notes.length > 0) {
      if (id) {
        await supabase
          .from('bid_notes')
          .delete()
          .eq('bid_id', bidEstimateId);
      }

      const noteInserts = notes.map(note => {
        const isoTimestamp = new Date(note.timestamp).toISOString();

        return {
          bid_id: bidEstimateId,  
          text: note.text,
          created_at: isoTimestamp
        }
      });

      const { error: notesError } = await supabase
        .from('bid_notes')
        .insert(noteInserts);

      if (notesError) {
        throw new Error(`Failed to insert bid notes: ${notesError.message}`);
      }
    }
    
    // Upsert admin data
    const { error: adminError } = await supabase
      .from('admin_data_entries')
      .upsert({
        bid_estimate_id: bidEstimateId,
        contract_number: adminData.contractNumber,
        estimator: adminData.estimator,
        division: adminData.division,
        bid_date: adminData.lettingDate ? new Date(adminData.lettingDate).toISOString() : null,
        owner: adminData.owner,
        county: adminData.county,
        sr_route: adminData.srRoute,
        location: adminData.location,
        dbe: adminData.dbe,
        start_date: adminData.startDate ? new Date(adminData.startDate).toISOString() : null,
        end_date: adminData.endDate ? new Date(adminData.endDate).toISOString() : null,
        winter_start: adminData.winterStart ? new Date(adminData.winterStart).toISOString() : null,
        winter_end: adminData.winterEnd ? new Date(adminData.winterEnd).toISOString() : null,
        ow_travel_time_mins: adminData.owTravelTimeMins,
        ow_mileage: adminData.owMileage,
        fuel_cost_per_gallon: adminData.fuelCostPerGallon,
        emergency_job: adminData.emergencyJob,
        rated: adminData.rated,
        emergency_fields: adminData.emergencyFields
      }, {
        onConflict: 'bid_estimate_id' // Specify unique constraint
      });

    if (adminError) {
      throw new Error(`Failed to upsert admin data: ${adminError.message}`);
    }

    // Upsert MPT rental data
    const { data: mptRentalEntry, error: mptError } = await supabase
      .from('mpt_rental_entries')
      .upsert({
        bid_estimate_id: bidEstimateId,
        target_moic: mptRental.targetMOIC,
        payback_period: mptRental.paybackPeriod,
        annual_utilization: mptRental.annualUtilization,
        dispatch_fee: mptRental.dispatchFee,
        mpg_per_truck: mptRental.mpgPerTruck,
        revenue: allTotals.mptTotalRevenue,
        cost: allTotals.mptTotalCost,
        gross_profit: allTotals.mptGrossProfit,
        hours: calculateLaborCostSummary(adminData, mptRental).ratedLaborHours + calculateLaborCostSummary(adminData, mptRental).nonRatedLaborHours
      }, {
        onConflict: 'bid_estimate_id'
      })
      .select('id')
      .single();

    if (mptError) {
      throw new Error(`Failed to upsert MPT rental: ${mptError.message}`);
    }

    // Delete existing static equipment info before inserting new ones
    await supabase
      .from('mpt_static_equipment_info')
      .delete()
      .eq('mpt_rental_entry_id', mptRentalEntry.id);

    // Insert static equipment info
    const staticEquipmentInserts = Object.entries(mptRental.staticEquipmentInfo).map(([type, info]) => ({
      mpt_rental_entry_id: mptRentalEntry.id,
      equipment_type: type,
      price: info.price,
      discount_rate: info.discountRate,
      useful_life: info.usefulLife,
      payback_period: info.paybackPeriod
    }));

    const { error: staticEquipError } = await supabase
      .from('mpt_static_equipment_info')
      .insert(staticEquipmentInserts);

    if (staticEquipError) {
      throw new Error(`Failed to create static equipment: ${staticEquipError.message}`);
    }

    // Delete existing phases and related data before inserting new ones
    await supabase
      .from('mpt_phases')
      .delete()
      .eq('mpt_rental_entry_id', mptRentalEntry.id);

    // Insert phases
    for (let i = 0; i < mptRental.phases.length; i++) {
      const phase = mptRental.phases[i];
      
      const { data: phaseEntry, error: phaseError } = await supabase
        .from('mpt_phases')
        .insert({
          mpt_rental_entry_id: mptRentalEntry.id,
          phase_index: i,
          name: phase.name,
          start_date: phase.startDate ? new Date(phase.startDate).toISOString() : null,
          end_date: phase.endDate ? new Date(phase.endDate).toISOString() : null,
          personnel: phase.personnel,
          days: phase.days,
          number_trucks: phase.numberTrucks,
          additional_rated_hours: phase.additionalRatedHours,
          additional_non_rated_hours: phase.additionalNonRatedHours,
          maintenance_trips: phase.maintenanceTrips,
          // Standard equipment quantities
          hivp_quantity: phase.standardEquipment.HIVP?.quantity || 0,
          post_quantity: phase.standardEquipment.post?.quantity || 0,
          covers_quantity: phase.standardEquipment.covers?.quantity || 0,
          h_stand_quantity: phase.standardEquipment.hStand?.quantity || 0,
          sharps_quantity: phase.standardEquipment.sharps?.quantity || 0,
          b_lights_quantity: phase.standardEquipment.BLights?.quantity || 0,
          sandbag_quantity: phase.standardEquipment.sandbag?.quantity || 0,
          ac_lights_quantity: phase.standardEquipment.ACLights?.quantity || 0,
          type_xivp_quantity: phase.standardEquipment.TypeXIVP?.quantity || 0,
          metal_stands_quantity: phase.standardEquipment.metalStands?.quantity || 0,
          six_foot_wings_quantity: phase.standardEquipment.sixFootWings?.quantity || 0,
          four_foot_type_iii_quantity: phase.standardEquipment.fourFootTypeIII?.quantity || 0,
          // Custom equipment
          custom_light_and_drum_items: phase.customLightAndDrumItems
        })
        .select('id')
        .single();

      if (phaseError) {
        throw new Error(`Failed to create phase ${i}: ${phaseError.message}`);
      }
      // Insert signs for this phase
      const signInserts = phase.signs.map(sign => {
        if ('primarySignId' in sign) {
          // Secondary sign
          return {
            phase_id: phaseEntry.id,
            sign_id: sign.id,
            primary_sign_id: sign.primarySignId,
            width: sign.width,
            height: sign.height,
            sheeting: sign.sheeting,
            is_custom: sign.isCustom,
            designation: sign.designation,
            description: sign.description,
            substrate: sign.substrate
          };
        } else {
          // Primary sign
          return {
            phase_id: phaseEntry.id,
            sign_id: sign.id,
            width: sign.width,
            height: sign.height,
            quantity: sign.quantity,
            sheeting: sign.sheeting,
            is_custom: sign.isCustom,
            designation: sign.designation,
            description: sign.description,
            associated_structure: sign.associatedStructure,
            display_structure: sign.displayStructure,
            substrate: sign.substrate,
            b_lights_color: sign.bLightsColor,
            stiffener: sign.stiffener,
            b_lights: sign.bLights,
            covers: sign.cover ? sign.quantity : 0
          };
        }
      });

      // Insert primary signs
      const primarySigns = signInserts.filter(sign => 'associated_structure' in sign);
      if (primarySigns.length > 0) {
        const { error: primarySignError } = await supabase
          .from('mpt_primary_signs')
          .insert(primarySigns);

        if (primarySignError) {
          throw new Error(`Failed to create primary signs: ${primarySignError.message}`);
        }
      }

      // Insert secondary signs
      const secondarySigns = signInserts.filter(sign => 'primary_sign_id' in sign);
      if (secondarySigns.length > 0) {
        const { error: secondarySignError } = await supabase
          .from('mpt_secondary_signs')
          .insert(secondarySigns);

        if (secondarySignError) {
          throw new Error(`Failed to create secondary signs: ${secondarySignError.message}`);
        }
      }
    }

    // Delete existing equipment rental items before inserting new ones
    await supabase
      .from('equipment_rental_entries')
      .delete()
      .eq('bid_estimate_id', bidEstimateId);

    // Insert equipment rental items
    if (equipmentRental && equipmentRental.length > 0) {

      const rentalSummary = calculateRentalSummary(equipmentRental)

      const rentalInserts = equipmentRental.map(item => (
        {
        bid_estimate_id: bidEstimateId,
        name: item.name,
        quantity: item.quantity,
        months: item.months,
        rent_price: item.rentPrice,
        re_rent_price: item.reRentPrice,
        re_rent_for_current_job: item.reRentForCurrentJob,
        total_cost: item.totalCost,
        useful_life_yrs: item.usefulLifeYrs,
        revenue: rentalSummary.items.find(rentalSummaryItem => rentalSummaryItem.name === item.name)?.totalRevenue,
        gross_profit: rentalSummary.items.find(rentalSummaryItem => rentalSummaryItem.name === item.name)?.grossProfit,
        gross_profit_margin: rentalSummary.items.find(rentalSummaryItem => rentalSummaryItem.name === item.name)?.grossProfitMargin,
        cost: rentalSummary.items.find(rentalSummaryItem => rentalSummaryItem.name === item.name)?.depreciation
      }));

      const { error: rentalError } = await supabase
        .from('equipment_rental_entries')
        .insert(rentalInserts);

      if (rentalError) {
        throw new Error(`Failed to create equipment rentals: ${rentalError.message}`);
      }
    }

    // Upsert flagging data
    if (flagging) {

      const flaggingSummary = calculateFlaggingCostSummary(adminData, flagging, false)

      const { error: flaggingError } = await supabase
        .from('flagging_entries')
        .upsert({
          bid_estimate_id: bidEstimateId,
          standard_pricing: flagging.standardPricing,
          standard_lump_sum: flagging.standardLumpSum,
          number_trucks: flagging.numberTrucks,
          fuel_economy_mpg: flagging.fuelEconomyMPG,
          personnel: flagging.personnel,
          on_site_job_hours: flagging.onSiteJobHours,
          additional_equipment_cost: flagging.additionalEquipmentCost,
          fuel_cost_per_gallon: flagging.fuelCostPerGallon,
          truck_dispatch_fee: flagging.truckDispatchFee,
          worker_comp: flagging.workerComp,
          general_liability: flagging.generalLiability,
          markup_rate: flagging.markupRate,
          arrow_boards_cost: flagging.arrowBoards.cost,
          arrow_boards_quantity: flagging.arrowBoards.quantity,
          arrow_boards_include_in_lump_sum: flagging.arrowBoards.includeInLumpSum,
          message_boards_cost: flagging.messageBoards.cost,
          message_boards_quantity: flagging.messageBoards.quantity,
          message_boards_include_in_lump_sum: flagging.messageBoards.includeInLumpSum,
          tma_cost: flagging.TMA.cost,
          tma_quantity: flagging.TMA.quantity,
          tma_include_in_lump_sum: flagging.TMA.includeInLumpSum,
          revenue: flaggingSummary.totalRevenue,
          cost: flaggingSummary.totalFlaggingCost,
          gross_profit: flaggingSummary.totalRevenue - flaggingSummary.totalFlaggingCost,
          hours: flaggingSummary.totalHours
        }, {
          onConflict: 'bid_estimate_id'
        });

      if (flaggingError) {
        throw new Error(`Failed to upsert flagging: ${flaggingError.message}`);
      }
    }

    // Upsert service work data
    if (serviceWork) {

      const serviceWorkSummary = calculateFlaggingCostSummary(adminData, serviceWork, true)

      const { error: serviceError } = await supabase
        .from('service_work_entries')
        .upsert({
          bid_estimate_id: bidEstimateId,
          standard_pricing: serviceWork.standardPricing,
          standard_lump_sum: serviceWork.standardLumpSum,
          number_trucks: serviceWork.numberTrucks,
          fuel_economy_mpg: serviceWork.fuelEconomyMPG,
          personnel: serviceWork.personnel,
          on_site_job_hours: serviceWork.onSiteJobHours,
          additional_equipment_cost: serviceWork.additionalEquipmentCost,
          fuel_cost_per_gallon: serviceWork.fuelCostPerGallon,
          truck_dispatch_fee: serviceWork.truckDispatchFee,
          worker_comp: serviceWork.workerComp,
          general_liability: serviceWork.generalLiability,
          markup_rate: serviceWork.markupRate,
          arrow_boards_cost: serviceWork.arrowBoards.cost,
          arrow_boards_quantity: serviceWork.arrowBoards.quantity,
          arrow_boards_include_in_lump_sum: serviceWork.arrowBoards.includeInLumpSum,
          message_boards_cost: serviceWork.messageBoards.cost,
          message_boards_quantity: serviceWork.messageBoards.quantity,
          message_boards_include_in_lump_sum: serviceWork.messageBoards.includeInLumpSum,
          tma_cost: serviceWork.TMA.cost,
          tma_quantity: serviceWork.TMA.quantity,
          tma_include_in_lump_sum: serviceWork.TMA.includeInLumpSum,
          revenue: serviceWorkSummary.totalRevenue,
          cost: serviceWorkSummary.totalFlaggingCost,
          gross_profit: serviceWorkSummary.totalRevenue - serviceWorkSummary.totalFlaggingCost,
          hours: serviceWorkSummary.totalHours
        }, {
          onConflict: 'bid_estimate_id'
        });

      if (serviceError) {
        throw new Error(`Failed to upsert service work: ${serviceError.message}`);
      }
    }

    // Delete existing sale items before inserting new ones
    await supabase
      .from('sale_items')
      .delete()
      .eq('bid_estimate_id', bidEstimateId);

    // Insert sale items
    if (saleItems && saleItems.length > 0) {
      const saleInserts = saleItems.map(item => ({
        bid_estimate_id: bidEstimateId,
        item_number: item.itemNumber,
        name: item.name,
        vendor: item.vendor,
        quantity: item.quantity,
        quote_price: item.quotePrice,
        markup_percentage: item.markupPercentage,
        status: 'pending'
      }));

      const { error: saleError } = await supabase
        .from('sale_items')
        .insert(saleInserts);

      if (saleError) {
        throw new Error(`Failed to create sale items: ${saleError.message}`);
      }
    }

    // Upsert permanent signs data
if (permanentSigns) {
  // Extract signItems and prepare info object
  const { signItems, ...permanentSignsInfo } = permanentSigns;
  // Upsert permanent_signs_entries
  const { data: permanentSignsEntry, error: permanentSignsError } = await supabase
    .from('permanent_signs_entries')
    .upsert({
      bid_estimate_id: bidEstimateId,
      permanent_signs_info: permanentSignsInfo
    }, {
      onConflict: 'bid_estimate_id'
    })
    .select('id')
    .single();

  if (permanentSignsError) {
    throw new Error(`Failed to upsert permanent signs entry: ${permanentSignsError.message}`);
  }

  // Delete existing permanent signs before inserting new ones
  await supabase
    .from('permanent_signs')
    .delete()
    .eq('permanent_signs_entry_id', permanentSignsEntry.id);

  // Insert permanent sign items
  if (signItems && signItems.length > 0) {
    const permanentSignInserts = signItems.map(item => {
      const itemType = determineItemType(item);
      
      return {
        permanent_signs_entry_id: permanentSignsEntry.id,
        item_type: itemType,
        item_number: item.itemNumber || null,
        personnel: item.personnel || 0,
        number_trucks: item.numberTrucks || 0,
        number_trips: item.numberTrips || 0,
        install_hours_required: item.installHoursRequired || 0,
        quantity: item.quantity || 0,
        perm_sign_bolts: item.permSignBolts || null,
        productivity_rate: (item as any).productivityRate || null,
        
        // PostMountedInstall fields (Type B/F/C)
        type: (item as any).type || null,
        sign_sq_footage: (item as any).signSqFootage || null,
        perm_sign_price_sq_ft: (item as any).permSignPriceSqFt || null,
        standard_pricing: item.standardPricing !== undefined ? item.standardPricing : true,
        custom_margin: item.customMargin || null,
        separate_mobilization: item.separateMobilization || false,
        perm_sign_cost_sq_ft: (item as any).permSignCostSqFt || null,
        hi_reflective_strips: (item as any).hiReflectiveStrips || null,
        fyg_reflective_strips: (item as any).fygReflectiveStrips || null,
        jenny_brackets: (item as any).jennyBrackets || null,
        stiffener_inches: (item as any).stiffenerInches || null,
        tmz_brackets: (item as any).tmzBrackets || null,
        anti_theft_bolts: (item as any).antiTheftBolts || null,
        chevron_brackets: (item as any).chevronBrackets || null,
        street_name_cross_brackets: (item as any).streetNameCrossBrackets || null,
        
        // PostMountedResetOrRemove fields
        is_remove: (item as any).isRemove || null,
        
        // InstallFlexibleDelineators fields
        flexible_delineator_cost: (item as any).flexibleDelineatorCost || null,
        
        // Additional items as JSON
        additional_items: (item as any).additionalItems || []
      };
    });

    const { error: permanentSignItemsError } = await supabase
      .from('permanent_signs')
      .insert(permanentSignInserts);

    if (permanentSignItemsError) {
      throw new Error(`Failed to create permanent sign items: ${permanentSignItemsError.message}`);
    }
  }
}

    return NextResponse.json({ 
      success: true, 
      data: { id: bidEstimateId, isUpdate: !!id } 
    });

  } catch (error) {
    console.error('Error upserting bid:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upsert active bid', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('bid_estimates')
      .delete()
      .in('id', body.ids)
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete active bids', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data, count: body.ids.length });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}