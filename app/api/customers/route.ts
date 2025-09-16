import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    // Obtenemos el max ID para generar uno nuevo
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
        display_name: body.displayName,
        customer_number: body.customerNumber,
        web: body.url,
        main_phone: body.mainPhone,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        payment_terms: body.paymentTerms,
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