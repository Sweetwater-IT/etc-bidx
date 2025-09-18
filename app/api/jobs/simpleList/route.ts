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

                if (job.contractor_name) {
                    const { data: contract, error: contractError } = await supabase
                        .from("contractors")
                        .select("*")
                        .eq("name", job.contractor_name)
                        .single();

                    if (!contractError && contract) {
                        contractorInfo = {
                            customer: contract.id || "",
                            customer_name: contract.name || "",
                            customer_email: contract.email || "",
                            customer_phone: contract.main_phone || "",
                            customer_address: `${contract.address || ""} ${contract.city || ""}, ${contract.state || ""} ${contract.zip || ""}`,
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

