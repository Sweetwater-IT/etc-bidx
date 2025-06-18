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
          .select(`
            id,
            name,
            district,
            branches ( id, name, shop_rate ),
            labor_rate,
            fringe_rate,
            market,
            flagging_rate,
            insurance,
            fuel,
            flagging_non_rated_target_gm,
            flagging_rated_target_gm,
            flagging_base_rate,
            flagging_fringe_rate
          `)
          .order('name')
        );
        break;
      
      case 'mpt equipment':
        ({ data, error} = await supabase
          .from('items')
          .select(`
            name,
            price,
            depreciation_rate_useful_life,
            payback_period
          `))
        break;

      case 'users':
        // Fetch users for estimator dropdown
        ({ data, error } = await supabase
          .from('users')
          .select('id, name, email, role, branches(name)')
          .order('name'));
        break;

      case 'owners':
        // Fetch owners
        ({ data, error } = await supabase
          .from('owners')
          .select('id, name'))
        break;
        
      case 'branches':
        // Fetch branches
        ({ data, error } = await supabase
          .from('branches')
          .select('id, name')
          .order('name'))
        break;
        
      case 'estimators':
        // Fetch all users as potential estimators since there's no specific 'estimator' role
        ({ data, error } = await supabase
          .from('users')
          .select('id, name')
          .order('name'))
        break;
        
      case 'contractors':
        ({ data, error } = await supabase
          .from('contractors')
          .select('id, name')
          .order('name'))
        break;
        
      case 'customers':
        // Alias for contractors - many parts of the app use 'customers' instead of 'contractors'
        ({ data, error } = await supabase
          .from('contractors')
          .select('id, name')
          .order('name'))
        break;
      default:
        return NextResponse.json(
          { success: false, message: `Invalid reference data type: ${type}` },
          { status: 400 }
        );
    }

    if (error) {
      console.error(error)
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
