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
