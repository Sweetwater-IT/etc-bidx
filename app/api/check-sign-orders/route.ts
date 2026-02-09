import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Check if branch column exists directly
    const { data: branchCheck, error: branchError } = await supabase
      .from('sign_orders')
      .select('branch')
      .limit(1);
    
    const hasBranchColumn = !branchError;

    // Get a sample row to see all available columns
    const { data: sampleData, error: sampleError } = await supabase
      .from('sign_orders')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error getting sample data:', sampleError);
      return NextResponse.json({ error: sampleError.message }, { status: 500 });
    }

    // Check if there's a contractor_id or similar field that might link to branch info
    const sampleColumns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
    
    // Check for any columns that might contain branch info
    const potentialBranchColumns = sampleColumns.filter(col => 
      col.includes('branch') || 
      col.includes('location') || 
      col.includes('site') ||
      col.includes('contractor')
    );

    return NextResponse.json({
      hasBranchColumn,
      branchCheckError: branchError?.message,
      sampleColumns,
      potentialBranchColumns,
      sampleData
    });
  } catch (error) {
    console.error('Error checking sign_orders table:', error);
    return NextResponse.json({ error: 'Failed to check sign_orders table' }, { status: 500 });
  }
}
