import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for NextAuth session cookie (dev and prod)
  const devSession = request.cookies.get('next-auth.session-token');
  const prodSession = request.cookies.get('__Secure-next-auth.session-token');
  const isAuthenticated = !!devSession || !!prodSession;

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