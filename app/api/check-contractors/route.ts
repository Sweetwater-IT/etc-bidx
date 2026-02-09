import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Check if contractors table exists
    const { data: contractorsCheck, error: contractorsError } = await supabase
      .from('contractors')
      .select('*')
      .limit(1);
    
    // Check if there's a users table with branch info
    const { data: usersCheck, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    // Check for unique contractor_ids in sign_orders
    const { data: uniqueContractorIds, error: uniqueError } = await supabase
      .from('sign_orders')
      .select('contractor_id')
      .limit(10);

    return NextResponse.json({
      contractorsTableExists: !contractorsError,
      contractorsError: contractorsError?.message,
      contractorsData: contractorsCheck,
      usersTableExists: !usersError,
      usersData: usersCheck,
      uniqueContractorIds,
      uniqueError: uniqueError?.message
    });
  } catch (error) {
    console.error('Error checking contractors information:', error);
    return NextResponse.json({ error: 'Failed to check contractors information' }, { status: 500 });
  }
}
