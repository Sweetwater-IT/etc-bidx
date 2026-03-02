import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// During build time or when env vars are missing, create a mock client
// This prevents build failures while still allowing runtime functionality
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client for build time
    const mockQueryBuilder = {
      select: () => mockQueryBuilder,
      insert: () => mockQueryBuilder,
      update: () => mockQueryBuilder,
      delete: () => mockQueryBuilder,
      eq: () => mockQueryBuilder,
      maybeSingle: <T = any>() => ({ data: null, error: null }),
      single: <T = any>() => ({ data: null, error: null }),
    };

    return {
      from: () => mockQueryBuilder,
      rpc: () => ({ data: null, error: null }),
      auth: {
        getUser: () => ({ data: { user: null }, error: null }),
        signOut: () => ({ error: null }),
      },
    } as any;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

export const supabase = createSupabaseClient();
