import { NextRequest, NextResponse } from 'next/server';
import { generateTakeoffPdf } from '@/utils/generateTakeoffPdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const pdfBytes = await generateTakeoffPdf(id);

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=takeoff-${id}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating takeoff PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}