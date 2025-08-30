import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: availableJobs, error: jobsError } = await supabase
      .from("available_jobs")
      .select("*")
      .eq("archived", false);

    if (jobsError) throw jobsError;
    if (!availableJobs || availableJobs.length === 0)
      return NextResponse.json({ success: true, data: [] });

    const contractNumbers = availableJobs.map(j => j.contract_number);

    const { data: bidEstimates, error: bidError } = await supabase
      .from("bid_estimates")
      .select("id, contract_number")
      .in("contract_number", contractNumbers);

    if (bidError) throw bidError;
    const bidEstimateIds = bidEstimates.map(b => b.id);

    const { data: linkedJobs, error: linkedJobsError } = await supabase
      .from("jobs")
      .select("id, estimate_id")
      .in("estimate_id", bidEstimateIds)
      .eq("archived", false);

    if (linkedJobsError) throw linkedJobsError;

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
      .in("bid_estimate_id", bidEstimateIds);

    if (entriesError) throw entriesError;

    const { data: permEntries, error: permError } = await supabase
      .from("permanent_signs_entries")
      .select(`
        *,
        permanent_signs:permanent_signs!left(*)
      `)
      .in("bid_estimate_id", bidEstimateIds);

    if (permError) throw permError;

    const jobsWithSigns = availableJobs.map(job => {
      const bid = bidEstimates.find(b => b.contract_number === job.contract_number);
      if (!bid) return { ...job, entries: [], permanent_signs_entries: [] };

      const jobPermEntries = permEntries.filter(p => p.bid_estimate_id === bid.id);

      const jobEntries = entries.filter(entry => entry.bid_estimate_id === bid.id);

      return {
        ...job,
        entries: jobEntries,
        permanent_signs_entries: jobPermEntries
      };
    });

    return NextResponse.json({ success: true, data: jobsWithSigns });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error fetching jobs with signs",
        error: String(err),
      },
      { status: 500 }
    );
  }
}
