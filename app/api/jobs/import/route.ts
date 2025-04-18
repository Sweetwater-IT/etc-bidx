import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type AvailableJobInsert = Database['public']['Tables']['available_jobs']['Insert'];

export async function POST(request: Request) {
  try {
    const { jobs } = await request.json();
    
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
        
        const status = findFieldValue(job, ['Status']);
        const branch = findFieldValue(job, ['Branch']);
        const contractNumber = findFieldValue(job, ['Contract Number']);
        const county = findFieldValue(job, ['County']);
        const dueDate = findFieldValue(job, ['Due Date']);
        const lettingDate = findFieldValue(job, ['Letting Date']);
        const entryDate = findFieldValue(job, ['Entry Date']);
        const location = findFieldValue(job, ['Location']);
        const owner = findFieldValue(job, ['Owner']);
        const platform = findFieldValue(job, ['Platform']);
        const requestor = findFieldValue(job, ['Requestor']);
        const mpt = findFieldValue(job, ['MPT']);
        const flagging = findFieldValue(job, ['Flagging']);
        const permSigns = findFieldValue(job, ['Perm Signs']);
        const equipmentRental = findFieldValue(job, ['Equipment Rental']);
        const other = findFieldValue(job, ['Other']);
        const noBidReason = findFieldValue(job, ['No Bid Reason']);
        
        const currentDate = new Date().toISOString().split('T')[0];
        
        const mappedJob: AvailableJobInsert = {
          contract_number: contractNumber || '',
          status: mapStatus(status || 'Unset'),
          requestor: requestor || 'Unknown',
          owner: owner || 'Unknown',
          letting_date: lettingDate || currentDate, // Default to current date
          due_date: dueDate || currentDate, // Default to current date
          county: county || 'Unknown',
          branch: branch || 'Unknown',
          location: location || 'Unknown',
          platform: platform || 'Unknown',
          entry_date: entryDate ? new Date(entryDate).toISOString() : new Date().toISOString(),
          mpt: Boolean(mpt || false),
          flagging: Boolean(flagging || false),
          perm_signs: Boolean(permSigns || false),
          equipment_rental: Boolean(equipmentRental || false),
          other: Boolean(other || false),
          dbe_percentage: 0, // Not in the Excel file, default to 0
          no_bid_reason: noBidReason || null,
        };

        if (!mappedJob.contract_number) {
          throw new Error('Contract number is required');
        }
        
        if (!mappedJob.requestor) {
          console.log('Requestor missing for row, using default');
          mappedJob.requestor = 'Unknown';
        }
        
        if (!mappedJob.owner) {
          console.log('Owner missing for row, using default');
          mappedJob.owner = 'Unknown';
        }

        validJobs.push(mappedJob);
      } catch (error: any) {
        errors.push(`Row ${jobs.indexOf(job) + 1}: ${error.message}`);
      }
    }

    if (validJobs.length > 0) {
      const { data, error } = await supabase
        .from('available_jobs')
        .insert(validJobs)
        .select();

      if (error) {
        console.error('Error inserting jobs:', error);
        return NextResponse.json(
          { message: 'Failed to import jobs', error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Jobs imported successfully',
        count: validJobs.length,
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
