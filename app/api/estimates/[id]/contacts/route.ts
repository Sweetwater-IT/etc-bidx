import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const estimateId = params.id;

  try {
    // 1️⃣ Buscar contractor_id desde project_metadata usando bid_estimate_id
    const { data: metadata, error: metaError } = await supabase
      .from("project_metadata")
      .select("contractor_id, contractors (id, name)")
      .eq("bid_estimate_id", estimateId)
      .maybeSingle();

    if (metaError) throw metaError;
    if (!metadata?.contractor_id) {
      return NextResponse.json([], { status: 200 });
    }

    // 2️⃣ Buscar contactos de ese contractor
    const { data: contacts, error: contactsError } = await supabase
      .from("customer_contacts")
      .select("id, name, email")
      .eq("contractor_id", metadata.contractor_id)
      .eq("is_deleted", false);

    if (contactsError) throw contactsError;

    // 3️⃣ Formatear respuesta
    const formatted = [
      {
        id: metadata.contractor_id,
        name: metadata.contractors?.[0]?.name || `Contractor ${metadata.contractor_id}`,
        emails: contacts.map((c) => c.email),
        names: contacts.map((c) => c.name),
      },
    ];

    return NextResponse.json(formatted, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error fetching estimate contacts:", err);
    return NextResponse.json(
      { error: "Failed to fetch estimate contacts", details: err.message },
      { status: 500 }
    );
  }
}
