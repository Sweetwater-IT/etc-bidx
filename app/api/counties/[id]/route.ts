import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: any
) {
  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  
  if (isNaN(id)) {
    return NextResponse.json(
      { success: false, message: 'Invalid ID parameter' },
      { status: 400 }
    )
  }

  try {
    const updates = await request.json()
    const { name, market, flagging_base_rate, flagging_fringe_rate, flagging_rate } = updates

    // Validate required fields
    if (!name || !market) {
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
      .eq('id', id)
      .single()

    if (fetchError || !existingCounty) {
      return NextResponse.json(
        { success: false, message: 'County not found' },
        { status: 404 }
      )
    }

    // Check if another county with same name exists
    const { data: duplicateCounty } = await supabase
      .from('counties')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single()

    if (duplicateCounty) {
      return NextResponse.json(
        { success: false, message: 'Another county with this name already exists' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('counties')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to update county', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: any
) {
  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  
  if (isNaN(id)) {
    return NextResponse.json(
      { success: false, message: 'Invalid ID parameter' },
      { status: 400 }
    )
  }

  try {
    // Check if county exists
    const { data: existingCounty, error: fetchError } = await supabase
      .from('counties')
      .select('id')
      .eq('id', id)
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
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to archive county', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'County archived successfully' })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    )
  }
} 