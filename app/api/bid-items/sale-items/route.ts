import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        console.log("API route /api/bid-items/sale-items called");
        const { search } = Object.fromEntries(request.nextUrl.searchParams);
        console.log(`Search parameter: ${search || 'not provided'}`);
        const baseQuery = supabase
            .from('master_sale_items')
            .select('id, item_number, display_name, uom, notes, item_description');
        const query = search
            ? baseQuery.ilike('item_number', `%${search}%`)
            : baseQuery;
        console.log("Executing Supabase query...");
        const { data, error } = await query;
        if (error) {
            console.error("Error fetching sale items:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        const mappedData = data?.map(item => ({
            ...item,
            name: item.display_name,
        })) ?? [];
        console.log(`Successfully fetched ${mappedData.length} sale items.`);
        console.log("Data fetched:", mappedData);
        return NextResponse.json({ items: mappedData }, { status: 200 });
    } catch (error) {
        console.error("Error in sale-items fetch API:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
