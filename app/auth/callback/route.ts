import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  console.log('Callback URL:', url.href, 'Search Params:', url.searchParams.toString());

  const code = url.searchParams.get('code');
  const origin = url.origin; // Dynamically get bidx-test.vercel.app or bidx-live.vercel.app
  const next = '/'; // Redirect to root

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Auth error:', error.message);
        return NextResponse.redirect(`${origin}/?error=auth`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(`${origin}/?error=server`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=no-code`);
}
