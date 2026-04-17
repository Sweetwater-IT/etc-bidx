import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { supabase } from '@/lib/supabase';
import { BUILT_IN_CONTRACT_DOCS, type BuiltInContractDocType } from '@/lib/contract-packet';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    console.log('[API] POST /api/l/contracts/[id]/documents/packet/built-in - Getting built-in doc for contract:', contractId);

    const body = await request.json();
    const { docType } = body as { docType: BuiltInContractDocType };

    if (!docType) {
      return NextResponse.json({ error: 'docType is required' }, { status: 400 });
    }

    const docConfig = BUILT_IN_CONTRACT_DOCS.find(d => d.type === docType);
    if (!docConfig) {
      return NextResponse.json({ error: `Unknown docType: ${docType}` }, { status: 400 });
    }

    const sourceFilePath = join(process.cwd(), 'public', docConfig.sourcePath);

    try {
      const fileBuffer = await readFile(sourceFilePath);
      const storageFileName = `${Date.now()}_${sanitizeFileName(docConfig.filename)}`;
      const storagePath = `contracts/${contractId}/built-in/${storageFileName}`;

      const { error: storageError } = await supabase.storage
        .from('files')
        .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false });

      if (storageError) {
        return NextResponse.json(
          { error: 'Failed to upload built-in document', details: storageError.message },
          { status: 500 }
        );
      }

      const { data: inserted, error: insertError } = await supabase
        .from('documents_l')
        .insert({
          job_id: contractId,
          file_name: docConfig.filename,
          file_path: storagePath,
          file_size: fileBuffer.length,
          file_type: 'other',
        })
        .select('id, file_name, file_path, file_size, file_type, created_at')
        .single();

      if (insertError) {
        await supabase.storage.from('files').remove([storagePath]);
        return NextResponse.json(
          { error: 'Failed to save built-in document metadata', details: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        document: {
          id: String(inserted.id),
          name: inserted.file_name,
          size: inserted.file_size,
          type: 'application/pdf',
          category: 'other',
          uploadedAt: inserted.created_at,
          filePath: inserted.file_path,
        },
      });
    } catch (fileError) {
      return NextResponse.json(
        {
          error: 'Document file not found',
          message: `The compliance document ${docConfig.filename} is not available on the server yet.`,
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error serving built-in document:', error);
    return NextResponse.json(
      { error: 'Failed to serve built-in document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
