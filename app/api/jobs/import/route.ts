import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type AvailableJobInsert = Database['public']['Tables']['available_jobs']['Insert'];

export async function POST(request: Request) {
  try {
    const { jobs, type = 'available-jobs' } = await request.json();
    
    console.log(`Processing ${type} import with ${jobs?.length || 0} records`);
    
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { message: 'No valid jobs data provided' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const validJobs: AvailableJobInsert[] = [];

    for (const job of jobs) {
      try {
        console.log('Processing row:', job);
        
        if (type === 'available-jobs') {
          processAvailableJob(job, validJobs, errors, jobs.indexOf(job));
        } else {
          errors.push(`Unknown import type: ${type}`);
        }
        
      } catch (error: any) {
        errors.push(`Row ${jobs.indexOf(job) + 1}: ${error.message}`);
      }
    }

    if (validJobs.length > 0) {
      const updatedJobs: AvailableJobInsert[] = [];
      const newJobs: AvailableJobInsert[] = [];
      const updatedCount = { new: 0, updated: 0 };
      
      for (const job of validJobs) {
        const { data: existingJobs } = await supabase
          .from('available_jobs')
          .select('*')
          .eq('contract_number', job.contract_number)
          .limit(1);
        
        if (existingJobs && existingJobs.length > 0) {
          // Ensure all fields are updated, especially dates
          // We need to standardize the date format to YYYY-MM-DD for database storage
          // This ensures consistency between the table and drawer views
          const currentDateStr = new Date().toISOString().split('T')[0];
          
          const updatedJob = {
            ...job,
            // Force ISO string format for dates to ensure consistency
            // Use current date as default for required date fields
            letting_date: job.letting_date ? new Date(job.letting_date).toISOString().split('T')[0] : currentDateStr,
            due_date: job.due_date ? new Date(job.due_date).toISOString().split('T')[0] : currentDateStr,
            entry_date: job.entry_date ? new Date(job.entry_date).toISOString().split('T')[0] : currentDateStr
          };
          
          console.log('Updating job with dates:', {
            original_letting_date: job.letting_date,
            updated_letting_date: updatedJob.letting_date,
            original_due_date: job.due_date,
            updated_due_date: updatedJob.due_date
          });
          
          const { data, error } = await supabase
            .from('available_jobs')
            .update(updatedJob)
            .eq('contract_number', job.contract_number)
            .select();
          
          if (!error && data) {
            updatedJobs.push(...(data as AvailableJobInsert[]));
            updatedCount.updated++;
          }
        } else {
          // Standardize date formats for new jobs too
          // Use current date as default for required date fields to satisfy type requirements
          const currentDateStr = new Date().toISOString().split('T')[0];
          
          const newJob = {
            ...job,
            letting_date: job.letting_date ? new Date(job.letting_date).toISOString().split('T')[0] : currentDateStr,
            due_date: job.due_date ? new Date(job.due_date).toISOString().split('T')[0] : currentDateStr,
            entry_date: job.entry_date ? new Date(job.entry_date).toISOString().split('T')[0] : currentDateStr
          };
          
          newJobs.push(newJob);
          updatedCount.new++;
        }
      }
      
      let insertError: any = null;
      if (newJobs.length > 0) {
        const { data: newJobsData, error } = await supabase
          .from('available_jobs')
          .insert(newJobs)
          .select();
          
        if (error) {
          insertError = error;
        } else if (newJobsData) {
          updatedJobs.push(...(newJobsData as AvailableJobInsert[]));
        }
      }
      
      // Check for errors
      if (insertError) {
        console.error('Error inserting new jobs:', insertError);
        return NextResponse.json(
          { message: 'Failed to import jobs', error: insertError.message },
          { status: 500 }
        );
      }
      
      const data = updatedJobs;

      return NextResponse.json({
        message: 'Jobs imported successfully',
        count: validJobs.length,
        updated: updatedCount.updated > 0,
        newCount: updatedCount.new,
        updatedCount: updatedCount.updated,
        errors: errors.length > 0 ? errors : undefined,
        data
      });
    } else {
      return NextResponse.json(
        { message: 'No valid jobs to import', errors },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error importing jobs:', error);
    return NextResponse.json(
      { message: 'Failed to process import', error: error.message },
      { status: 500 }
    );
  }
}

function findFieldValue(obj: any, possibleKeys: string[]): any {
  for (const key of possibleKeys) {
    if (obj[key] !== undefined) {
      return obj[key];
    }
  }

  const objKeys = Object.keys(obj);
  for (const possibleKey of possibleKeys) {
    const lowerPossibleKey = possibleKey.toLowerCase().replace(/[\s_\-#\.\(\)]/g, '');
    for (const objKey of objKeys) {
      const normalizedObjKey = objKey.toLowerCase().replace(/[\s_\-#\.\(\)]/g, '');
      if (normalizedObjKey === lowerPossibleKey) {
        return obj[objKey];
      }
    }
  }

  for (const possibleKey of possibleKeys) {
    const lowerPossibleKey = possibleKey.toLowerCase().replace(/[\s_\-#\.\(\)]/g, '');
    for (const objKey of objKeys) {
      const normalizedObjKey = objKey.toLowerCase().replace(/[\s_\-#\.\(\)]/g, '');
      if (normalizedObjKey.includes(lowerPossibleKey) || lowerPossibleKey.includes(normalizedObjKey)) {
        return obj[objKey];
      }
    }
  }

  console.log(`Could not find field value for keys: ${possibleKeys.join(', ')}`);
  console.log('Available keys:', objKeys);

  return undefined;
}

function isEffectivelyUnknown(value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return normalized === '' || normalized === 'unknown' || normalized === 'n/a' || normalized === '-';
  }
  return false;
}

function cleanValue(value: any): any {
  if (isEffectivelyUnknown(value)) return null;
  return value;
}

function processAvailableJob(job: any, validJobs: AvailableJobInsert[], errors: string[], rowIndex: number) {
  console.log(`Processing available job row ${rowIndex + 1}`);
  
  const status = findFieldValue(job, ['Status', 'Bid Status']);
  const branch = findFieldValue(job, ['Branch', 'Office']);
  
  const contractNumber = findFieldValue(job, [
    'Project',
    'Contract Number', 'Contract #', 'Contract', 'ContractNumber', 'Contract_Number',
    'Contract No', 'Contract No.', 'ContractNo', 'Job Number', 'Job #', 'JobNumber', 'Project Number', 'ProjectNumber'
  ]);
  
  const county = findFieldValue(job, ['County', 'Count']);
  
  const dueDate = findFieldValue(job, ['Due Date', 'Bid Due Date', 'Due']);
  
  const lettingDate = findFieldValue(job, ['Let Date', 'Letting Date', 'Letting']);
  const entryDate = findFieldValue(job, ['Entry Date', 'Date Added', 'Created Date']);
  const location = findFieldValue(job, ['Location', 'Project Location', 'Address']);
  const owner = findFieldValue(job, ['Owner', 'Client', 'Agency']);
  const platform = 'ECMS';
  const requestor = findFieldValue(job, ['Requestor', 'Estimator', 'Contact']);
  const mpt = findFieldValue(job, ['MPT', 'Maintenance and Protection of Traffic']);
  const flagging = findFieldValue(job, ['Flagging', 'Traffic Control']);
  const permSigns = findFieldValue(job, ['Perm Signs', 'Permanent Signs', 'Signs']);
  const equipmentRental = findFieldValue(job, ['Equipment Rental', 'Equipment']);
  const other = findFieldValue(job, ['Other', 'Additional Services']);
  const noBidReason = findFieldValue(job, ['No Bid Reason', 'Reason', 'Notes']);
  const dbePercentage = findFieldValue(job, ['DBE %', 'DBE Percentage', 'DBE']);
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  let parsedDueDate = parseExcelDate(dueDate);
  let parsedLettingDate = parseExcelDate(lettingDate);
  
  if (parsedLettingDate && !parsedDueDate) {
    const lettingDateTime = new Date(parsedLettingDate);
    const dueDatetime = new Date(lettingDateTime);
    dueDatetime.setDate(lettingDateTime.getDate() - 2);
    parsedDueDate = dueDatetime.toISOString().split('T')[0];
  }
  
  else if (parsedDueDate && !parsedLettingDate) {
    const dueDatetime = new Date(parsedDueDate);
    const lettingDateTime = new Date(dueDatetime);
    lettingDateTime.setDate(dueDatetime.getDate() + 2);
    parsedLettingDate = lettingDateTime.toISOString().split('T')[0];
  }
  
  else if (parsedDueDate && parsedLettingDate) {
    
    const dueDateTime = new Date(parsedDueDate).getTime();
    const lettingDateTime = new Date(parsedLettingDate).getTime();
    
    if (dueDateTime > lettingDateTime) {
      console.warn(`Row ${rowIndex + 1}: Due date (${parsedDueDate}) is after letting date (${parsedLettingDate}). This is invalid.`);
      errors.push(`Row ${rowIndex + 1}: Due date is after letting date. This may cause issues.`);
    }
  }
  
  const parsedEntryDate = parseExcelDate(entryDate);
  
  const mappedJob: AvailableJobInsert = {
    contract_number: contractNumber || '',
    status: mapStatus(status || 'Unset'),
    requestor: cleanValue(requestor),
    owner: cleanValue(owner),
    letting_date: parsedLettingDate || currentDate, // Default to current date
    due_date: parsedDueDate || currentDate, // Default to current date
    county: cleanValue(county),
    branch: cleanValue(branch) || 'Main Office', // Default to 'Main Office' if branch is null
    location: cleanValue(location),
    platform: cleanValue(platform),
    entry_date: parsedEntryDate || new Date().toISOString(),
    mpt: Boolean(mpt || false),
    flagging: Boolean(flagging || false),
    perm_signs: Boolean(permSigns || false),
    equipment_rental: Boolean(equipmentRental || false),
    other: Boolean(other || false),
    dbe_percentage: dbePercentage ? parseFloat(dbePercentage.toString()) : 0,
    no_bid_reason: noBidReason || null,
  };

  if (!mappedJob.contract_number) {
    if (mappedJob.owner) {
      const ownerPrefix = mappedJob.owner.substring(0, 3).toUpperCase();
      const fallbackNumber = `TEMP-${ownerPrefix}-${new Date().getFullYear()}-${rowIndex + 1}`;
      mappedJob.contract_number = fallbackNumber;
      errors.push(`Row ${rowIndex + 1}: Contract number missing, created temporary number: ${fallbackNumber}`);
    } else {
      const timestamp = new Date().getTime();
      const fallbackNumber = `TEMP-${timestamp}-${rowIndex + 1}`;
      mappedJob.contract_number = fallbackNumber;
      errors.push(`Row ${rowIndex + 1}: Contract number missing, created temporary number: ${fallbackNumber}`);
    }
  }
  
  if (!mappedJob.requestor) {
    console.log('Requestor missing for row, using default');
    errors.push(`Row ${rowIndex + 1}: Requestor missing, using default 'Unknown'`);
    mappedJob.requestor = 'Unknown';
  }
  
  if (!mappedJob.owner) {
    console.log('Owner missing for row, using default');
    errors.push(`Row ${rowIndex + 1}: Owner missing, using default 'Unknown'`);
    mappedJob.owner = 'Unknown';
  }

  validJobs.push(mappedJob);
}

function parseExcelDate(value: any): string | null {
  if (!value) return null;
  
  // Handle Excel numeric dates (days since 1/1/1900, with adjustment for Excel's leap year bug)
  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
    try {
      const numericValue = typeof value === 'number' ? value : Number(value);
      
      // Excel date range check (reasonable values between ~1900 and ~2200)
      if (numericValue > 1000 && numericValue < 100000) {
        const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
        const jsDate = new Date(excelEpoch);
        jsDate.setDate(excelEpoch.getDate() + numericValue);
        
        // Return only the date portion in ISO format (YYYY-MM-DD)
        return jsDate.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error parsing numeric Excel date:', error);
    }
  }
  
  // Handle string dates in various formats
  if (typeof value === 'string') {
    // Try to handle common date formats
    const formats = [
      // Try direct parsing first
      () => new Date(value),
      // MM/DD/YYYY
      () => {
        const parts = value.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
        return new Date('invalid');
      },
      // DD/MM/YYYY
      () => {
        const parts = value.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return new Date('invalid');
      }
    ];
    
    for (const format of formats) {
      try {
        const date = format();
        if (!isNaN(date.getTime())) {
          // Return only the date portion in ISO format (YYYY-MM-DD)
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Continue to next format
      }
    }
  }
  
  console.warn(`Could not parse date value: ${value}`);
  return null;
}

function mapStatus(status: string): 'Bid' | 'No Bid' | 'Unset' {
  if (!status) return 'Unset';
  
  const lowerStatus = status.toString().toLowerCase();
  
  if (lowerStatus === 'bid') return 'Bid';
  if (lowerStatus === 'no bid') return 'No Bid';
  if (lowerStatus === 'choose' || lowerStatus === 'unset') return 'Unset';
  
  if (lowerStatus.includes('bid') && !lowerStatus.includes('no')) return 'Bid';
  if (lowerStatus.includes('no') && lowerStatus.includes('bid')) return 'No Bid';
  if (lowerStatus.includes('open')) return 'Bid';
  if (lowerStatus.includes('urgent')) return 'No Bid';
  if (lowerStatus.includes('closed')) return 'Unset';
  
  return 'Unset';
}
