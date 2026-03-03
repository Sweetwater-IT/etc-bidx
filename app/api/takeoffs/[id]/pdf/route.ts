import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/lib/supabase';

interface SignRow {
  designation: string;
  quantity: number;
  material: string;
  structure: string;
  dimensions: string;
  sheeting: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch takeoff data
    const { data: takeoff } = await supabase
      .from('takeoffs_l')
      .select('*')
      .eq('id', id)
      .single();

    if (!takeoff) {
      return NextResponse.json({ error: 'Takeoff not found' }, { status: 404 });
    }

    // Generate PDF
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
    y -= 25;

    page.drawText(`Work Type: ${takeoff.work_type}`, {
      x: margin,
      y,
      size: 12,
    });
    y -= 40;

    // Flatten sign rows from nested structure
    const signRows: SignRow[] = [];
    const signRowsData = takeoff.sign_rows as Record<string, any[]> || {};

    for (const [sectionKey, rows] of Object.entries(signRowsData)) {
      for (const row of rows) {
        signRows.push({
          designation: row.signDesignation || '',
          quantity: row.quantity || 0,
          material: row.material || '',
          structure: row.structureType || '',
          dimensions: row.dimensionLabel || '',
          sheeting: row.sheeting || '',
        });
      }
    }

    if (signRows.length > 0) {
      // Table header
      page.drawText('Designation', { x: margin, y, size: 12 });
      page.drawText('Structure', { x: margin + 120, y, size: 12 });
      page.drawText('Dimensions', { x: margin + 220, y, size: 12 });
      page.drawText('Qty', { x: margin + 300, y, size: 12 });
      page.drawText('Material', { x: margin + 340, y, size: 12 });
      y -= lineHeight;

      // Table rows
      for (const row of signRows) {
        if (y < 50) {
          // New page if needed
          const newPage = pdfDoc.addPage([595, 842]);
          y = height - margin;
        }
        page.drawText(row.designation || '', { x: margin, y, size: 10 });
        page.drawText(row.structure || '', { x: margin + 120, y, size: 10 });
        page.drawText(row.dimensions || '', { x: margin + 220, y, size: 10 });
        page.drawText(row.quantity?.toString() || '', { x: margin + 300, y, size: 10 });
        page.drawText(row.material || '', { x: margin + 340, y, size: 10 });
        y -= lineHeight;
      }
    } else {
      page.drawText('No sign rows found.', { x: margin, y, size: 12 });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=takeoff-${takeoff.title || 'untitled'}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating takeoff PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
