import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jobId, customerContractNumber, projectManager, pmEmail, pmPhone, contractorId } = body;
        
        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        const { error } = await supabase    
            .from("project_metadata")
            .update({
                customer_contract_number: customerContractNumber,
                project_manager: projectManager,
                pm_email: pmEmail,
                pm_phone: pmPhone,
                contractor_id: contractorId
            })
            .eq("job_id", jobId);

        if (error) {
            console.error(error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
