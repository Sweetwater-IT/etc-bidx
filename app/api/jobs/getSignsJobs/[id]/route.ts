import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const formatedSign = (signs: any[]) => {
    return signs.map((sign) => ({
        ...sign,
        associatedStructure: sign.associated_structure
    }))
}

export async function GET(req: Request,
    context: { params: any }

) {
    const resolvedParams = await context.params;
    const jobNumber = resolvedParams.id;
    try {
        const { data: job, error: jobError } = await supabase
            .from("jobs_list")
            .select("*")
            .eq("job_number", jobNumber)
            .maybeSingle();

        if (jobError) throw jobError;

        if (!job) {
            return NextResponse.json({
                success: true,
                data: {
                    id: null,
                    label: jobNumber,
                    status: "job",
                    phases: [],
                    permanent_signs_entries: [],
                },
            });
        }

        const { data: bid, error: bidError } = await supabase
            .from("bid_estimates")
            .select("id, contract_number")
            .eq("contract_number", job.contract_number)
            .maybeSingle();

        if (bidError) throw bidError;

        if (!bid) {
            return NextResponse.json({
                success: true,
                data: {
                    id: job.id,
                    label: job.job_number ? `${job.job_number} - ${job.contract_number}` : job.contract_number,
                    status: "job",
                    phases: [],
                    permanent_signs_entries: [],
                },
            });
        }

        const { data: entries, error: entriesError } = await supabase
            .from("mpt_rental_entries")
            .select(`
        *,
        mpt_phases!left (
          *,
          mpt_primary_signs!left (*),
          mpt_secondary_signs!left (*)
        )
      `)
            .eq("bid_estimate_id", bid.id);

        if (entriesError) throw entriesError;

        const { data: permEntries, error: permError } = await supabase
            .from("permanent_signs_entries")
            .select(`
        *,
        permanent_signs:permanent_signs!left(*)
      `)
            .eq("bid_estimate_id", bid.id);

        if (permError) throw permError;

        const phases = (entries || [])
            .flatMap(entry => entry.mpt_phases || [])
            .map(phase => ({
                id: phase.id,
                name: phase.name,
                mpt_primary_signs: formatedSign(phase.mpt_primary_signs) || [],
                mpt_secondary_signs: formatedSign(phase.mpt_secondary_signs) || [],
            }))
            .filter(phase => (phase.mpt_primary_signs.length + phase.mpt_secondary_signs.length) > 0);

        const result = {
            id: job.id,
            label: job.job_number ? `${job.job_number} - ${job.contract_number}` : job.contract_number,
            status: "job",
            phases,
            permanent_signs_entries: permEntries || []
        };

        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json(
            {
                success: false,
                message: "Unexpected error fetching job by job_number",
                error: err,
            },
            { status: 500 }
        );
    }
}
