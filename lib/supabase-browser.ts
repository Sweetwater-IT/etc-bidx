import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let browserSupabase: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (browserSupabase) {
    return browserSupabase
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase browser environment variables are missing.')
  }

  browserSupabase = createClient(supabaseUrl, supabaseAnonKey)
  return browserSupabase
}
