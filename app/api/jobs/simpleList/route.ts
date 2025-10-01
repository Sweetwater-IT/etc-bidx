import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabase
            .from("jobs_complete")
            .select("*");

        if (error) {
            console.error("Error fetching jobs:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedJobs = await Promise.all(
            data.map(async (job) => {
                let contractorInfo = {};

                if (job.id) {
                    console.log('el job id es', job.id);

                    const { data: p_metadata, error: pm_tError } = await supabase
                        .from("project_metadata")
                        .select(`
                            *,
                            contractors (
                            id,
                            name,
                            address
                            )
                        `)
                        .eq("job_id", job.id)
                        .maybeSingle();

                    if (!pm_tError && p_metadata) {
                        contractorInfo = {
                            customer: p_metadata?.contractors?.id || "",
                            customer_name: p_metadata?.contractors?.name || "",
                            customer_contact: p_metadata.project_manager || "",
                            customer_email: p_metadata.pm_email || "",
                            customer_phone: p_metadata.pm_phone || "",
                            customer_address: p_metadata?.contractors?.address
                        };
                    }
                }

                return {
                    ...job,
                    ...contractorInfo,
                };
            })
        );

        return NextResponse.json({ data: formattedJobs });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

