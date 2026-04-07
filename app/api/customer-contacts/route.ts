import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractor_id, name, role, email, phone, quoteId } = body;

    if (!contractor_id) {
      return NextResponse.json(
        { error: "contractor_id is required" },
        { status: 400 }
      );
    }

    const { data: contact, error } = await supabase
      .from("customer_contacts")
      .insert({
        contractor_id,
        name: name || null,
        role: role || null,
        email,
        phone: phone || null,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating customer contact:", error);
      return NextResponse.json(
        { error: "Failed to create customer contact" },
        { status: 500 }
      );
    }

    if (quoteId && contact?.id) {
      const { error: linkError } = await supabase
        .from("quote_recipients")
        .insert({
          quote_id: quoteId,
          customer_contacts_id: contact.id,
          email: contact.email,
          point_of_contact: true,
        });

      if (linkError) {
        console.warn("Contact created, but failed to link to quote:", linkError);
      }
    }

    return NextResponse.json({ status: 201, success: true, data: contact });
  } catch (err) {
    console.error("Error in customer contact creation:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
