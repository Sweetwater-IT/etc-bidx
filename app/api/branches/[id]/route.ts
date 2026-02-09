import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
    request: NextRequest,
    { params }: any
) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
        return NextResponse.json(
            { success: false, message: "Invalid ID parameter" },
            { status: 400 }
        );
    }

    try {
        const updates = await request.json();
        const { data, error } = await supabase
            .from("branches")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to update branch",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Unexpected error",
                error: String(error),
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: any
) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
        return NextResponse.json(
            { success: false, message: "Invalid ID parameter" },
            { status: 400 }
        );
    }

    try {
        const { error } = await supabase.from("branches").delete().eq("id", id);

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to delete branch",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: "Branch deleted" });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Unexpected error",
                error: String(error),
            },
            { status: 500 }
        );
    }
}
