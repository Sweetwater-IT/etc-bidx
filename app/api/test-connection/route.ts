import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test a simple query to check connection
    const { data, error } = await supabase
      .from('available_jobs')
      .select('*')
      .limit(5);
    
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Connection failed', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Supabase',
      recordCount: data.length,
      sampleData: data.length > 0 ? data[0] : null
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
