import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {

        const { data, error, count } = await supabase
            .from('permanent_sign_items')
            .select('*')

        if (error) {
            return NextResponse.json(
                { success: false, message: 'Failed to fetch permanent_sign_items data', error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Unexpected error', error: String(error) },
            { status: 500 }
        )
    }
}