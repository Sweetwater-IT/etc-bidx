import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseJobNotes, stringifyJobNotes, type JobTimelineNote } from "@/lib/jobNotes";

async function getStoredContractNotes(contractId: string) {
  const { data, error } = await supabase
    .from("jobs_l")
    .select("id, additional_notes, created_at, updated_at")
    .eq("id", contractId)
    .single();

  if (error || !data) {
    return { data: null, error };
  }

  return { data, error: null };
}

async function normalizeContractNotes(contractId: string) {
  const { data, error } = await getStoredContractNotes(contractId);

  if (error || !data) {
    return { data: null, error };
  }

  const parsed = parseJobNotes(data.additional_notes);

  if (parsed.contractNotes.trim() && parsed.projectLog.length === 0) {
    const migratedNote: JobTimelineNote = {
      id: crypto.randomUUID(),
      text: parsed.contractNotes.trim(),
      timestamp: new Date(data.updated_at || data.created_at || Date.now()).getTime(),
    };

    const nextNotes = [migratedNote];
    const { error: updateError } = await supabase
      .from("jobs_l")
      .update({
        additional_notes: stringifyJobNotes("", nextNotes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (updateError) {
      return { data: null, error: updateError };
    }

    return {
      data: {
        ...data,
        additional_notes: stringifyJobNotes("", nextNotes),
      },
      error: null,
    };
  }

  return { data, error: null };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const { data, error } = await normalizeContractNotes(contractId);

    if (error || !data) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const parsed = parseJobNotes(data.additional_notes);
    return NextResponse.json(parsed.projectLog);
  } catch (error) {
    console.error("Error loading contract notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const body = await request.json();
    const { data, error } = await normalizeContractNotes(contractId);

    if (error || !data) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const parsed = parseJobNotes(data.additional_notes);
    const incoming = body?.note as Partial<JobTimelineNote> | undefined;
    const text = typeof incoming?.text === "string" ? incoming.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "Note text is required" }, { status: 400 });
    }

    const newNote: JobTimelineNote = {
      id: typeof incoming?.id === "string" && incoming.id ? incoming.id : crypto.randomUUID(),
      text,
      timestamp: typeof incoming?.timestamp === "number" ? incoming.timestamp : Date.now(),
      user_email: typeof incoming?.user_email === "string" ? incoming.user_email : undefined,
    };

    const nextNotes = [...parsed.projectLog, newNote];

    const { error: updateError } = await supabase
      .from("jobs_l")
      .update({
        additional_notes: stringifyJobNotes("", nextNotes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (updateError) {
      console.error("Error creating contract note:", updateError);
      return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
    }

    return NextResponse.json(newNote);
  } catch (error) {
    console.error("Error creating contract note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const body = await request.json();
    const noteId = typeof body?.id === "string" ? body.id : "";
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!noteId || !text) {
      return NextResponse.json({ error: "Note id and text are required" }, { status: 400 });
    }

    const { data, error } = await normalizeContractNotes(contractId);

    if (error || !data) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const parsed = parseJobNotes(data.additional_notes);
    const noteIndex = parsed.projectLog.findIndex((note) => note.id === noteId);

    if (noteIndex === -1) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const nextNotes = parsed.projectLog.map((note) =>
      note.id === noteId ? { ...note, text } : note
    );

    const { error: updateError } = await supabase
      .from("jobs_l")
      .update({
        additional_notes: stringifyJobNotes("", nextNotes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (updateError) {
      console.error("Error updating contract note:", updateError);
      return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }

    return NextResponse.json(nextNotes[noteIndex]);
  } catch (error) {
    console.error("Error updating contract note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("id")?.trim();

    if (!noteId) {
      return NextResponse.json({ error: "Note id is required" }, { status: 400 });
    }

    const { data, error } = await normalizeContractNotes(contractId);

    if (error || !data) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const parsed = parseJobNotes(data.additional_notes);
    const nextNotes = parsed.projectLog.filter((note) => note.id !== noteId);

    const { error: updateError } = await supabase
      .from("jobs_l")
      .update({
        additional_notes: stringifyJobNotes("", nextNotes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (updateError) {
      console.error("Error deleting contract note:", updateError);
      return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
