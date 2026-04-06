import { NextRequest, NextResponse } from 'next/server';
import { generateTakeoffPdf } from '@/utils/generateTakeoffPdf';
import { getTakeoffPdfData } from '@/utils/pdfData';
import { getTakeoffPdfFilename } from '@/utils/pdfFilename';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('PDF Route: Received takeoff ID:', id);

    // Fetch structured takeoff data
    console.log('PDF Route: Calling getTakeoffPdfData with ID:', id);
    const takeoffData = await getTakeoffPdfData(id);
    console.log('PDF Route: getTakeoffPdfData returned:', takeoffData ? 'data' : 'null/undefined');

    if (!takeoffData) {
      return NextResponse.json({ error: 'Takeoff not found' }, { status: 404 });
    }

    // Generate PDF bytes
    const pdfBytes = await generateTakeoffPdf({ ...takeoffData, returnBytes: true });

    if (!pdfBytes) {
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }

    // Upload to Supabase Storage
    const fileName = getTakeoffPdfFilename(takeoffData.title, Boolean(takeoffData.isPickup));
    const filePath = `documents_l/takeoffs/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF to storage:', uploadError);
      // Continue anyway - we can still return the PDF
    }

    // Create record in documents_l table
    const { data: takeoffRecord } = await supabase
      .from('takeoffs_l')
      .select('job_id')
      .eq('id', id)
      .single();

    if (takeoffRecord) {
      const { error: dbError } = await supabase
        .from('documents_l')
        .insert({
          job_id: takeoffRecord.job_id,
          file_name: fileName,
          file_path: filePath,
          file_type: 'application/pdf',
          file_size: pdfBytes.byteLength,
          uploaded_by: null // Will be set by auth if available
        });

      if (dbError) {
        console.error('Error creating document record:', dbError);
        // Continue anyway - PDF was generated successfully
      }
    }

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${fileName}`,
      },
    });
  } catch (error) {
    console.error('Error generating takeoff PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
