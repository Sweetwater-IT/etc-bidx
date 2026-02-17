import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest
) {
  const { searchParams } = new URL(request.url);
  const counts = searchParams.get('counts');

  if (counts === 'true') {
    try {
      console.log('API: Fetching customer counts...');

      // Get counts for each payment term
      const { data: allCount, error: allError } = await supabase
        .from('contractors')
        .select('id', { count: 'exact', head: true });

      console.log('API: All count query result:', { allCount, allError });

      const { data: onePercentTenCount, error: onePercentTenError } = await supabase
        .from('contractors')
        .select('id', { count: 'exact', head: true })
        .eq('payment_terms', '1%10 NET 30');

      console.log('API: 1%10 count query result:', { onePercentTenCount, onePercentTenError });

      const { data: codCount, error: codError } = await supabase
        .from('contractors')
        .select('id', { count: 'exact', head: true })
        .eq('payment_terms', 'COD');

      const { data: ccCount, error: ccError } = await supabase
        .from('contractors')
        .select('id', { count: 'exact', head: true })
        .eq('payment_terms', 'CC');

      const { data: net15Count, error: net15Error } = await supabase
        .from('contractors')
        .select('id', { count: 'exact', head: true })
        .eq('payment_terms', 'NET15');

      const { data: net30Count, error: net30Error } = await supabase
        .from('contractors')
        .select('id', { count: 'exact', head: true })
        .eq('payment_terms', 'NET30');

      if (allError || onePercentTenError || codError || ccError || net15Error || net30Error) {
        console.error('API: Count query errors:', { allError, onePercentTenError, codError, ccError, net15Error, net30Error });
        throw new Error('Error fetching counts');
      }

      const countsResult = {
        success: true,
        counts: {
          all: allCount || 0,
          '1%10': onePercentTenCount || 0,
          COD: codCount || 0,
          CC: ccCount || 0,
          NET15: net15Count || 0,
          NET30: net30Count || 0
        }
      };

      console.log('API: Returning counts:', countsResult);
      return NextResponse.json(countsResult);
    } catch (error: any) {
      console.error('Error fetching customer counts:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // If not requesting counts, return regular customer list
  // (This would be the existing GET logic, but for now we'll just return an error)
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 }
  );
}

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

    console.log('About to insert contractor with data:', {
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
      bill_to_street: body.billToSameAsMain ? body.address : body.bill_to_street_address,
      bill_to_city: body.billToSameAsMain ? body.city : body.bill_to_city,
      bill_to_state: body.billToSameAsMain ? body.state : body.bill_to_state,
      bill_to_zip: body.billToSameAsMain ? body.zip : body.bill_to_zip_code,
      payment_terms: body.payment_terms,
      would_like_to_apply_for_credit: body.would_like_to_apply_for_credit || false,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      active: true
    });

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
        bill_to_street: body.billToSameAsMain ? body.address : body.bill_to_street_address,
        bill_to_city: body.billToSameAsMain ? body.city : body.bill_to_city,
        bill_to_state: body.billToSameAsMain ? body.state : body.bill_to_state,
        bill_to_zip: body.billToSameAsMain ? body.zip : body.bill_to_zip_code,
        payment_terms: body.payment_terms,
        would_like_to_apply_for_credit: body.would_like_to_apply_for_credit || false,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        active: true
      }])
      .select()
      .single();

    console.log('Insert result:', { data, error });

    if (error) throw error;

    console.log('Contractor inserted successfully, ID:', data?.id);

    // Create contacts if provided
    const contactsToCreate: Array<{
      contractor_id: number;
      name: string;
      role: string;
      email?: string;
      phone?: string;
    }> = [];

    // Person Ordering contact
    if (body.personOrderingName?.trim()) {
      contactsToCreate.push({
        contractor_id: newId,
        name: body.personOrderingName,
        role: body.personOrderingTitle || 'PERSON ORDERING',
        email: undefined,
        phone: undefined
      });
    }

    // Primary Contact
    if (body.primaryContactName?.trim()) {
      contactsToCreate.push({
        contractor_id: newId,
        name: body.primaryContactName,
        role: 'PRIMARY CONTACT',
        email: body.primaryContactEmail || undefined,
        phone: body.primaryContactPhone || undefined
      });
    }

    // Project Manager contact
    if (body.projectManagerName?.trim()) {
      contactsToCreate.push({
        contractor_id: newId,
        name: body.projectManagerName,
        role: 'PROJECT MANAGER',
        email: body.projectManagerEmail || undefined,
        phone: body.projectManagerPhone || undefined
      });
    }

    // Create contacts in sequence
    for (const contactData of contactsToCreate) {
      try {
        const { error: contactError } = await supabase
          .from('customer_contacts')
          .insert([{
            contractor_id: contactData.contractor_id,
            name: contactData.name,
            role: contactData.role,
            email: contactData.email,
            phone: contactData.phone,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }]);

        if (contactError) {
          console.error('Error creating contact:', contactError);
          // Continue with other contacts even if one fails
        }
      } catch (contactError) {
        console.error('Error creating contact:', contactError);
        // Continue with other contacts even if one fails
      }
    }

    return NextResponse.json({
      message: 'Customer created successfully',
      customer: data,
      ok: true
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating customer:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.details || null,
        hint: error.hint || null
      },
      { status: 500 }
    );
  }
}
