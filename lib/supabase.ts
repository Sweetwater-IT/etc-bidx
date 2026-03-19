// === SAFE SUPABASE CLIENT CREATION ===
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('🔍 [SUPABASE] Missing env vars during build - creating safe mock');
  supabase = new Proxy({} as SupabaseClient, {
    get() {
      if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        return () => Promise.resolve({ data: null, error: null });
      }
      throw new Error('Supabase environment variables are missing.');
    },
  });
} else {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export { supabase };
