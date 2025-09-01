import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
   
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("bid_estimates")
      .select(`
        id,
        contract_number,
        status,
        notes,
        total_revenue,
        total_cost,
        total_gross_profit,
        admin_data_entries:admin_data_entries!bid_estimate_id (
          id,
          contract_number,
          county,
          sr_route,
          location,
          start_date,
          end_date,
          estimator,
          owner,
          dbe,
          rated,
          emergency_job,
          emergency_fields,
          fuel_cost_per_gallon,
          ow_travel_time_mins,
          ow_mileage,
          winter_start,
          winter_end
        )
      `)
      .eq("id", id)
      .maybeSingle(); 

    if (error) {
      console.error(" Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...data,
      admin_data: data?.admin_data_entries || null,
    });
  } catch (err: any) {
    console.error(" Unexpected error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to fetch estimate" },
      { status: 500 }
    );
  }
}
