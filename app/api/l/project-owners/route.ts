import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const [ownersResponse, jobsResponse] = await Promise.all([
      supabase.from("owners").select("name").order("name"),
      supabase
        .from("jobs_l")
        .select("project_owner")
        .not("project_owner", "is", null),
    ]);

    if (ownersResponse.error) {
      return NextResponse.json(
        { success: false, error: ownersResponse.error.message },
        { status: 500 }
      );
    }

    if (jobsResponse.error) {
      return NextResponse.json(
        { success: false, error: jobsResponse.error.message },
        { status: 500 }
      );
    }

    const ownerNames = new Set<string>();

    (ownersResponse.data || []).forEach((owner) => {
      const name = owner.name?.trim();
      if (name) ownerNames.add(name);
    });

    (jobsResponse.data || []).forEach((job) => {
      const name = job.project_owner?.trim();
      if (name) ownerNames.add(name);
    });

    return NextResponse.json({
      success: true,
      data: Array.from(ownerNames)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ name })),
    });
  } catch (error) {
    console.error("Error fetching project owners:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
