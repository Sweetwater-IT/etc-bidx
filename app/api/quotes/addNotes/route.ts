import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const quoteIdParam = request.nextUrl.searchParams.get("quote_id");
  if (!quoteIdParam)
    return NextResponse.json({ ok: false, message: "quote_id es requerido" }, { status: 400 });

  const quote_id = quoteIdParam;

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("quote_id", quote_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, message: "Failed to fetch notes", error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: data || [] }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { quote_id, text, user_email, timestamp } = body;

  if (!quote_id || !text || !user_email) {
    return NextResponse.json({ ok: false, message: "quote_id, text y user_email son requeridos" }, { status: 400 });
  }

  const newNote = {
    quote_id,
    text,
    user_email,
    created_at: timestamp
      ? new Date(timestamp).toISOString()
      : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("notes")
    .insert(newNote)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: "Failed to add note", error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, text } = body;

  if (!id || !text) {
    return NextResponse.json({ ok: false, message: "id y text son requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notes")
    .update({ text, created_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: "Failed to update note", error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ ok: false, message: "id es requerido" }, { status: 400 });
  }

  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, message: "Failed to delete note", error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Note deleted successfully" }, { status: 200 });
}
