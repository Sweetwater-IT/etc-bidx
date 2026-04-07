import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "upload";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const { data, error } = await supabase
      .from("documents_l")
      .select("*")
      .eq("job_id", jobId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching job documents:", error);
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in job documents GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const category = String(formData.get("category") || "other");
    const associatedItemId = String(formData.get("associatedItemId") || "");

    const uploadedDocs: any[] = [];
    const uploadErrors: Array<{ fileName: string; error: string }> = [];

    for (const file of files) {
      const safeFileName = sanitizeFileName(file.name);
      const filePath = `jobs/${jobId}/${category}/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error("Job document upload error:", uploadError);
        uploadErrors.push({
          fileName: file.name,
          error: uploadError.message || "Storage upload failed",
        });
        continue;
      }

      const { data: docRow, error: insertError } = await supabase
        .from("documents_l")
        .insert({
          job_id: jobId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: category,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Job document insert error:", insertError);
        uploadErrors.push({
          fileName: file.name,
          error: insertError.message || "Document record insert failed",
        });
        continue;
      }

      uploadedDocs.push({
        id: docRow.id,
        name: docRow.file_name,
        size: docRow.file_size,
        type: file.type,
        category,
        associatedItemId,
        uploadedAt: docRow.uploaded_at || new Date().toISOString(),
        filePath: docRow.file_path,
      });
    }

    if (uploadedDocs.length === 0) {
      return NextResponse.json(
        {
          error: uploadErrors[0]?.error || "No documents were uploaded",
          errors: uploadErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, documents: uploadedDocs, errors: uploadErrors });
  } catch (error) {
    console.error("Error in job documents POST:", error);
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
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const { data: doc, error: fetchError } = await supabase
      .from("documents_l")
      .select("id, file_path, job_id")
      .eq("id", documentId)
      .eq("job_id", jobId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.file_path) {
      await supabase.storage.from("files").remove([doc.file_path]);
    }

    const { error: deleteError } = await supabase
      .from("documents_l")
      .delete()
      .eq("id", documentId)
      .eq("job_id", jobId);

    if (deleteError) {
      console.error("Job document delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in job documents DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { documentId, category } = await request.json();

    if (!documentId || !category) {
      return NextResponse.json({ error: "Document ID and category are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("documents_l")
      .update({ file_type: category })
      .eq("id", documentId)
      .eq("job_id", jobId);

    if (error) {
      console.error("Job document update error:", error);
      return NextResponse.json({ error: "Failed to update document category" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in job documents PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
