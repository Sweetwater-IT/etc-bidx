import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Correct way to check for Supabase session cookie
  const hasSupabaseSession = request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'));
  const { pathname } = request.nextUrl;

  // Allow access to the password entry (now Google Auth) page, API routes, and static assets
  if (pathname.startsWith('/password-entry') || 
      pathname.startsWith('/api') || 
      pathname.startsWith('/_next/static') || 
      pathname.startsWith('/_next/image') ||
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to the Google Auth page
  if (!hasSupabaseSession) {
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