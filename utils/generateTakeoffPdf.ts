'use client';

import PDFDocument from 'pdf-lib';
import { supabase } from '@/lib/supabase';

interface SignRow {
  designation: string;
  quantity: number;
  material: string;
}

export async function generateTakeoffPdf(takeoffId: string): Promise<Uint8Array> {
  const { data: takeoff } = await supabase
    .from('takeoffs_l')
    .select('*')
    .eq('id', takeoffId)
    .single();

  if (!takeoff) {
    throw new Error('Takeoff not found');
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const { width, height } = page.getSize();
  const margin = 40;
  const lineHeight = 15;
  let y = height - margin;

  // Header
  page.drawText('Material Takeoff', {
    x: margin,
    y,
    size: 24,
  });
  y -= 40;

  page.drawText(`Takeoff ID: ${takeoff.id}`, {
    x: margin,
    y,
    size: 12,
  });
  y -= 25;

  page.drawText(`Job ID: ${takeoff.job_id}`, {
    x: margin,
    y,
    size: 12,
  });
  y -= 25;

  page.drawText(`Title: ${takeoff.title}`, {
    x: margin,
    y,
    size: 12,
  });
  y -= 40;

  // Parse sign_rows
  const signRows: SignRow[] = takeoff.sign_rows ? JSON.parse(takeoff.sign_rows) : [];

  if (signRows.length > 0) {
    // Table header
    page.drawText('Designation', { x: margin, y, size: 12 });
    page.drawText('Quantity', { x: margin + 200, y, size: 12 });
    page.drawText('Material', { x: margin + 300, y, size: 12 });
    y -= lineHeight;

    // Table rows
    for (const row of signRows) {
      if (y < 50) {
        // New page if needed
        const newPage = pdfDoc.addPage([595, 842]);
        y = height - margin;
      }
      page.drawText(row.designation || '', { x: margin, y, size: 10 });
      page.drawText(row.quantity?.toString() || '', { x: margin + 200, y, size: 10 });
      page.drawText(row.material || '', { x: margin + 300, y, size: 10 });
      y -= lineHeight;
    }
  } else {
    page.drawText('No sign rows found.', { x: margin, y, size: 12 });
  }

  return await pdfDoc.save();
}
