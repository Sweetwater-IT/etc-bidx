import { NextRequest, NextResponse } from 'next/server';
import { generateWorkOrderPdf } from '@/utils/generateWorkOrderPdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const pdfBytes = await generateWorkOrderPdf(id);

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=work-order-${id}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating work order PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}