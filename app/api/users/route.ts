import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user', error: userError.message },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const branchId = user.branch_id;

    const { data: branchData, error: branchError } = await supabase
      .from('branches') 
      .select('*')
      .eq('id', branchId);

    if (branchError) {
      console.error('Error fetching branch data:', branchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch branch data', error: branchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, branchData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
