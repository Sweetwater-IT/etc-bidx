import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log('callback reached');

  const supabase = createRouteHandlerClient({
    cookies: () => cookies()
  });

  const { data } = await supabase.auth.getSession();
  console.log('session after redirect:', data.session);
  
  return NextResponse.redirect(new URL('/', req.url));

}