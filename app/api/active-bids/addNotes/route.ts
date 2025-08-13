import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const bidIdParam = request.nextUrl.searchParams.get('bid_id');

    if (!bidIdParam) {
      return NextResponse.json(
        { success: false, message: 'bid_id query parameter is required' },
        { status: 400 }
      );
    }

    const bid_id = parseInt(bidIdParam, 10);

    if (isNaN(bid_id)) {
      return NextResponse.json(
        { success: false, message: 'bid_id must be a valid number' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bid_notes')
      .select('id, bid_id, text, created_at, user_email')
      .eq('bid_id', bid_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bid notes', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bid_id, text, user_email } = body;

    if (!bid_id || !text || !user_email) {
      return NextResponse.json(
        { success: false, message: 'bid_id and text are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bid_notes')
      .insert([{ bid_id, text, user_email }])
      .select('id, text, created_at, user_email');

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to add note', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, text } = body;

    if (!id || !text) {
      return NextResponse.json(
        { success: false, message: 'id and text are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bid_notes')
      .update({
        text,
        created_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, text, created_at, user_email');

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to update note', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('bid_notes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete note', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Note deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}
