import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Allow access to the password entry (now Google Auth) page, API routes, and static assets
  if (pathname.startsWith('/password-entry') || 
      pathname.startsWith('/api') || 
      pathname.startsWith('/_next/static') || 
      pathname.startsWith('/_next/image') ||
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Session checker removed: always allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|password-entry).*)',
  ],
}; 