import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const year = url.searchParams.get('year')
        const sequential = url.searchParams.get('sequential')

        const { data, error } = await supabase
            .from("job_numbers")
            .select(`
                id,
                job_number,
                year,
                sequential_number,
                jobs (
                id,
                project_status,
                billing_status,
                admin_data_entries (
                    contract_number,
                    start_date,
                    end_date
                ),
                project_metadata (
                    customer_contract_number,
                    contractors (
                    name
                    )
                )
                )
            `)
            .eq("year", year)
            .eq("sequential_number", sequential)
            .maybeSingle();

        if (error) {
            console.error(error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, exist: !!data, data });

    } catch (error) {
        console.error('Error in GET /api/jobs:', error);
        return NextResponse.json(
            { error: 'Unexpected error fetching jobs' },
            { status: 500 }
        );
    }
}