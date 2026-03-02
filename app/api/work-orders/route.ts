import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { takeoff_id, title, description, wo_number, notes, contracted_or_additional, customer_poc_phone } = body;

    if (!takeoff_id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: takeoff_id and title' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        takeoff_id,
        title,
        description,
        wo_number,
        notes,
        contracted_or_additional: contracted_or_additional || 'contracted',
        customer_poc_phone,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work order:', error);
      return NextResponse.json(
        { error: 'Failed to create work order' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in work orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const takeoff_id = searchParams.get('takeoff_id');

    if (!takeoff_id) {
      return NextResponse.json(
        { error: 'Missing takeoff_id parameter' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('takeoff_id', takeoff_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching work orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch work orders' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in work orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}