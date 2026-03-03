import { NextRequest, NextResponse } from 'next/server';
import { generateBillingPacketPdf } from '@/utils/generateBillingPacketPdf';
import { getBillingPacketData } from '@/utils/pdfData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const { workOrderId } = await params;

    // Fetch structured work order data
    const woData = await getBillingPacketData(workOrderId);

    // Generate PDF
    const pdfBytes = await generateBillingPacketPdf(woData);

    if (!pdfBytes) {
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=billing-packet-${woData.woNumber || workOrderId}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating work order PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
