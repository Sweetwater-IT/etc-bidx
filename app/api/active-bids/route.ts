import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MPTRentalEstimating } from '@/types/MPTEquipment';
import { AdminData } from '@/types/TAdminData';
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject';
import { calculateLaborCostSummary, getAllTotals, getEquipmentTotalsPerPhase, returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions';
import { Flagging } from '@/types/TFlagging';
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem';
import { SaleItem } from '@/types/TSaleItem';

// GET: Fetch all active bids with optional filtering
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
    
    if (counts) {
      try {
        const { data: allBids, error: allBidsError } = await supabase
          .from('bid_estimates')
          .select('id, status, division');
        
        if (allBidsError) {
          return NextResponse.json(
            { error: 'Failed to fetch bid counts', details: allBidsError },
            { status: 500 }
          );
        }
        
        const countData = {
          all: allBids.length,
          won: allBids.filter(bid => bid.status?.toLowerCase().includes('won') && !bid.status?.toLowerCase().includes('pending')).length,
          pending: allBids.filter(bid => bid.status?.toLowerCase().includes('pending')).length,
          lost: allBids.filter(bid => bid.status?.toLowerCase().includes('lost')).length,
          draft: allBids.filter(bid => bid.status?.toLowerCase().includes('draft')).length,
          'won-pending': allBids.filter(bid => 
            bid.status?.toLowerCase().includes('won') && 
            bid.status?.toLowerCase().includes('pending')
          ).length,
          archived: allBids.filter(bid => bid.status?.toLowerCase().includes('archived')).length
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
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Base query for both count and data
    const baseQuery = supabase.from('bid_estimates');
    
    // Count query to get total records
    let countQuery = baseQuery.select('id', { count: 'exact', head: true });
    
    // Data query to get paginated results
    let dataQuery = baseQuery
      .select('*')
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    console.log('API received status filter:', status);
    console.log('API received division filter:', division);

    // Apply filters to both queries
    if (status) {
      if (status === 'won-pending') {
        // Use case-insensitive matching for 'won-pending' status
        const orCondition = 'status.ilike.won-pending,status.ilike.Won-Pending,status.ilike.Won - Pending';
        countQuery = countQuery.or(orCondition);
        dataQuery = dataQuery.or(orCondition);
      } else if (status === 'won') {
        // Use case-insensitive matching for 'won' status
        const orCondition = 'status.ilike.won,status.ilike.Won';
        countQuery = countQuery.or(orCondition);
        dataQuery = dataQuery.or(orCondition);
      } else if (status === 'archived') {
        countQuery = countQuery.ilike('status', '%archived%').is('deleted_at', null);
        dataQuery = dataQuery.ilike('status', '%archived%').is('deleted_at', null);
      } else if (status === 'won,won-pending') {
        // Special case for getting both won and won-pending with all case variations
        const orCondition = 'status.ilike.won,status.ilike.Won,status.ilike.won-pending,status.ilike.Won-Pending,status.ilike.Won - Pending';
        countQuery = countQuery.or(orCondition);
        dataQuery = dataQuery.or(orCondition);
      } else {
        // Try case-insensitive filtering using ilike for text fields
        console.log('Using case-insensitive filter for status:', status);
        countQuery = countQuery.ilike('status', `%${status}%`);
        dataQuery = dataQuery.ilike('status', `%${status}%`);
      }
    }

    // Apply division filter if provided
    if (division && division !== 'all') {
      const statusValues = ['pending', 'won', 'lost', 'draft', 'won-pending', 'archived'];
      
      if (statusValues.includes(division.toLowerCase())) {
        
        if (division.toLowerCase() === 'won-pending') {
          const orCondition = 'status.ilike.won-pending,status.ilike.Won-Pending,status.ilike.Won - Pending';
          countQuery = countQuery.or(orCondition);
          dataQuery = dataQuery.or(orCondition);
        } else {
          countQuery = countQuery.ilike('status', `%${division}%`);
          dataQuery = dataQuery.ilike('status', `%${division}%`);
        }
      } else {
        countQuery = countQuery.eq('division', division);
        dataQuery = dataQuery.eq('division', division);
      }
    }

    // Execute both queries in parallel
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
    ]);

    if (countResult.error || dataResult.error) {
      const error = countResult.error || dataResult.error;
      return NextResponse.json(
        { success: false, message: 'Failed to fetch active bids', error: error?.message },
        { status: 500 }
      );
    }

    const totalCount = countResult.count || 0;
    const pageCount = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true, 
      data: dataResult.data || [],
      pagination: {
        page,
        pageSize: limit,
        pageCount,
        totalCount
      }
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
    const { adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems } = body.data as {
      adminData: AdminData;
      mptRental: MPTRentalEstimating;
      equipmentRental: EquipmentRentalItem[];
      flagging: Flagging;
      serviceWork: Flagging;
      saleItems: SaleItem[];
    };

    // Calculate totals
    const allTotals = getAllTotals(
      adminData, 
      mptRental, 
      equipmentRental || [], 
      flagging || defaultFlaggingObject, 
      serviceWork || defaultFlaggingObject, 
      saleItems || []
    );

    // Begin transaction
    const { data: bidEstimate, error: bidError } = await supabase
      .from('bid_estimates')
      .insert({
        status: 'PENDING',
        total_revenue: allTotals.totalRevenue,
        total_cost: allTotals.totalCost,
        total_gross_profit: allTotals.totalGrossProfit,
      })
      .select('id')
      .single();

    if (bidError) {
      throw new Error(`Failed to create bid estimate: ${bidError.message}`);
    }

    const bidEstimateId = bidEstimate.id;

    // Insert admin data
    const { error: adminError } = await supabase
      .from('admin_data_entries')
      .insert({
        bid_estimate_id: bidEstimateId,
        contract_number: adminData.contractNumber,
        estimator: adminData.estimator,
        division: adminData.division,
        bid_date: adminData.lettingDate ? new Date(adminData.lettingDate).toISOString() : null,
        owner: adminData.owner,
        county: JSON.stringify({ 
          name: adminData.county.name, 
          branch: adminData.county.branch 
        }),
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
      });

    if (adminError) {
      throw new Error(`Failed to create admin data: ${adminError.message}`);
    }

    // Insert MPT rental data
    const { data: mptRentalEntry, error: mptError } = await supabase
      .from('mpt_rental_entries')
      .insert({
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
      })
      .select('id')
      .single();

    if (mptError) {
      throw new Error(`Failed to create MPT rental: ${mptError.message}`);
    }

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
            description: sign.description
          };
        } else {
          // Primary sign
          return {
            phase_id: phaseEntry.id,
            sign_id: sign.id,
            phase_index: i,
            width: sign.width,
            height: sign.height,
            quantity: sign.quantity,
            sheeting: sign.sheeting,
            is_custom: sign.isCustom,
            designation: sign.designation,
            description: sign.description,
            associated_structure: sign.associatedStructure,
            b_lights: sign.bLights,
            covers: sign.covers
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

    // Insert equipment rental items
    if (equipmentRental && equipmentRental.length > 0) {
      const rentalInserts = equipmentRental.map(item => ({
        bid_estimate_id: bidEstimateId,
        name: item.name,
        quantity: item.quantity,
        months: item.months,
        rent_price: item.rentPrice,
        re_rent_price: item.reRentPrice,
        re_rent_for_current_job: item.reRentForCurrentJob,
        total_cost: item.totalCost,
        useful_life_yrs: item.usefulLifeYrs,
        revenue: item.revenue,
        gross_profit: item.grossProfit,
        gross_profit_margin: item.grossProfitMargin,
        cost: item.cost
      }));

      const { error: rentalError } = await supabase
        .from('equipment_rental_entries')
        .insert(rentalInserts);

      if (rentalError) {
        throw new Error(`Failed to create equipment rentals: ${rentalError.message}`);
      }
    }

    // Insert flagging data
    if (flagging) {
      const { error: flaggingError } = await supabase
        .from('flagging_entries')
        .insert({
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
          revenue: flagging.revenue,
          cost: flagging.cost,
          gross_profit: flagging.grossProfit,
          hours: flagging.hours
        });

      if (flaggingError) {
        throw new Error(`Failed to create flagging: ${flaggingError.message}`);
      }
    }

    // Insert service work data
    if (serviceWork) {
      const { error: serviceError } = await supabase
        .from('service_work_entries')
        .insert({
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
          revenue: serviceWork.revenue,
          cost: serviceWork.cost,
          gross_profit: serviceWork.grossProfit,
          hours: serviceWork.hours
        });

      if (serviceError) {
        throw new Error(`Failed to create service work: ${serviceError.message}`);
      }
    }

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

    return NextResponse.json({ 
      success: true, 
      data: { id: bidEstimateId } 
    });

  } catch (error) {
    console.error('Error creating bid:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create active bid', 
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