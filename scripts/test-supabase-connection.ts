import { supabase } from '../lib/supabase';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test the connection by getting the server version
    const { data, error } = await supabase.from('available_jobs').select('count()', { count: 'exact' });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log(`Number of records in available_jobs table: ${data[0].count}`);
    
    // Test another query to verify schema
    const { data: jobsData, error: jobsError } = await supabase
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
