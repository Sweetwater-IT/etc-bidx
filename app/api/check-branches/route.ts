import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Check if branches table exists
    const { data: branchesCheck, error: branchesError } = await supabase
      .from('branches')
      .select('*');
    
    return NextResponse.json({
      branchesTableExists: !branchesError,
      branchesError: branchesError?.message,
      branches: branchesCheck
    });
  } catch (error) {
    console.error('Error checking branches information:', error);
    return NextResponse.json({ error: 'Failed to check branches information' }, { status: 500 });
  }
}
