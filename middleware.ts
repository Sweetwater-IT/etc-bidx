import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side use (no cookies needed here, using request headers)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function middleware(request: NextRequest) {
  // Check for Supabase session
  const {
    data: { session },
  } = await supabase.auth.getSession({
    headers: { Authorization: request.headers.get('Authorization') || '' },
  });
  const isAuthenticated = !!session;

  const { pathname } = request.nextUrl;

  // Allow access to the password entry (login) page, API routes, and static assets
  if (
    pathname.startsWith('/password-entry') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    /\.(jpg|jpeg|png|svg|webp|ico)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/password-entry';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|password-entry).*)',
  ],
};
