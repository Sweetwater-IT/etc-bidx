import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body: any = req.json();

        const { data, error } = await supabase
            .from('daily_tracker_entries')
            .insert({
                sign_designation: body.signDesignation,
                dimension: body.dimension,
                quantity: body.quantity,
                created_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            throw error;
        }
        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
