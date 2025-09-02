import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const contractNumber = url.searchParams.get("contract_number");

        if (!contractNumber) {
            return NextResponse.json(
                { success: false, message: "contract_number is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("bid_estimates")
            .select("*")
            .eq("contract_number", contractNumber)
            .limit(1);

        if (error) {
            return NextResponse.json(
                { success: false, message: "Error checking contract number", error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (err) {
        return NextResponse.json(
            { success: false, message: "Unexpected error", error: String(err) },
            { status: 500 }
        );
    }
}
