// app/api/bulk-import/active-bids/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type BidEstimateInsert = Database['public']['Tables']['bid_estimates']['Insert'];
type AdminDataInsert = Database['public']['Tables']['admin_data_entries']['Insert'];
type MPTRentalInsert = Database['public']['Tables']['mpt_rental_entries']['Insert'];

export async function POST(request: Request) {
  try {
    const { jobs } = await request.json();
    
    console.log(`Processing active bids import with ${jobs?.length || 0} records`);
    
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { message: 'No valid active bids data provided' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const successfulImports: number[] = [];
    let newCount = 0;
    let updatedCount = 0;

    for (const [index, job] of jobs.entries()) {
      try {
        console.log(`Processing active bid row ${index + 1}`);
        
        // Parse the job data
        const parsedData = parseActiveBidData(job, index);
        
        // Check if bid already exists
        const { data: existingBid } = await supabase
          .from('bid_estimates')
          .select('id')
          .eq('contract_number', parsedData.contractNumber)
          .single();

        if (existingBid) {
          // Update existing bid
          await updateExistingBid(existingBid.id, parsedData);
          updatedCount++;
        } else {
          // Create new bid
          await createNewBid(parsedData);
          newCount++;
        }
        
        successfulImports.push(index + 1);
      } catch (error: any) {
        console.error(`Error processing row ${index + 1}:`, error);
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: 'Active bids import completed',
      totalProcessed: jobs.length,
      successfulImports: successfulImports.length,
      newCount,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Error importing active bids:', error);
    return NextResponse.json(
      { message: 'Failed to process active bids import', error: error.message },
      { status: 500 }
    );
  }
}

function parseActiveBidData(job: any, rowIndex: number) {
  // Extract all fields
  const status = findFieldValue(job, ['Status', 'Bid Status']);
  const branch = findFieldValue(job, ['Branch', 'Office']);
  const contractNumber = findFieldValue(job, ['Contract Number', 'Contract #', 'Contract']);
  const county = findFieldValue(job, ['County']);
  const lettingDate = findFieldValue(job, ['Letting Date']);
  const owner = findFieldValue(job, ['Owner', 'Client']);
  const division = findFieldValue(job, ['Division']);
  const estimator = findFieldValue(job, ['Estimator', 'Requestor']);
  const contractor = findFieldValue(job, ['Contractor']);
  const subcontractor = findFieldValue(job, ['Subcontractor']);
  
  // Project dates and details
  const startDate = findFieldValue(job, ['Start Date']);
  const endDate = findFieldValue(job, ['End Date']);
  const projectDays = findFieldValue(job, ['Project Days', 'Days']);
  const baseRate = findFieldValue(job, ['Base Rate']);
  const fringeRate = findFieldValue(job, ['Fringe Rate']);
  const rtMiles = findFieldValue(job, ['RT Miles', 'Round Trip Miles']);
  const rtTravel = findFieldValue(job, ['RT Travel', 'Round Trip Travel']);
  const emergencyJob = findFieldValue(job, ['Emergency Job']);
  
  // Hours
  const ratedHours = findFieldValue(job, ['Rated Hours']);
  const nonratedHours = findFieldValue(job, ['Nonrated Hours']);
  const totalHours = findFieldValue(job, ['Total Hours']);
  
  // Equipment quantities
  const phases = findFieldValue(job, ['Phases']) || 1;
  const typeIii4ft = findFieldValue(job, ['Type III 4ft']) || 0;
  const wings6ft = findFieldValue(job, ['Wings 6ft']) || 0;
  const hStands = findFieldValue(job, ['H Stands']) || 0;
  const posts = findFieldValue(job, ['Posts']) || 0;
  const sandBags = findFieldValue(job, ['Sand Bags']) || 0;
  const covers = findFieldValue(job, ['Covers']) || 0;
  const springLoadedMetalStands = findFieldValue(job, ['Spring Loaded Metal Stands']) || 0;
  const hiVerticalPanels = findFieldValue(job, ['HI Vertical Panels']) || 0;
  const typeXiVerticalPanels = findFieldValue(job, ['Type XI Vertical Panels']) || 0;
  const bLites = findFieldValue(job, ['B Lites']) || 0;
  const acLites = findFieldValue(job, ['AC Lites']) || 0;
  
  // Signs
  const hiSignsSqFt = findFieldValue(job, ['HI Signs Sq Ft']) || 0;
  const dgSignsSqFt = findFieldValue(job, ['DG Signs Sq Ft']) || 0;
  const specialSignsSqFt = findFieldValue(job, ['Special Signs Sq Ft']) || 0;
  
  // Financial data
  const mptValue = findFieldValue(job, ['MPT Value']) || 0;
  const mptGrossProfit = findFieldValue(job, ['MPT Gross Profit']) || 0;
  const mptGmPercent = findFieldValue(job, ['MPT GM %']) || 0;
  const rentalValue = findFieldValue(job, ['Rental Value']) || 0;
  const rentalGrossProfit = findFieldValue(job, ['Rental Gross Profit']) || 0;
  const rentalGmPercent = findFieldValue(job, ['Rental GM %']) || 0;

  if (!contractNumber) {
    throw new Error('Contract number is required');
  }

  // Parse dates
  const parsedLettingDate = parseExcelDate(lettingDate);
  const parsedStartDate = parseExcelDate(startDate);
  const parsedEndDate = parseExcelDate(endDate);

  // Map status to enum values
  const mappedStatus = mapStatusToEnum(status || 'PENDING');
  const mappedOwner = mapOwnerToEnum(owner);
  const mappedDivision = mapDivisionToEnum(division);

  return {
    bidEstimate: {
      status: mappedStatus,
      total_revenue: parseFloat(mptValue?.toString() || '0') + parseFloat(rentalValue?.toString() || '0'),
      total_cost: (parseFloat(mptValue?.toString() || '0') - parseFloat(mptGrossProfit?.toString() || '0')) + 
                  (parseFloat(rentalValue?.toString() || '0') - parseFloat(rentalGrossProfit?.toString() || '0')),
      total_gross_profit: parseFloat(mptGrossProfit?.toString() || '0') + parseFloat(rentalGrossProfit?.toString() || '0'),
    },
    adminData: {
      contract_number: contractNumber,
      estimator: estimator || 'Unknown',
      division: mappedDivision,
      bid_date: parsedLettingDate,
      owner: mappedOwner,
      county: JSON.stringify({ name: county || 'Unknown', branch: branch || 'Unknown' }),
      sr_route: '',
      location: '',
      dbe: '',
      start_date: parsedStartDate,
      end_date: parsedEndDate,
      ow_travel_time_mins: Math.round((parseFloat(rtTravel?.toString() || '0') * 60) / 2),
      ow_mileage: parseFloat(rtMiles?.toString() || '0') / 2,
      fuel_cost_per_gallon: null,
      emergency_job: Boolean(emergencyJob),
      rated: 'RATED' as const,
      emergency_fields: null,
    },
    mptRental: {
      target_moic: null,
      payback_period: null,
      annual_utilization: null,
      dispatch_fee: null,
      mpg_per_truck: null,
      revenue: parseFloat(mptValue?.toString() || '0'),
      cost: parseFloat(mptValue?.toString() || '0') - parseFloat(mptGrossProfit?.toString() || '0'),
      gross_profit: parseFloat(mptGrossProfit?.toString() || '0'),
      hours: parseFloat(totalHours?.toString() || '0'),
    },
    phase: {
      name: 'Phase 1',
      days: parseInt(projectDays?.toString() || '1'),
      personnel: null,
      number_trucks: null,
      additional_rated_hours: parseFloat(ratedHours?.toString() || '0'),
      additional_non_rated_hours: parseFloat(nonratedHours?.toString() || '0'),
      hivp_quantity: parseInt(hiVerticalPanels?.toString() || '0'),
      post_quantity: parseInt(posts?.toString() || '0'),
      covers_quantity: parseInt(covers?.toString() || '0'),
      h_stand_quantity: parseInt(hStands?.toString() || '0'),
      b_lights_quantity: parseInt(bLites?.toString() || '0'),
      sandbag_quantity: parseInt(sandBags?.toString() || '0'),
      ac_lights_quantity: parseInt(acLites?.toString() || '0'),
      type_xivp_quantity: parseInt(typeXiVerticalPanels?.toString() || '0'),
      metal_stands_quantity: parseInt(springLoadedMetalStands?.toString() || '0'),
      six_foot_wings_quantity: parseInt(wings6ft?.toString() || '0'),
      four_foot_type_iii_quantity: parseInt(typeIii4ft?.toString() || '0'),
    },
    contractNumber,
    contractor,
    subcontractor,
  };
}

async function createNewBid(parsedData: any) {
  // Start a transaction by inserting the bid estimate first
  const { data: bidEstimate, error: bidError } = await supabase
    .from('bid_estimates')
    .insert(parsedData.bidEstimate)
    .select()
    .single();

  if (bidError) {
    throw new Error(`Failed to create bid estimate: ${bidError.message}`);
  }

  // Insert admin data
  const { error: adminError } = await supabase
    .from('admin_data_entries')
    .insert({
      ...parsedData.adminData,
      bid_estimate_id: bidEstimate.id,
    });

  if (adminError) {
    throw new Error(`Failed to create admin data: ${adminError.message}`);
  }

  // Insert MPT rental
  const { data: mptRental, error: mptError } = await supabase
    .from('mpt_rental_entries')
    .insert({
      ...parsedData.mptRental,
      bid_estimate_id: bidEstimate.id,
    })
    .select()
    .single();

  if (mptError) {
    throw new Error(`Failed to create MPT rental: ${mptError.message}`);
  }

  // Insert phase
  const { error: phaseError } = await supabase
    .from('mpt_phases')
    .insert({
      ...parsedData.phase,
      mpt_rental_entry_id: mptRental.id,
      phase_index: 0,
      start_date: parsedData.adminData.start_date,
      end_date: parsedData.adminData.end_date,
    });

  if (phaseError) {
    throw new Error(`Failed to create phase: ${phaseError.message}`);
  }

  // Insert project metadata if contractor/subcontractor exist
  if (parsedData.contractor || parsedData.subcontractor) {
    // Find or create contractor
    let contractorId = null;
    if (parsedData.contractor) {
      const { data: contractor } = await supabase
        .from('contractors')
        .select('id')
        .eq('name', parsedData.contractor)
        .single();
      
      if (contractor) {
        contractorId = contractor.id;
      } else {
        const { data: newContractor } = await supabase
          .from('contractors')
          .insert({ name: parsedData.contractor })
          .select()
          .single();
        
        if (newContractor) {
          contractorId = newContractor.id;
        }
      }
    }

    // Find or create subcontractor
    let subcontractorId = null;
    if (parsedData.subcontractor) {
      const { data: subcontractor } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('name', parsedData.subcontractor.toUpperCase())
        .single();
      
      if (subcontractor) {
        subcontractorId = subcontractor.id;
      }
    }

    const { error: metadataError } = await supabase
      .from('project_metadata')
      .insert({
        bid_estimate_id: bidEstimate.id,
        contractor_id: contractorId,
        subcontractor_id: subcontractorId,
        customer_contract_number: parsedData.contractNumber,
      });

    if (metadataError) {
      console.warn('Failed to create project metadata:', metadataError.message);
    }
  }
}

async function updateExistingBid(bidId: number, parsedData: any) {
  // Update the bid estimate
  const { error: bidError } = await supabase
    .from('bid_estimates')
    .update(parsedData.bidEstimate)
    .eq('id', bidId);

  if (bidError) {
    throw new Error(`Failed to update bid estimate: ${bidError.message}`);
  }

  // Update or insert related data
  // Similar logic to createNewBid but with upsert operations
}

function mapStatusToEnum(status: string): Database['public']['Enums']['bid_estimate_status'] {
  const upperStatus = status.toUpperCase();
  if (upperStatus.includes('DRAFT')) return 'DRAFT';
  if (upperStatus.includes('PENDING')) return 'PENDING';
  if (upperStatus.includes('WON')) return 'WON';
  if (upperStatus.includes('LOST')) return 'LOST';
  return 'PENDING';
}

function mapOwnerToEnum(owner: string | null): Database['public']['Enums']['owner_type'] | null {
  if (!owner) return null;
  const upperOwner = owner.toUpperCase();
  if (upperOwner.includes('PENNDOT')) return 'PENNDOT';
  if (upperOwner.includes('TURNPIKE')) return 'TURNPIKE';
  if (upperOwner.includes('PRIVATE')) return 'PRIVATE';
  if (upperOwner.includes('SEPTA')) return 'SEPTA';
  return 'OTHER';
}

function mapDivisionToEnum(division: string | null): Database['public']['Enums']['division_type'] | null {
  if (!division) return null;
  const upperDivision = division.toUpperCase();
  if (upperDivision.includes('PUBLIC')) return 'PUBLIC';
  if (upperDivision.includes('PRIVATE')) return 'PRIVATE';
  return null;
}

// Keep the existing helper functions
function findFieldValue(obj: any, possibleKeys: string[]): any {
  for (const key of possibleKeys) {
    if (obj[key] !== undefined) {
      return obj[key];
    }
  }

  const objKeys = Object.keys(obj);
  for (const possibleKey of possibleKeys) {
    const lowerPossibleKey = possibleKey.toLowerCase().replace(/[\s_-]/g, '');
    for (const objKey of objKeys) {
      if (objKey.toLowerCase().replace(/[\s_-]/g, '') === lowerPossibleKey) {
        return obj[objKey];
      }
    }
  }

  return undefined;
}

function parseExcelDate(value: any): string | null {
  if (!value) return null;
  
  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
    try {
      const numericValue = typeof value === 'number' ? value : Number(value);
      
      if (numericValue > 1000 && numericValue < 100000) {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch);
        jsDate.setDate(excelEpoch.getDate() + numericValue);
        
        return jsDate.toISOString();
      }
    } catch (error) {
      console.error('Error parsing numeric Excel date:', error);
    }
  }
  
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (error) {
    console.error('Error parsing string date:', error);
  }
  
  return null;
}