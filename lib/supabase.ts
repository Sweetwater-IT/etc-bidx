import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 [SUPABASE] Initializing Supabase client...', {
  supabaseUrl: supabaseUrl ? '✅ Present' : '❌ Missing',
  supabaseServiceRoleKey: supabaseServiceRoleKey ? '✅ Present' : '❌ Missing',
  NODE_ENV: process.env.NODE_ENV
});

export const supabase: SupabaseClient = supabaseUrl && supabaseServiceRoleKey
  ? (() => {
      console.log('🔍 [SUPABASE] Creating Supabase client with service role key');
      const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
      console.log('🔍 [SUPABASE] Supabase client created successfully');
      return client;
    })()
  : (() => {
      console.log('🔍 [SUPABASE] Missing environment variables, creating error proxy');
      return new Proxy(
        {},
        {
          get() {
            console.error('🔍 [SUPABASE] Attempting to access Supabase client without proper environment variables');
            throw new Error(
              'Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
            );
          },
        }
      ) as SupabaseClient;
    })();
