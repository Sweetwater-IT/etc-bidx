import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, items = [], comments, digital_signature } = body;

        const { data: quoteData, error: quoteError } = await supabase
            .from("quotes")
            .update({
                digital_signature: digital_signature,
                comments: comments,
                status: 'Accepted'
            })
            .eq("id", id)
            .select()
            .single();

        if (quoteError) {
            return NextResponse.json(
                { ok: false, message: "Failed to update quote", error: quoteError.message },
                { status: 500 }
            );
        }

        items.map(async (item) => {
            const { data: itemData, error: itemError } = await supabase
                .from("quote_items")
                .update({
                    confirmed: item.confirmed
                })
                .eq("id", item.id)
                .select()
                .single();

            if (itemError) throw new Error(itemError.message);
            return itemData;
        });

        return NextResponse.json({ ok: true, message: "Quote sended successfully" }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
    }
}
