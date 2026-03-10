import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Work order ID is required' }, { status: 400 });
    }

    // Get work order to get job_id
    const { data: workOrder, error: woError } = await supabase
      .from('work_orders')
      .select('job_id')
      .eq('id', id)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const jobId = workOrder.job_id;

    // Handle file upload
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles: any[] = [];

    for (const file of files) {
      const filePath = `${jobId}/work-orders/${id}/${Date.now()}_${file.name}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, file);

      if (uploadError) {
        console.error(`Failed to upload ${file.name}:`, uploadError);
        continue; // Skip this file but continue with others
      }

      // Save record to documents table
      const { data: docData, error: insertError } = await supabase
        .from("documents")
        .insert({
          job_id: jobId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || null,
          file_size: file.size,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error(`Failed to save record for ${file.name}:`, insertError);
        continue;
      }

      uploadedFiles.push(docData);
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles.length,
      documents: uploadedFiles
    });

  } catch (error) {
    console.error('Error in work order documents API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!id || !documentId) {
      return NextResponse.json({ error: 'Work order ID and document ID are required' }, { status: 400 });
    }

    // Get document info
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageErr } = await supabase.storage
      .from("contracts")
      .remove([doc.file_path]);

    if (storageErr) {
      console.error('Failed to delete file from storage:', storageErr);
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 });
    }

    // Delete from database
    const { error: dbErr } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (dbErr) {
      console.error('Failed to delete document record:', dbErr);
      return NextResponse.json({ error: 'Failed to delete document record' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}