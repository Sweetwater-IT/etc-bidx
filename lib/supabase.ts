// lib/supabase.ts   (or wherever this file is)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 [SUPABASE] Initializing Supabase client...', {
  supabaseUrl: supabaseUrl ? '✅ Present' : '❌ Missing',
  supabaseServiceRoleKey: supabaseServiceRoleKey ? '✅ Present' : '❌ Missing',
  NODE_ENV: process.env.NODE_ENV,
  isBuildTime: typeof window === 'undefined' && process.env.NODE_ENV === 'production',
});

let supabase: SupabaseClient;

// Stronger guard for Vercel static build / prerender phase
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('🔍 [SUPABASE] Missing env vars during build - creating safe mock client');

  supabase = new Proxy({} as SupabaseClient, {
    get() {
      if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        console.error('Supabase client accessed during static prerender without env vars');
        // Return empty promises instead of throwing (prevents build crash)
        return () => Promise.resolve({ data: null, error: null });
      }
      throw new Error('Supabase environment variables are missing.');
    },
  });
} else {
  console.log('🔍 [SUPABASE] Creating Supabase client with service role key');

  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  console.log('🔍 [SUPABASE] Supabase client created successfully');
}

export { supabase };
