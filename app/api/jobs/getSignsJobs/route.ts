import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabase
            .from("jobs")
            .select(`
    id,
    job_number_id,
    bid_number,
    project_status,
    archived,
    deleted,
    mpt_rental_entries!mpt_rental_entries_job_id_fkey (
      id,
      mpt_phases!mpt_phases_mpt_rental_entry_id_fkey (
        id,
        name,
        mpt_primary_signs!mpt_primary_signs_phase_id_fkey (
          id,
          description,
          designation,
          quantity
        ),
        mpt_secondary_signs!mpt_secondary_signs_phase_id_fkey (
          id,
          description,
          designation
        )
      )
    )
  `)
            .or("archived.is.null,archived.eq.false") // <- incluye null y false
            .or("deleted.is.null,deleted.eq.false");  // <- igual para deleted

        if (error) {
            console.error("Error fetching jobs with signs:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const jobsWithSigns = (data || []).filter(job => {
            return job.mpt_rental_entries?.some(entry =>
                entry.mpt_phases?.some(phase =>
                    (phase.mpt_primary_signs && phase.mpt_primary_signs.length > 0) ||
                    (phase.mpt_secondary_signs && phase.mpt_secondary_signs.length > 0)
                )
            );
        });

        return NextResponse.json({ data: jobsWithSigns });
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json(
            { error: "Unexpected error fetching jobs with signs" },
            { status: 500 }
        );
    }
}
