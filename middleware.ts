import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('isAuthenticated');
  const { pathname } = request.nextUrl;

  // Allow access to the password entry page, API routes, and static assets
  if (pathname.startsWith('/password-entry') || 
      pathname.startsWith('/api') || 
      pathname.startsWith('/_next/static') || 
      pathname.startsWith('/_next/image') ||
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to the password entry page
  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/password-entry';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - password-entry (the password page itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|password-entry).*)',
  ],
}; 