import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Newer /l flows store files in documents_l, but older rows may still be in documents.
    let doc: { file_path: string | null; file_name: string | null } | null = null;

    const { data: docL } = await supabase
      .from("documents_l")
      .select("file_path, file_name")
      .eq("id", documentId)
      .maybeSingle();

    if (docL) {
      doc = docL;
    } else {
      const { data: legacyDoc, error: fetchErr } = await supabase
        .from("documents")
        .select("file_path, file_name")
        .eq("id", documentId)
        .maybeSingle();

      if (fetchErr) {
        console.error("Error fetching contract document:", fetchErr);
      }
      doc = legacyDoc;
    }

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!doc.file_path) {
      return NextResponse.json({ error: 'File not yet saved to storage' }, { status: 400 });
    }

    // Create signed URL for download
    const { data, error } = await supabase.storage
      .from("files")
      .createSignedUrl(doc.file_path, 300); // 5 minutes expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, fileName: doc.file_name });
  } catch (error) {
    console.error('Error in document download API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
