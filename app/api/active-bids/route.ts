import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MPTRentalEstimating } from '@/types/MPTEquipment';
import { AdminData } from '@/types/TAdminData';
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject';
import { calculateLaborCostSummary, getAllTotals, getEquipmentTotalsPerPhase, returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions';

// GET: Fetch all active bids with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000;
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';

    let query = supabase
      .from('bid_estimates')
      .select('*')
      .order(orderBy, { ascending });

    console.log('API received status filter:', status);

    if (status) {
      if (status === 'won-pending') {
        // Use case-insensitive matching for 'won-pending' status
        query = query.or('status.ilike.won-pending,status.ilike.Won-Pending,status.ilike.Won - Pending');
      } else if (status === 'won') {
        // Use case-insensitive matching for 'won' status
        query = query.or('status.ilike.won,status.ilike.Won');
      } else if (status === 'archived') {
        query = query
          .ilike('status', '%archived%')
          .is('deleted_at', null);
      } else if (status === 'won,won-pending') {
        // Special case for getting both won and won-pending with all case variations
        query = query.or('status.ilike.won,status.ilike.Won,status.ilike.won-pending,status.ilike.Won-Pending,status.ilike.Won - Pending');
      } else {
        // Try case-insensitive filtering using ilike for text fields
        // This is more reliable than exact matching with different case variations
        console.log('Using case-insensitive filter for status:', status);
        query = query.ilike('status', `%${status}%`);
      }
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch active bids', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

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
    const mptRental: MPTRentalEstimating = body.data.mptRental;
    const adminData: AdminData = body.data.adminData;
    const bidSummary = getAllTotals(adminData, mptRental, [], defaultFlaggingObject, defaultFlaggingObject, [])
    const hourlySummary = calculateLaborCostSummary(adminData, mptRental)
    const signSquareFootageTotals = returnSignTotalsSquareFootage(mptRental)

    const summary = {
      totalRatedHours: hourlySummary.ratedLaborHours,
      totalNonRatedHours: hourlySummary.nonRatedLaborHours,
      revenue: bidSummary.totalRevenue,
      cost: bidSummary.totalCost,
      profit: bidSummary.totalGrossProfit,
      margin: bidSummary.totalGrossMargin,
      mptRev: bidSummary.mptTotalRevenue,
      mptCost: bidSummary.mptTotalCost,
      mptProfit: bidSummary.mptGrossProfit,
      hiSqFt: signSquareFootageTotals.HI.totalSquareFootage,
      dgSqFt: signSquareFootageTotals.DG.totalSquareFootage,
      special: signSquareFootageTotals.Special.totalSquareFootage,
    }

    const equipmentTotals = getEquipmentTotalsPerPhase(mptRental);
    const projectDays = mptRental.phases.reduce((acc, phase) => acc + phase.days, 0);

    const bidEstimate = {
      status: body.status || 'ACTIVE',
      
      contract_number: adminData.contractNumber,
      letting_date: adminData.lettingDate ? new Date(adminData.lettingDate).toISOString() : null,
      contractor: body.contractor || null,
      subcontractor: body.subcontractor || null,
      owner: adminData.owner || '',
      county: adminData.county.name,
      branch: adminData.county.branch,
      division: adminData.division || '',
      
      // Estimator and dates
      estimator: adminData.estimator,
      start_date: adminData.startDate ? new Date(adminData.startDate).toISOString() : new Date().toISOString(),
      end_date: adminData.endDate ? new Date(adminData.endDate).toISOString() : new Date().toISOString(),
      
      // Project days from calculated value
      project_days: projectDays,
      
      // Rates from adminData
      base_rate: adminData.county.flaggingBaseRate,
      fringe_rate: adminData.county.flaggingFringeRate,
      
      // Travel information
      rt_miles: (adminData.owMileage || 0) * 2, // Round trip miles
      rt_travel: ((adminData.owTravelTimeMins || 0) / 60) * 2, // Round trip travel hours
      
      // Emergency job flag
      emergency_job: adminData.emergencyJob,
      
      // Hours information from labor summary
      rated_hours: hourlySummary.ratedLaborHours,
      nonrated_hours: hourlySummary.nonRatedLaborHours,
      total_hours: hourlySummary.ratedLaborHours + hourlySummary.nonRatedLaborHours,
      
      // Total hours from summary
      total_rated_hours: summary.totalRatedHours,
      total_nonrated_hours: summary.totalNonRatedHours,
      
      // Number of phases
      phases: mptRental.phases.length,
      
      // Equipment counts from equipment totals
      type_iii_4ft: equipmentTotals.fourFootTypeIII.totalQuantity,
      wings_6ft: equipmentTotals.sixFootWings.totalQuantity,
      h_stands: equipmentTotals.hStand.totalQuantity,
      posts: equipmentTotals.post.totalQuantity,
      sand_bags: equipmentTotals.sandbag.totalQuantity,
      covers: equipmentTotals.covers.totalQuantity,
      spring_loaded_metal_stands: equipmentTotals.metalStands.totalQuantity,
      hi_vertical_panels: equipmentTotals.HIVP.totalQuantity,
      type_xi_vertical_panels: equipmentTotals.TypeXIVP.totalQuantity,
      b_lites: equipmentTotals.BLights.totalQuantity,
      ac_lites: equipmentTotals.ACLights.totalQuantity,
      
      // Sign square footage from sign totals
      hi_signs_sq_ft: signSquareFootageTotals.HI.totalSquareFootage,
      dg_signs_sq_ft: signSquareFootageTotals.DG.totalSquareFootage,
      special_signs_sq_ft: signSquareFootageTotals.Special.totalSquareFootage,
      
      // Set rental equipment to 0 as requested
      tma: 0,
      arrow_board: 0,
      message_board: 0,
      speed_trailer: 0,
      pts: 0,
      
      // Financial data from bidSummary
      mpt_value: bidSummary.mptTotalRevenue,
      mpt_gross_profit: bidSummary.mptGrossProfit,
      mpt_gm_percent: bidSummary.mptGrossMargin,
      perm_sign_value: 0,
      perm_sign_gross_profit: 0,
      perm_sign_gm_percent: 0,
      rental_value: 0,
      rental_gross_profit: 0,
      rental_gm_percent: 0,
      
      // Serialize summary data as JSON string
      summary: JSON.stringify(summary)
    };

    // Handle date conversions
    if (typeof bidEstimate.start_date === 'string') {
      bidEstimate.start_date = new Date(bidEstimate.start_date).toISOString();
    }

    if (typeof bidEstimate.end_date === 'string') {
      bidEstimate.end_date = new Date(bidEstimate.end_date).toISOString();
    }

    if (typeof bidEstimate.letting_date === 'string' && bidEstimate.letting_date) {
      bidEstimate.letting_date = new Date(bidEstimate.letting_date).toISOString();
    }

    // Insert the bid estimate into the database
    const { data, error } = await supabase
      .from('bid_estimates')
      .insert(bidEstimate)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to create active bid', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
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