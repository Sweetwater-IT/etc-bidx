import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const quoteIdParam = request.nextUrl.searchParams.get('quote_id');
  if (!quoteIdParam) return NextResponse.json({ success: false, message: 'quote_id required' }, { status: 400 });

  const quote_id = parseInt(quoteIdParam, 10);
  if (isNaN(quote_id)) return NextResponse.json({ success: false, message: 'quote_id must be a number' }, { status: 400 });

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('notes')
    .eq('id', quote_id)
    .single();

  if (error) return NextResponse.json({ success: false, message: 'Failed to fetch quote', error: error.message }, { status: 500 });

  // notes es un array de objetos, si está vacío devuelve []
  return NextResponse.json({ success: true, data: quote.notes || [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { quote_id, text, user_email, timestamp } = body;

  if (!quote_id || !text || !user_email) return NextResponse.json({ success: false, message: 'quote_id, text y user_email son requeridos' }, { status: 400 });

  // 1. Obtener las notas actuales
  const { data: quote, error } = await supabase.from('quotes').select('notes').eq('id', quote_id).single();
  if (error) return NextResponse.json({ success: false, message: 'Quote not found', error: error.message }, { status: 404 });

  const notes = Array.isArray(quote.notes) ? quote.notes : [];

  // 2. Agregar la nueva nota
  const newNote = { id: Date.now(), text, user_email, created_at: timestamp || new Date().toISOString() };
  const updatedNotes = [...notes, newNote];

  // 3. Guardar en la base
  const { error: updateError } = await supabase.from('quotes').update({ notes: updatedNotes }).eq('id', quote_id);
  if (updateError) return NextResponse.json({ success: false, message: 'Failed to add note', error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, data: newNote }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { quote_id, id, text } = body;
  if (!quote_id || !id || !text) return NextResponse.json({ success: false, message: 'quote_id, id y text son requeridos' }, { status: 400 });

  const { data: quote, error } = await supabase.from('quotes').select('notes').eq('id', quote_id).single();
  if (error) return NextResponse.json({ success: false, message: 'Quote not found', error: error.message }, { status: 404 });

  const notes = Array.isArray(quote.notes) ? quote.notes : [];
  const updatedNotes = notes.map(n => (n.id === id ? { ...n, text, created_at: new Date().toISOString() } : n));

  const { error: updateError } = await supabase.from('quotes').update({ notes: updatedNotes }).eq('id', quote_id);
  if (updateError) return NextResponse.json({ success: false, message: 'Failed to update note', error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, data: updatedNotes.find(n => n.id === id) });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { quote_id, id } = body;
  if (!quote_id || !id) return NextResponse.json({ success: false, message: 'quote_id y id son requeridos' }, { status: 400 });

  const { data: quote, error } = await supabase.from('quotes').select('notes').eq('id', quote_id).single();
  if (error) return NextResponse.json({ success: false, message: 'Quote not found', error: error.message }, { status: 404 });

  const notes = Array.isArray(quote.notes) ? quote.notes : [];
  const updatedNotes = notes.filter(n => n.id !== id);

  const { error: updateError } = await supabase.from('quotes').update({ notes: updatedNotes }).eq('id', quote_id);
  if (updateError) return NextResponse.json({ success: false, message: 'Failed to delete note', error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Note deleted', data: updatedNotes });
}
