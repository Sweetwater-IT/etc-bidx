import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const paginate = params.get('pagination') === 'true'

    if (!paginate) {
      const { data, error } = await supabase.from('flagging').select('*')
      if (error) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch flagging data', error: error.message },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true, data })
    }

    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '25')
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('flagging')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch flagging data', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize: limit,
        pageCount: count ? Math.ceil(count / limit) : 0,
        totalCount: count || 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, fuel_economy_mpg, truck_dispatch_fee, worker_comp, general_liability } = body

    if (
      fuel_economy_mpg === undefined ||
      truck_dispatch_fee === undefined ||
      worker_comp === undefined ||
      general_liability === undefined
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const insert = {
      fuel_economy_mpg,
      truck_dispatch_fee,
      worker_comp,
      general_liability,
    } as any

    if (id !== undefined) insert.id = id

    const { data, error } = await supabase.from('flagging').insert([insert]).select().single()

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to create flagging record', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    )
  }
}