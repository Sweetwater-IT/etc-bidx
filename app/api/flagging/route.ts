import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('flagging')
            .select('*');

        if (error) {
            console.error(error)
            return NextResponse.json(
                { success: false, message: `Failed to fetch flagging data`, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { success: false, message: 'Unexpected error', error: String(error) },
            { status: 500 }
        );
    }
}