import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ALLOWED_STATUSES = new Set([
  "new",
  "under_review",
  "awaiting_signs",
  "materials_ready",
  "build_queue",
  "in_build",
  "ready_for_pm",
  "completed",
  "rejected",
  "superseded",
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Build request ID is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.status === "string") {
      if (!ALLOWED_STATUSES.has(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      updates.status = body.status;
      if (body.status === "in_build") {
        updates.build_started_at = new Date().toISOString();
      }
      if (body.status === "completed") {
        updates.completed_at = new Date().toISOString();
      }
    }

    if (typeof body.materials_received === "boolean") {
      updates.materials_received = body.materials_received;
      if (body.materials_received) {
        updates.signs_ready_at = new Date().toISOString();
      }
    }

    if (typeof body.builder_notes === "string") {
      updates.builder_notes = body.builder_notes;
    }

    if (typeof body.inventory_notes === "string") {
      updates.inventory_notes = body.inventory_notes;
    }

    if (typeof body.rejection_reason === "string") {
      updates.rejection_reason = body.rejection_reason;
    }

    if (typeof body.archive === "boolean") {
      updates.archived_at = body.archive ? new Date().toISOString() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("build_requests_l")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating build request:", error);
      return NextResponse.json({ error: "Failed to update build request" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in build request PATCH API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
