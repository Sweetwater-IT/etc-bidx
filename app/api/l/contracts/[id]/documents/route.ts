import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "upload";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const { data: docs, error } = await supabase
      .from("documents_l")
      .select("*")
      .eq("job_id", jobId)
      .is("deleted_at", null);

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
    const { id: jobId } = await params;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body.action === 'createSignedUploadUrl') {
        const fileName = typeof body.fileName === 'string' ? body.fileName : '';
        const category = typeof body.category === 'string' ? body.category : 'other';

        if (!fileName) {
          return NextResponse.json({ error: 'File name is required' }, { status: 400 });
        }

        const safeFileName = sanitizeFileName(fileName);
        const filePath = `contracts/${jobId}/${category}/${Date.now()}_${safeFileName}`;
        const { data, error } = await supabase.storage
          .from('files')
          .createSignedUploadUrl(filePath);

        if (error || !data?.token) {
          console.error('Signed upload URL error:', error);
          return NextResponse.json(
            { error: error?.message || 'Failed to prepare signed upload URL' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          path: filePath,
          token: data.token,
        });
      }

      if (body.action === 'saveMetadata') {
        const associatedItemId =
          typeof body.associatedItemId === 'string' ? body.associatedItemId : '';
        const category = typeof body.category === 'string' ? body.category : 'other';
        const uploads = Array.isArray(body.uploads) ? body.uploads : [];

        if (uploads.length === 0) {
          return NextResponse.json({ error: 'No uploads were provided' }, { status: 400 });
        }

        const uploadedDocs: any[] = [];
        const uploadErrors: Array<{ fileName: string; error: string }> = [];

        for (const upload of uploads) {
          const fileName = typeof upload.fileName === 'string' ? upload.fileName : '';
          const filePath = typeof upload.filePath === 'string' ? upload.filePath : '';
          const fileSize = typeof upload.fileSize === 'number' ? upload.fileSize : 0;
          const mimeType = typeof upload.mimeType === 'string' ? upload.mimeType : '';

          if (!fileName || !filePath) {
            uploadErrors.push({
              fileName: fileName || 'unknown',
              error: 'Missing file metadata',
            });
            continue;
          }

          const { data: docRow, error: docErr } = await supabase
            .from("documents_l")
            .insert({
              job_id: jobId,
              file_name: fileName,
              file_path: filePath,
              file_size: fileSize,
              file_type: category,
            })
            .select("*")
            .single();

          if (docErr) {
            console.error('Document insert error:', docErr);
            uploadErrors.push({
              fileName,
              error: docErr.message || 'Document record insert failed',
            });
            continue;
          }

          uploadedDocs.push({
            id: docRow.id,
            name: fileName,
            size: fileSize,
            type: mimeType,
            category,
            associatedItemId,
            uploadedAt: new Date().toISOString(),
            filePath,
          });
        }

        if (uploadedDocs.length === 0) {
          return NextResponse.json(
            {
              error: uploadErrors[0]?.error || 'No documents were uploaded',
              errors: uploadErrors,
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          documents: uploadedDocs,
          errors: uploadErrors,
        });
      }

      return NextResponse.json({ error: 'Unsupported upload action' }, { status: 400 });
    }

    const formData = await request.formData();

    const files = formData.getAll('files') as File[];
    const associatedItemId = formData.get('associatedItemId') as string;
    const category = formData.get('category') as string || 'other';

    const uploadedDocs: any[] = [];
    const uploadErrors: Array<{ fileName: string; error: string }> = [];

    for (const file of files) {
      const safeFileName = sanitizeFileName(file.name);
      const filePath = `contracts/${jobId}/${category}/${Date.now()}_${safeFileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("files")
        .upload(filePath, file, { upsert: false });

      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        uploadErrors.push({
          fileName: file.name,
          error: uploadErr.message || 'Storage upload failed',
        });
        continue; // Skip this file but continue with others
      }

      const { data: docRow, error: docErr } = await supabase.from("documents_l").insert({
        job_id: jobId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: category,
      }).select("*").single();

      if (docErr) {
        console.error('Document insert error:', docErr);
        uploadErrors.push({
          fileName: file.name,
          error: docErr.message || 'Document record insert failed',
        });
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

    if (uploadedDocs.length === 0) {
      return NextResponse.json(
        {
          error: uploadErrors[0]?.error || 'No documents were uploaded',
          errors: uploadErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: uploadedDocs,
      errors: uploadErrors,
    });
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
      .from("documents_l")
      .select("file_path")
      .eq("id", documentId)
      .single();

    if (fetchErr || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage
    if (doc.file_path) {
      await supabase.storage.from("files").remove([doc.file_path]);
    }

    // Delete from database
    const { error: deleteErr } = await supabase
      .from("documents_l")
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
    const { documentId, category, fileName } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const updates: { file_type?: string; file_name?: string } = {};

    if (typeof category === "string" && category.trim()) {
      updates.file_type = category;
    }

    if (typeof fileName === "string" && fileName.trim()) {
      updates.file_name = fileName.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'At least one document update is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from("documents_l")
      .update(updates)
      .eq("id", documentId);

    if (error) {
      console.error('Error updating document metadata:', error);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in documents update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
