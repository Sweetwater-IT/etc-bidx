import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 📌 Estimates con county
    const { data: estimates, error: estimatesError } = await supabase
      .from("bid_estimates")
      .select(`
        id,
        contract_number,
        admin_data_entries!left (
          county
        )
      `)
      .order("created_at", { ascending: true });

    if (estimatesError) {
      console.error("Error fetching estimates:", estimatesError);
      return NextResponse.json({ error: estimatesError.message }, { status: 500 });
    }

    // 📌 Jobs con job_number y branch_code
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(`
        id,
        job_numbers (
          job_number,
          branch_code
        )
      `)
      .order("created_at", { ascending: true });

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    // 🔄 Normalizar estimates
    const estimatesWithCounty =
      estimates?.map((estimate) => {
        const adminEntry = Array.isArray(estimate.admin_data_entries)
          ? estimate.admin_data_entries[0]
          : estimate.admin_data_entries;

        return {
          id: estimate.id,
          contract_number: estimate.contract_number,
          county: adminEntry?.county || "Unknown",
        };
      }) || [];

    // 🔄 Normalizar jobs con branch
    const jobsWithBranch =
      jobs?.map((job) => {
        const jobNumberEntry = Array.isArray(job.job_numbers)
          ? job.job_numbers[0]
          : job.job_numbers;

        return {
          id: job.id,
          job_number: jobNumberEntry?.job_number || "Unknown",
          branch:
            jobNumberEntry?.branch_code === "10"
              ? "Hatfield"
              : jobNumberEntry?.branch_code === "20"
              ? "Turbotville"
              : "Bedford",
        };
      }) || [];

    return NextResponse.json({
      estimates: estimatesWithCounty,
      jobs: jobsWithBranch,
    });
  } catch (error) {
    console.error("Error in estimate-job-data API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
