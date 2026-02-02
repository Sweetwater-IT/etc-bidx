const { supabase } = require('../lib/supabase');
async function query() {
  const { data, error } = await supabase.from('items').select('*').ilike('name', '%DG%');
  console.log('Items with DG:', error ? error : data);
  const { data: prod, error: prodError } = await supabase.from('productivity_rates').select('*');
  console.log('Productivity rates:', prodError ? prodError : prod);
  const { data: signs, error: signError } = await supabase.from('sign_designations').select('*').ilike('sheeting', '%DG%');
  console.log('Sign designations with DG:', signError ? signError : signs);
}
query().catch(console.error);
