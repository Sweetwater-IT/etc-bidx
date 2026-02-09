import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const { data: maxIdData, error: maxIdError } = await supabase
      .from('contractors')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (maxIdError) throw maxIdError;

    const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

    const { data, error } = await supabase
      .from('contractors')
      .insert([{
        id: newId,
        name: body.name,
        display_name: body.display_name,
        customer_number: body.customer_number,
        web: body.url,
        main_phone: body.main_phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        payment_terms: body.payment_terms,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Customer created successfully',
      customer: data,
      ok: true
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}