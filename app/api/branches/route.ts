// app/api/branches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderBy = searchParams.get('orderBy') || 'name'
    const ascending = searchParams.get('ascending') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    const query = supabase
      .from('branches')
      .select('id,name,address,shop_rate', { count: 'exact' })
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch branches', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
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
    const { name, address, shop_rate } = body

    if (!name || !address || shop_rate === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('branches')
      .insert({ name, address, shop_rate })
      .select()
      .single()

    if (error) {
      console.log("error", error)
      return NextResponse.json(
        { success: false, message: 'Failed to create branch', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    )
  }
}