import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    let doc: { file_path: string | null } | null = null;

    const { data: documentL, error: documentLError } = await supabase
      .from("documents_l")
      .select("file_path")
      .eq("id", id)
      .maybeSingle();

    if (documentLError) {
      console.error("Error fetching document from documents_l:", documentLError);
    }

    if (documentL) {
      doc = documentL;
    } else {
      const { data: legacyDocument, error: legacyError } = await supabase
        .from("documents")
        .select("file_path")
        .eq("id", id)
        .maybeSingle();

      if (legacyError) {
        console.error("Error fetching document from documents:", legacyError);
      }

      doc = legacyDocument;
    }

    if (!doc?.file_path) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { data, error } = await supabase.storage
      .from("files")
      .createSignedUrl(doc.file_path, 300);

    if (error) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error("Error in document signed URL route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
