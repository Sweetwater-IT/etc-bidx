import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the manually set Supabase auth cookie
  const hasSupabaseToken = !!request.cookies.get('supabase_token');
  const { pathname } = request.nextUrl;
  console.log(hasSupabaseToken);
  console.log(pathname);
  // Allow access to the password entry (now Google Auth) page, API routes, and static assets
  if (
    pathname.startsWith('/password-entry') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    /\.(jpg|jpeg|png|svg|webp|ico)$/i.test(pathname) // allow images and favicon
  ) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to the Google Auth page
  if (!hasSupabaseToken) {
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