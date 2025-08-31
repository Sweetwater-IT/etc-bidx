import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: jobsList, error: jobsError } = await supabase
      .from("jobs_list")
      .select("*")
      .eq("archived", false); 
    if (jobsError) throw jobsError;

    const { data: bids, error: bidsError } = await supabase
      .from("bid_estimates")
      .select("id, contract_number");
    if (bidsError) throw bidsError;

    const allIds = bids.map(b => b.id);

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
      .in("bid_estimate_id", allIds);
    if (entriesError) throw entriesError;

    const { data: permEntries, error: permError } = await supabase
      .from("permanent_signs_entries")
      .select(`
        *,
        permanent_signs:permanent_signs!left(*)
      `)
      .in("bid_estimate_id", allIds);
    if (permError) throw permError;

    const jobsWithSigns = jobsList.map(job => {
      const bid = bids.find(b => b.contract_number === job.contract_number);
      const jobPermEntries = bid ? permEntries.filter(p => p.bid_estimate_id === bid.id) : [];
      const jobEntries = bid ? entries.filter(e => e.bid_estimate_id === bid.id) : [];

      const phases = jobEntries
        .flatMap(entry => entry.mpt_phases || [])
        .map(phase => ({
          id: phase.id,
          name: phase.name,
          mpt_primary_signs: phase.mpt_primary_signs || [],
          mpt_secondary_signs: phase.mpt_secondary_signs || [],
        }))
        .filter(phase => (phase.mpt_primary_signs.length + phase.mpt_secondary_signs.length) > 0);

      return {
        id: job.id,
        label: job.job_number ? `${job.job_number} - ${job.contract_number}` : job.contract_number,
        status: "job",
        phases,
        permanent_signs_entries: jobPermEntries
      };
    });

    const bidsWithSigns = bids.map(bid => {
      const bidEntries = entries.filter(e => e.bid_estimate_id === bid.id);
      const bidPermEntries = permEntries.filter(p => p.bid_estimate_id === bid.id);

      const phases = bidEntries
        .flatMap(entry => entry.mpt_phases || [])
        .map(phase => ({
          id: phase.id,
          name: phase.name,
          mpt_primary_signs: phase.mpt_primary_signs || [],
          mpt_secondary_signs: phase.mpt_secondary_signs || [],
        }))
        .filter(phase => (phase.mpt_primary_signs.length + phase.mpt_secondary_signs.length) > 0);

      return {
        id: bid.id,
        label: bid.contract_number,
        status: "bid",
        phases,
        permanent_signs_entries: bidPermEntries
      };
    });

    const combined = [...jobsWithSigns, ...bidsWithSigns].filter(item => item.phases.length > 0);

    return NextResponse.json({ success: true, data: combined });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error fetching jobs and bids with signs",
        error: String(err),
      },
      { status: 500 }
    );
  }
}