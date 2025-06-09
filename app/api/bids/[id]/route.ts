import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { NextRequest, NextResponse } from "next/server";

type AvailableJobUpdate =
  Database["public"]["Tables"]["available_jobs"]["Update"];

export async function GET(request: NextRequest, { params }: any) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("available_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, message: "Bid not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch bid",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: any) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Format dates consistently to YYYY-MM-DD format for all date fields
    // This ensures consistency between table view and details drawer
    // Use direct string manipulation to avoid timezone issues
    if (typeof body.due_date === "string") {
      // If it's already in YYYY-MM-DD format, keep it as is
      if (body.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in correct format, do nothing
      } else {
        // Otherwise, parse and format carefully to avoid timezone issues
        const parts = new Date(body.due_date).toISOString().split("T")[0].split("-");
        body.due_date = `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }

    if (typeof body.letting_date === "string") {
      // If it's already in YYYY-MM-DD format, keep it as is
      if (body.letting_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in correct format, do nothing
      } else {
        // Otherwise, parse and format carefully to avoid timezone issues
        const parts = new Date(body.letting_date).toISOString().split("T")[0].split("-");
        body.letting_date = `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }

    if (typeof body.entry_date === "string") {
      // If it's already in YYYY-MM-DD format, keep it as is
      if (body.entry_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in correct format, do nothing
      } else {
        // Otherwise, parse and format carefully to avoid timezone issues
        const parts = new Date(body.entry_date).toISOString().split("T")[0].split("-");
        body.entry_date = `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }
    
    // Log the formatted dates for debugging
    console.log('Updating bid with formatted dates:', {
      id,
      letting_date: body.letting_date,
      due_date: body.due_date,
      entry_date: body.entry_date
    });

    // Add updated_at timestamp
    const updates: AvailableJobUpdate = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("available_jobs")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update bid",
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, message: "Bid not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bid updated successfully",
      data: data[0],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Check if the bid exists first
    const { error: checkError } = await supabase
      .from("available_jobs")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, message: "Bid not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to check bid existence",
          error: checkError.message,
        },
        { status: 500 }
      );
    }

    // Delete the bid
    const { error } = await supabase
      .from("available_jobs")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to delete bid",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Bid deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID format" },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    // Format dates consistently to YYYY-MM-DD format for all date fields
    // This ensures consistency between table view and details drawer
    const formattedLettingDate = data.letting_date ? new Date(data.letting_date).toISOString().split('T')[0] : null;
    const formattedDueDate = data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : null;
    const formattedEntryDate = data.entry_date ? new Date(data.entry_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Log the formatted dates for debugging
    console.log('PUT updating bid with formatted dates:', {
      id,
      letting_date: formattedLettingDate,
      due_date: formattedDueDate,
      entry_date: formattedEntryDate
    });

    const { error } = await supabase
      .from("available_jobs")
      .update({
        contract_number: data.contract_number,
        requestor: data.requestor,
        owner: data.owner,
        county: data.county,
        branch: data.branch,
        location: data.location,
        platform: data.platform,
        status: data.status,
        letting_date: formattedLettingDate,
        due_date: formattedDueDate,
        entry_date: formattedEntryDate,
        mpt: data.mpt,
        flagging: data.flagging,
        perm_signs: data.perm_signs,
        equipment_rental: data.equipment_rental,
        other: data.other,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating bid:", error);
      return NextResponse.json(
        { message: "Failed to update bid" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Bid updated successfully" });
  } catch (error) {
    console.error("Error in PUT /api/bids/[id]:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
