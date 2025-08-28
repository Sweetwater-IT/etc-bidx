import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        const { search } = Object.fromEntries(request.nextUrl.searchParams);

        const baseQuery = supabase
            .from('sale_items')
            .select('item_number, name, vendor, quantity, quote_price, markup_percentage');

        // Aplica filtro si search existe
        const query = search
            ? baseQuery.ilike('item_number', `%${search}%`)
            : baseQuery;

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching sale items:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ items: data ?? [] }, { status: 200 });
    } catch (error) {
        console.error("Error in sale-items fetch API:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
