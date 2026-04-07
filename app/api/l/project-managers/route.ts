import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const branchIdParam = request.nextUrl.searchParams.get('branchId');
    const branchId = branchIdParam ? Number(branchIdParam) : null;

    let query = supabase
      .from('project_managers')
      .select('id, first_name, last_name, branch_id, branches(name)')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true });

    if (branchIdParam && !Number.isNaN(branchId)) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching project managers:', error);
      return NextResponse.json({ error: 'Failed to fetch project managers' }, { status: 500 });
    }

    const managers = (data || []).map((row: any) => {
      const firstName = (row.first_name || '').trim();
      const lastName = (row.last_name || '').trim();
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

      return {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        branch_id: row.branch_id,
        branch_name: row.branches?.name || null,
        full_name: fullName,
      };
    });

    return NextResponse.json({ success: true, data: managers });
  } catch (error) {
    console.error('Error in project managers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}