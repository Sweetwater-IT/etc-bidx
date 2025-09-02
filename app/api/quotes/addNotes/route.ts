import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface INote {
  id: string;
  text: string;
  user_email: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    const quoteIdParam = request.nextUrl.searchParams.get("quote_id");
    if (!quoteIdParam)
      return NextResponse.json({ success: false, message: "quote_id query parameter is required" }, { status: 400 });

    const quote_id = parseInt(quoteIdParam, 10);
    if (isNaN(quote_id))
      return NextResponse.json({ success: false, message: "quote_id must be a valid number" }, { status: 400 });

    const { data: quoteData, error } = await supabase
      .from("quotes")
      .select("notes")
      .eq("id", quote_id)
      .single();

    if (error) throw error;

    const notes: INote[] = quoteData.notes ? JSON.parse(quoteData.notes) : [];
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unexpected error", error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { quote_id, text, user_email, timestamp } = await request.json();
    if (!quote_id || !text || !user_email || !timestamp)
      return NextResponse.json({ success: false, message: "quote_id, text, user_email and timestamp are required" }, { status: 400 });

    const note: INote = { id: crypto.randomUUID(), text, user_email, timestamp };

    const { data: quoteData, error: fetchError } = await supabase
      .from("quotes")
      .select("notes")
      .eq("id", quote_id)
      .single();
    if (fetchError) throw fetchError;

    const existingNotes: INote[] = quoteData.notes ? JSON.parse(quoteData.notes) : [];
    const updatedNotes = [...existingNotes, note];

    const { error: updateError } = await supabase
      .from("quotes")
      .update({ notes: JSON.stringify(updatedNotes) })
      .eq("id", quote_id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, data: note }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unexpected error", error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { quote_id, note_id, text } = await request.json();
    if (!quote_id || !note_id || !text)
      return NextResponse.json({ success: false, message: "quote_id, note_id and text are required" }, { status: 400 });

    const { data: quoteData, error: fetchError } = await supabase
      .from("quotes")
      .select("notes")
      .eq("id", quote_id)
      .single();
    if (fetchError) throw fetchError;

    const existingNotes: INote[] = quoteData.notes ? JSON.parse(quoteData.notes) : [];
    const updatedNotes = existingNotes.map(n => n.id === note_id ? { ...n, text, timestamp: new Date().toISOString() } : n);

    const { error: updateError } = await supabase
      .from("quotes")
      .update({ notes: JSON.stringify(updatedNotes) })
      .eq("id", quote_id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, data: { id: note_id, text } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unexpected error", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { quote_id, note_id } = await request.json();
    if (!quote_id || !note_id)
      return NextResponse.json({ success: false, message: "quote_id and note_id are required" }, { status: 400 });

    const { data: quoteData, error: fetchError } = await supabase
      .from("quotes")
      .select("notes")
      .eq("id", quote_id)
      .single();
    if (fetchError) throw fetchError;

    const existingNotes: INote[] = quoteData.notes ? JSON.parse(quoteData.notes) : [];
    const updatedNotes = existingNotes.filter(n => n.id !== note_id);

    const { error: updateError } = await supabase
      .from("quotes")
      .update({ notes: JSON.stringify(updatedNotes) })
      .eq("id", quote_id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, message: "Note deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unexpected error", error: String(error) }, { status: 500 });
  }
}
