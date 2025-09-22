import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { data: bids, error } = await supabase
            .from("estimate_complete")
            .select("*");

        if (error) {
            console.error("Error fetching bids:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedBids = await Promise.all(
            bids.map(async (bid) => {
                let contractorInfo = {};

                if (bid.contract_name) {
                    const { data: contract, error: contractError } = await supabase
                        .from("contractors")
                        .select("*")
                        .eq("name", bid.contract_name)
                        .single();

                    if (!contractError && contract) {
                        contractorInfo = {
                            contractor_id: contract.id,
                            contractor_name: contract.name,
                            contractor_email: contract.email,
                            contractor_phone: contract.main_phone,
                            contractor_address: `${contract.address || ""} ${contract.city || ""}, ${contract.state || ""} ${contract.zip || ""}`,
                        };
                    }
                }

                return {
                    ...bid,
                    ...contractorInfo,
                };
            })
        );

        return NextResponse.json({ data: formattedBids });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
