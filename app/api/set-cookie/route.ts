import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  // Set the cookie (adjust options as needed)
  const response = NextResponse.json({ success: true });
  response.cookies.set('supabase_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  return response;
} 