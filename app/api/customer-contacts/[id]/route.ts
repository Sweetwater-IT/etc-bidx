import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by updating the is_deleted flag
    const { data, error } = await supabase
      .from('customer_contacts')
      .update({ is_deleted: true, updated: new Date().toISOString() })
      .eq('id', contactId)
      .select();

    if (error) {
      console.error('Error soft deleting contact:', error);
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Contact deleted successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error deleting contact:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
