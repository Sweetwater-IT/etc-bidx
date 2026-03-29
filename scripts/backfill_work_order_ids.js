const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillWorkOrderIds() {
  console.log('Starting backfill of work_order_id for existing takeoffs...');

  try {
    // Find all takeoffs that have work_order_number but no work_order_id
    const { data: takeoffs, error: takeoffError } = await supabase
      .from('takeoffs_l')
      .select('id, work_order_number, job_id')
      .not('work_order_number', 'is', null)
      .is('work_order_id', null);

    if (takeoffError) {
      console.error('Error fetching takeoffs:', takeoffError);
      return;
    }

    console.log(`Found ${takeoffs.length} takeoffs that need work_order_id backfilled`);

    let updatedCount = 0;

    for (const takeoff of takeoffs) {
      // Find the work order by job_id and wo_number
      const { data: workOrder, error: woError } = await supabase
        .from('work_orders_l')
        .select('id')
        .eq('job_id', takeoff.job_id)
        .eq('wo_number', takeoff.work_order_number)
        .single();

      if (woError || !workOrder) {
        console.warn(`Could not find work order for takeoff ${takeoff.id} with WO number ${takeoff.work_order_number}`);
        continue;
      }

      // Update the takeoff with the work order ID
      const { error: updateError } = await supabase
        .from('takeoffs_l')
        .update({ work_order_id: workOrder.id })
        .eq('id', takeoff.id);

      if (updateError) {
        console.error(`Error updating takeoff ${takeoff.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated takeoff ${takeoff.id} with work_order_id ${workOrder.id}`);
      }
    }

    console.log(`Backfill complete! Updated ${updatedCount} takeoffs.`);

  } catch (error) {
    console.error('Unexpected error during backfill:', error);
  }
}

backfillWorkOrderIds();