import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { generateBillingPacketPdf } from '@/utils/generateBillingPacketPdf';
import { generateTakeoffPdf } from '@/utils/generateTakeoffPdf';
import { getBillingPacketData, getTakeoffPdfData } from '@/utils/pdfData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const includeTakeoff = request.nextUrl.searchParams.get('include_takeoff') === 'true';

    // Fetch structured work order data
    const woData = await getBillingPacketData(id);

    const woBytes = await generateBillingPacketPdf({ ...woData, returnBytes: true });

    if (!woBytes) {
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }

    let pdfBytes: ArrayBuffer = woBytes;

    if (includeTakeoff && woData.primaryTakeoffId) {
      const takeoffData = await getTakeoffPdfData(woData.primaryTakeoffId);
      const takeoffBytes = await generateTakeoffPdf({ ...takeoffData, returnBytes: true });

      if (takeoffBytes) {
        const mergedPdf = await PDFDocument.create();
        const woPdf = await PDFDocument.load(woBytes);
        const takeoffPdf = await PDFDocument.load(takeoffBytes);

        const woPages = await mergedPdf.copyPages(woPdf, woPdf.getPageIndices());
        woPages.forEach((page) => mergedPdf.addPage(page));

        const takeoffPages = await mergedPdf.copyPages(takeoffPdf, takeoffPdf.getPageIndices());
        takeoffPages.forEach((page) => mergedPdf.addPage(page));

        pdfBytes = (await mergedPdf.save()).buffer as ArrayBuffer;
      }
    }

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${includeTakeoff ? 'billing-packet' : 'work-order'}-${woData.woNumber || id}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating work order PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
