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

    // Get document info
    const { data: doc, error: fetchErr } = await supabase
      .from("documents")
      .select("file_path, file_name")
      .eq("id", documentId)
      .single();

    if (fetchErr || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!doc.file_path) {
      return NextResponse.json({ error: 'File not yet saved to storage' }, { status: 400 });
    }

    // Create signed URL for download
    const { data, error } = await supabase.storage
      .from("contract-documents")
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