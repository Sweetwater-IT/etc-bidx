// lib/supabase-sign-analytics.ts

"use client"

import { createBrowserClient } from "@supabase/ssr"

export const supabaseSignAnalytics = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_SIGN_ANALYTICS_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SIGN_ANALYTICS_PUBLISHABLE_DEFAULT_KEY!
)