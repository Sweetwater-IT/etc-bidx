import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseJobNotes, stringifyJobNotes, type JobTimelineNote } from "@/lib/jobNotes";

async function getStoredJobNotes(jobId: string) {
  const { data, error } = await supabase
    .from("jobs_l")
    .select("id, additional_notes")
    .eq("id", jobId)
    .single();

  if (error || !data) {
    return { data: null, error };
  }

  return { data, error: null };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { data, error } = await getStoredJobNotes(jobId);

    if (error || !data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const parsed = parseJobNotes(data.additional_notes);
    return NextResponse.json(parsed.projectLog);
  } catch (error) {
    console.error("Error loading job notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { data, error } = await getStoredJobNotes(jobId);

    if (error || !data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
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
        additional_notes: stringifyJobNotes(parsed.contractNotes, nextNotes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("Error creating job note:", updateError);
      return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
    }

    return NextResponse.json(newNote);
  } catch (error) {
    console.error("Error creating job note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const noteId = typeof body?.id === "string" ? body.id : "";
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!noteId || !text) {
      return NextResponse.json({ error: "Note id and text are required" }, { status: 400 });
    }

    const { data, error } = await getStoredJobNotes(jobId);

    if (error || !data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
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
        additional_notes: stringifyJobNotes(parsed.contractNotes, nextNotes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("Error updating job note:", updateError);
      return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }

    return NextResponse.json(nextNotes[noteIndex]);
  } catch (error) {
    console.error("Error updating job note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("id")?.trim();

    if (!noteId) {
      return NextResponse.json({ error: "Note id is required" }, { status: 400 });
    }

    const { data, error } = await getStoredJobNotes(jobId);

    if (error || !data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const parsed = parseJobNotes(data.additional_notes);
    const nextNotes = parsed.projectLog.filter((note) => note.id !== noteId);

    const { error: updateError } = await supabase
      .from("jobs_l")
      .update({
        additional_notes: stringifyJobNotes(parsed.contractNotes, nextNotes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("Error deleting job note:", updateError);
      return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
