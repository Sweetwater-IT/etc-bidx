import { NextRequest, NextResponse } from 'next/server';
import { generateTakeoffPdf } from '@/utils/generateTakeoffPdf';
import { getTakeoffPdfData } from '@/utils/pdfData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch structured takeoff data
    const takeoffData = await getTakeoffPdfData(id);

    // Generate PDF
    const pdfBytes = await generateTakeoffPdf(takeoffData);

    if (!pdfBytes) {
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=takeoff-${takeoffData.title || 'untitled'}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating takeoff PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
