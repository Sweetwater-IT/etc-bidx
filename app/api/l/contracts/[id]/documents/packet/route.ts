import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const body = await request.json();
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds.map(String) : [];
    const preview = body.preview === true;

    if (documentIds.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 contract document is required' },
        { status: 400 }
      );
    }

    const { data: docs, error: docsError } = await supabase
      .from('documents_l')
      .select('id, file_name, file_path')
      .eq('job_id', contractId)
      .in('id', documentIds);

    if (docsError) {
      return NextResponse.json(
        { error: 'Failed to load selected contract documents', details: docsError.message },
        { status: 500 }
      );
    }

    const docsById = new Map((docs || []).map((doc) => [String(doc.id), doc]));
    if (docsById.size !== documentIds.length) {
      return NextResponse.json(
        { error: 'One or more selected documents do not belong to this contract' },
        { status: 403 }
      );
    }

    const orderedDocs = documentIds.map((id) => docsById.get(String(id))).filter(Boolean);
    const mergedPdf = await PDFDocument.create();

    for (const doc of orderedDocs) {
      if (!doc?.file_path || !doc.file_name?.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          { error: `Only saved PDF documents can be merged. Problem file: ${doc?.file_name || 'unknown'}` },
          { status: 400 }
        );
      }

      const { data: fileBlob, error: fileError } = await supabase.storage
        .from('files')
        .download(doc.file_path);

      if (fileError || !fileBlob) {
        return NextResponse.json(
          { error: `Failed to fetch document bytes for ${doc.file_name}` },
          { status: 500 }
        );
      }

      const pdf = await PDFDocument.load(await fileBlob.arrayBuffer());
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const mergedBuffer = Buffer.from(mergedBytes);

    if (preview) {
      return new NextResponse(mergedBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="contract-packet-preview.pdf"',
        },
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const mergedFileName = `Contract_Packet_${timestamp}.pdf`;
    const folder = `contracts/${contractId}/packets`;
    const storagePath = `${folder}/${mergedFileName}`;

    // Upload to storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .upload(storagePath, mergedBuffer, { contentType: 'application/pdf', upsert: false });

    if (storageError) {
      console.error('Storage error:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload merged PDF', details: storageError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('files').getPublicUrl(storagePath);

    // Insert document record
    const { data: dbData, error: dbError } = await supabase
      .from('documents_l')
      .insert({
        job_id: contractId,
        file_name: mergedFileName,
        file_path: storagePath,
        file_size: mergedBuffer.length,
        file_type: 'packet',
      })
      .select('id, file_name, file_path, file_size, file_type, created_at')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up storage
      await supabase.storage.from('files').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save document metadata', details: dbError.message },
        { status: 500 }
      );
    }

    console.log('[API] Packet merged and saved successfully:', dbData.id);

    return NextResponse.json({
      success: true,
      document: {
        id: String(dbData.id),
        name: dbData.file_name,
        filePath: dbData.file_path,
        size: dbData.file_size,
        type: dbData.file_type,
        uploadedAt: dbData.created_at,
      },
      url: urlData.publicUrl,
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error merging PDFs:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
