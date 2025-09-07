import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    request: NextRequest
) {
    const url = new URL(request.url);
    const estimateId = url.searchParams.get("id");

    if (!estimateId) {
        return NextResponse.json(
            { message: "Estimate ID is required" },
            { status: 400 }
        );
    }

    if (!estimateId) {
        return NextResponse.json({ message: 'Estimate ID is required' }, { status: 400 });
    }

    try {
        const { error } = await supabase.rpc('delete_estimate_complete', { p_estimate_id: estimateId });

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Estimate deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error deleting estimate', error }, { status: 500 });
    }
}