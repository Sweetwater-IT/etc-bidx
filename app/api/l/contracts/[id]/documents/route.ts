import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const { data: docs, error } = await supabase
      .from("documents")
      .select("*")
      .eq("job_id", jobId);

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json(docs || []);
  } catch (error) {
    console.error('Error in documents API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const formData = await request.formData();
    const { id: jobId } = await params;

    const files = formData.getAll('files') as File[];
    const associatedItemId = formData.get('associatedItemId') as string;
    const category = formData.get('category') as string || 'other';

    const uploadedDocs: any[] = [];

    for (const file of files) {
      const filePath = `${jobId}/${category}/${Date.now()}_${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from("contracts")
        .upload(filePath, file, { upsert: false });

      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        continue; // Skip this file but continue with others
      }

      const { data: docRow, error: docErr } = await supabase.from("documents").insert({
        job_id: jobId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: category,
        checklist_item_id: associatedItemId || null,
      }).select("*").single();

      if (docErr) {
        console.error('Document insert error:', docErr);
        continue;
      }

      uploadedDocs.push({
        id: docRow.id,
        name: file.name,
        size: file.size,
        type: file.type,
        category: category,
        associatedItemId,
        uploadedAt: new Date().toISOString(),
        filePath,
      });
    }

    return NextResponse.json({ success: true, documents: uploadedDocs });
  } catch (error) {
    console.error('Error in documents upload API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get document info first
    const { data: doc, error: fetchErr } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", documentId)
      .single();

    if (fetchErr || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage
    if (doc.file_path) {
      await supabase.storage.from("contracts").remove([doc.file_path]);
    }

    // Delete from database
    const { error: deleteErr } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (deleteErr) {
      console.error('Error deleting document:', deleteErr);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in documents delete API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { documentId, category } = await request.json();

    if (!documentId || !category) {
      return NextResponse.json({ error: 'Document ID and category are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from("documents")
      .update({ file_type: category })
      .eq("id", documentId);

    if (error) {
      console.error('Error updating document category:', error);
      return NextResponse.json({ error: 'Failed to update document category' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in documents update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
