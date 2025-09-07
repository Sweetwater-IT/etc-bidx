import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const bidId = url.searchParams.get("id");

        if (!bidId) {
            return NextResponse.json(
                { message: "bidId ID is required" },
                { status: 400 }
            );
        }

        if (!bidId) {
            return NextResponse.json({ success: false, message: 'bidId is required' }, { status: 400 });
        }

        const { data, error } = await supabase.rpc('delete_bid_and_relations', { p_bid_id: bidId });

        if (error) {
            return NextResponse.json({ success: false, message: 'Failed to delete bid', error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Bid deleted successfully' });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Unexpected error', error: String(err) }, { status: 500 });
    }
}