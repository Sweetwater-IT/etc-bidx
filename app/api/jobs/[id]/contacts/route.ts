import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


type ContractorMeta = {
  contractor_id: number;
  contractors: { id: number; name: string } | null;
};

type Contact = {
  id: number;
  name: string;
  email: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
   
    const { data: metadata, error: metaError } = await supabase
      .from("project_metadata")
      .select("contractor_id, contractors (id, name)")
      .eq("job_id", jobId)
      .maybeSingle<ContractorMeta>(); 

    if (metaError) throw metaError;
    if (!metadata?.contractor_id) {
      return NextResponse.json([], { status: 200 });
    }

 
    const { data: contacts, error: contactsError } = await supabase
      .from("customer_contacts")
      .select("id, name, email")
      .eq("contractor_id", metadata.contractor_id)
      .eq("is_deleted", false);

    if (contactsError) throw contactsError;

  
    const formatted = [
      {
        id: metadata.contractor_id,
        name:
          metadata.contractors?.name ??
          `Contractor ${metadata.contractor_id}`,
        emails: (contacts as Contact[]).map((c) => c.email),
        names: (contacts as Contact[]).map((c) => c.name),
      },
    ];

    return NextResponse.json(formatted, { status: 200 });
  } catch (err: any) {
    console.error(" Error fetching job contacts:", err);
    return NextResponse.json(
      { error: "Failed to fetch job contacts", details: err.message },
      { status: 500 }
    );
  }
}
