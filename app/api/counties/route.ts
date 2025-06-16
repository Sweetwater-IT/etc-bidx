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
      .select('id,name,market,flagging_base_rate,flagging_fringe_rate,flagging_rate,district,branch,labor_rate,fringe_rate,insurance,fuel,flagging_non_rated_target_gm,flagging_rated_target_gm', { count: 'exact' })
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
    const {
      name,
      market,
      flagging_base_rate,
      flagging_fringe_rate,
      flagging_rate,
      district,
      branch,
      labor_rate,
      fringe_rate,
      insurance,
      fuel,
      flagging_non_rated_target_gm,
      flagging_rated_target_gm,
    } = await request.json()

    // Validate required fields
    if (!name || !market || !district || !branch) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields (name, market, district, branch)' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (
      isNaN(flagging_base_rate) ||
      isNaN(flagging_fringe_rate) ||
      isNaN(flagging_rate) ||
      isNaN(district) ||
      isNaN(branch) ||
      isNaN(labor_rate) ||
      isNaN(fringe_rate) ||
      isNaN(insurance) ||
      isNaN(fuel) ||
      isNaN(flagging_non_rated_target_gm) ||
      isNaN(flagging_rated_target_gm)
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid numeric values for rates, district, branch, insurance or fuel' },
        { status: 400 }
      )
    }

    // Check if a county with the same name already exists
    const { data: existingCounty } = await supabase
      .from('counties')
      .select('id')
      .eq('name', name)
      .single()

    if (existingCounty) {
      return NextResponse.json(
        { success: false, message: 'A county with this name already exists.' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('counties')
      .insert({
        name,
        market,
        flagging_base_rate,
        flagging_fringe_rate,
        flagging_rate,
        district,
        branch,
        labor_rate,
        fringe_rate,
        insurance,
        fuel,
        flagging_non_rated_target_gm,
        flagging_rated_target_gm,
      })
      .select()
      .single()

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