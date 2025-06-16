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

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const query = supabase
      .from('counties')
      .select('id,name,state,market,flagging_base_rate,flagging_fringe_rate,flagging_rate', { count: 'exact' })
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch counties', error: error.message },
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
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, state, market, flagging_base_rate, flagging_fringe_rate, flagging_rate } = body

    // Validate required fields
    if (!name || !state || !market) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (isNaN(flagging_base_rate) || isNaN(flagging_fringe_rate) || isNaN(flagging_rate)) {
      return NextResponse.json(
        { success: false, message: 'Invalid rate values' },
        { status: 400 }
      )
    }

    // Check if county with same name and state already exists
    const { data: existingCounty } = await supabase
      .from('counties')
      .select('id')
      .eq('name', name)
      .eq('state', state)
      .single()

    if (existingCounty) {
      return NextResponse.json(
        { success: false, message: 'County with this name and state already exists' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('counties')
      .insert([
        {
          name,
          state,
          market,
          flagging_base_rate,
          flagging_fringe_rate,
          flagging_rate,
        },
      ])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create county', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'County created successfully',
      data 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    )
  }
} 