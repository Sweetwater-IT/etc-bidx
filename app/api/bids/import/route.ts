import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type BidEstimateInsert = Database['public']['Tables']['bid_estimates']['Insert'];

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
    const validBids: BidEstimateInsert[] = [];

    for (const job of jobs) {
      try {
        console.log('Processing active bid row:', job);
        processActiveBid(job, validBids, errors, jobs.indexOf(job));
      } catch (error: any) {
        errors.push(`Row ${jobs.indexOf(job) + 1}: ${error.message}`);
      }
    }

    if (validBids.length > 0) {
      const { data, error } = await supabase
        .from('bid_estimates')
        .upsert(validBids, { 
          onConflict: 'contract_number',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Error inserting active bids:', error);
        return NextResponse.json(
          { message: 'Failed to import active bids', error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Active bids imported successfully',
        count: validBids.length,
        updated: true,
        errors: errors.length > 0 ? errors : undefined,
        data
      });
    } else {
      return NextResponse.json(
        { message: 'No valid active bids to import', errors },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error importing active bids:', error);
    return NextResponse.json(
      { message: 'Failed to process active bids import', error: error.message },
      { status: 500 }
    );
  }
}

function processActiveBid(job: any, validBids: BidEstimateInsert[], errors: string[], rowIndex: number) {
  console.log(`Processing active bid row ${rowIndex + 1}`);
  
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
  
  // Equipment and materials
  const phases = findFieldValue(job, ['Phases']) || 0;
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
  const hiSignsSqFt = findFieldValue(job, ['HI Signs Sq Ft']) || 0;
  const dgSignsSqFt = findFieldValue(job, ['DG Signs Sq Ft']) || 0;
  const specialSignsSqFt = findFieldValue(job, ['Special Signs Sq Ft']) || 0;
  
  // Equipment
  const tma = findFieldValue(job, ['TMA']) || 0;
  const arrowBoard = findFieldValue(job, ['Arrow Board']) || 0;
  const messageBoard = findFieldValue(job, ['Message Board']) || 0;
  const speedTrailer = findFieldValue(job, ['Speed Trailer']) || 0;
  const pts = findFieldValue(job, ['PTS']) || 0;
  
  // Financial data
  const mptValue = findFieldValue(job, ['MPT Value']) || 0;
  const mptGrossProfit = findFieldValue(job, ['MPT Gross Profit']) || 0;
  const mptGmPercent = findFieldValue(job, ['MPT GM %']) || 0;
  const permSignValue = findFieldValue(job, ['Perm Sign Value']) || 0;
  const permSignGrossProfit = findFieldValue(job, ['Perm Sign Gross Profit']) || 0;
  const permSignGmPercent = findFieldValue(job, ['Perm Sign GM %']) || 0;
  const rentalValue = findFieldValue(job, ['Rental Value']) || 0;
  const rentalGrossProfit = findFieldValue(job, ['Rental Gross Profit']) || 0;
  const rentalGmPercent = findFieldValue(job, ['Rental GM %']) || 0;
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Parse Excel dates correctly
  const parsedLettingDate = parseExcelDate(lettingDate);
  const parsedStartDate = parseExcelDate(startDate) || currentDate;
  const parsedEndDate = parseExcelDate(endDate) || currentDate;
  
  // Create the bid estimate record
  const mappedBid: BidEstimateInsert = {
    status: status || 'Pending',
    letting_date: parsedLettingDate,
    contract_number: contractNumber || '',
    contractor: contractor || null,
    subcontractor: subcontractor || null,
    owner: owner || 'Unknown',
    county: county || 'Unknown',
    branch: branch || 'Unknown',
    division: division || 'Unknown',
    estimator: estimator || 'Unknown',
    start_date: parsedStartDate,
    end_date: parsedEndDate,
    project_days: parseInt(projectDays?.toString() || '1'),
    base_rate: parseFloat(baseRate?.toString() || '0'),
    fringe_rate: parseFloat(fringeRate?.toString() || '0'),
    rt_miles: parseInt(rtMiles?.toString() || '0'),
    rt_travel: parseInt(rtTravel?.toString() || '0'),
    emergency_job: Boolean(emergencyJob || false),
    rated_hours: parseFloat(ratedHours?.toString() || '0'),
    nonrated_hours: parseFloat(nonratedHours?.toString() || '0'),
    total_hours: parseFloat(totalHours?.toString() || '0'),
    phases: parseInt(phases?.toString() || '0'),
    type_iii_4ft: parseInt(typeIii4ft?.toString() || '0'),
    wings_6ft: parseInt(wings6ft?.toString() || '0'),
    h_stands: parseInt(hStands?.toString() || '0'),
    posts: parseInt(posts?.toString() || '0'),
    sand_bags: parseInt(sandBags?.toString() || '0'),
    covers: parseInt(covers?.toString() || '0'),
    spring_loaded_metal_stands: parseInt(springLoadedMetalStands?.toString() || '0'),
    hi_vertical_panels: parseInt(hiVerticalPanels?.toString() || '0'),
    type_xi_vertical_panels: parseInt(typeXiVerticalPanels?.toString() || '0'),
    b_lites: parseInt(bLites?.toString() || '0'),
    ac_lites: parseInt(acLites?.toString() || '0'),
    hi_signs_sq_ft: parseFloat(hiSignsSqFt?.toString() || '0'),
    dg_signs_sq_ft: parseFloat(dgSignsSqFt?.toString() || '0'),
    special_signs_sq_ft: parseFloat(specialSignsSqFt?.toString() || '0'),
    tma: parseInt(tma?.toString() || '0'),
    arrow_board: parseInt(arrowBoard?.toString() || '0'),
    message_board: parseInt(messageBoard?.toString() || '0'),
    speed_trailer: parseInt(speedTrailer?.toString() || '0'),
    pts: parseInt(pts?.toString() || '0'),
    mpt_value: parseFloat(mptValue?.toString() || '0'),
    mpt_gross_profit: parseFloat(mptGrossProfit?.toString() || '0'),
    mpt_gm_percent: parseFloat(mptGmPercent?.toString() || '0'),
    perm_sign_value: parseFloat(permSignValue?.toString() || '0'),
    perm_sign_gross_profit: parseFloat(permSignGrossProfit?.toString() || '0'),
    perm_sign_gm_percent: parseFloat(permSignGmPercent?.toString() || '0'),
    rental_value: parseFloat(rentalValue?.toString() || '0'),
    rental_gross_profit: parseFloat(rentalGrossProfit?.toString() || '0'),
    rental_gm_percent: parseFloat(rentalGmPercent?.toString() || '0'),
  };

  if (!mappedBid.contract_number) {
    errors.push(`Row ${rowIndex + 1}: Contract number is required`);
    throw new Error('Contract number is required');
  }
  
  // Ensure all numeric fields are valid
  ensureValidNumbers(mappedBid, rowIndex, errors);

  validBids.push(mappedBid);
}

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

  console.log(`Could not find field value for keys: ${possibleKeys.join(', ')}`);
  console.log('Available keys:', objKeys);

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
  
  console.warn(`Could not parse date value: ${value}`);
  return null;
}

function ensureValidNumbers(bid: BidEstimateInsert, rowIndex: number, errors: string[]) {
  const numericFields = [
    'project_days', 'base_rate', 'fringe_rate', 'rt_miles', 'rt_travel',
    'rated_hours', 'nonrated_hours', 'total_hours', 'phases',
    'type_iii_4ft', 'wings_6ft', 'h_stands', 'posts', 'sand_bags', 'covers',
    'spring_loaded_metal_stands', 'hi_vertical_panels', 'type_xi_vertical_panels',
    'b_lites', 'ac_lites', 'hi_signs_sq_ft', 'dg_signs_sq_ft', 'special_signs_sq_ft',
    'tma', 'arrow_board', 'message_board', 'speed_trailer', 'pts',
    'mpt_value', 'mpt_gross_profit', 'mpt_gm_percent',
    'perm_sign_value', 'perm_sign_gross_profit', 'perm_sign_gm_percent',
    'rental_value', 'rental_gross_profit', 'rental_gm_percent'
  ];
  
  for (const field of numericFields) {
    if (bid[field] === undefined || bid[field] === null) {
      bid[field] = 0;
    } else if (isNaN(Number(bid[field])) || Number(bid[field]) < 0) {
      errors.push(`Row ${rowIndex + 1}: Invalid value for ${field}, using 0 instead`);
      bid[field] = 0;
    }
  }
}
