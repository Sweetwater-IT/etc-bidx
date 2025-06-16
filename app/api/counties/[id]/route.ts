import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if county exists
    const { data: existingCounty, error: fetchError } = await supabase
      .from('counties')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingCounty) {
      return NextResponse.json(
        { success: false, message: 'County not found' },
        { status: 404 }
      )
    }

    // Check if another county with same name and state exists
    const { data: duplicateCounty } = await supabase
      .from('counties')
      .select('id')
      .eq('name', name)
      .eq('state', state)
      .neq('id', params.id)
      .single()

    if (duplicateCounty) {
      return NextResponse.json(
        { success: false, message: 'Another county with this name and state already exists' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('counties')
      .update({
        name,
        state,
        market,
        flagging_base_rate,
        flagging_fringe_rate,
        flagging_rate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update county', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'County updated successfully',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if county exists
    const { data: existingCounty, error: fetchError } = await supabase
      .from('counties')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingCounty) {
      return NextResponse.json(
        { success: false, message: 'County not found' },
        { status: 404 }
      )
    }

    // Instead of deleting, we'll soft delete by updating a deleted_at timestamp
    const { error } = await supabase
      .from('counties')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to archive county', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'County archived successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    )
  }
} 