import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type AvailableJobUpdate = Database['public']['Tables']['available_jobs']['Update'];

// GET: Fetch a specific bid by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('available_jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Bid not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bid', error: error.message },
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

// PATCH: Update a specific bid by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Format dates if they are provided as strings
    if (typeof body.due_date === 'string') {
      body.due_date = new Date(body.due_date).toISOString();
    }
    
    if (typeof body.letting_date === 'string') {
      body.letting_date = new Date(body.letting_date).toISOString();
    }
    
    if (typeof body.entry_date === 'string') {
      // For entry_date, we only need the date part
      body.entry_date = new Date(body.entry_date).toISOString().split('T')[0];
    }
    
    // Add updated_at timestamp
    const updates: AvailableJobUpdate = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('available_jobs')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to update bid', error: error.message },
        { status: 500 }
      );
    }
    
    if (data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Bid not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Bid updated successfully', data: data[0] });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific bid by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // Check if the bid exists first
    const { error: checkError } = await supabase
      .from('available_jobs')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Bid not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to check bid existence', error: checkError.message },
        { status: 500 }
      );
    }
    
    // Delete the bid
    const { error } = await supabase
      .from('available_jobs')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete bid', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Bid deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
