import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  try {
    // Test the connection by getting the count
    const { data, error } = await supabaseAnon
      .from('available_jobs')
      .select('count()', { count: 'exact' });

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log(`Number of records in available_jobs table: ${data[0].count}`);

    // Test another query to verify schema
    const { data: jobsData, error: jobsError } = await supabaseAnon
      .from('available_jobs')
      .select('*')
      .limit(1);

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError.message);
      return;
    }

    if (jobsData && jobsData.length > 0) {
      console.log('✅ Successfully retrieved job data:');
      console.log(JSON.stringify(jobsData[0], null, 2));
    } else {
      console.log('ℹ️ No jobs found in the table.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSupabaseConnection();
