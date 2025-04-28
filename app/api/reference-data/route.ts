import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch reference data for dropdowns and rates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    if (!type) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameter: type' },
        { status: 400 }
      );
    }
    
    let data;
    let error;
    
    switch (type) {
      case 'counties':
        // Fetch counties with their rates
        ({ data, error } = await supabase
          .from('counties')
          .select('id, name, labor_rate, fringe_rate, market, branch')
          .order('name'));
        break;
        
      case 'branches':
        // Fetch branches with shop rates
        ({ data, error } = await supabase
          .from('branches')
          .select('id, name, shop_rate')
          .order('name'));
        break;
        
      case 'users':
        // Fetch users for estimator dropdown
        ({ data, error } = await supabase
          .from('users')
          .select('id, name')
          .order('name'));
        break;
        
      case 'divisions':
        // For divisions, we'll return a static list since there's no divisions table
        data = [
          { id: 'MPT', name: 'MPT' },
          { id: 'Permanent Signs', name: 'Permanent Signs' },
          { id: 'Equipment Rental', name: 'Equipment Rental' },
          { id: 'Flagging', name: 'Flagging' }
        ];
        break;
        
      case 'owners':
        // For owners, extract unique owners from available_jobs
        ({ data, error } = await supabase
          .from('available_jobs')
          .select('owner')
          .order('owner'));
        
        if (data) {
          // Extract unique owners
          const uniqueOwners = [...new Set(data.map(item => item.owner))];
          data = uniqueOwners.map(owner => ({ id: owner, name: owner }));
        }
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: `Invalid reference data type: ${type}` },
          { status: 400 }
        );
    }
    
    if (error) {
      return NextResponse.json(
        { success: false, message: `Failed to fetch ${type}`, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
