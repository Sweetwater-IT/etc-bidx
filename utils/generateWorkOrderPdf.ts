'use client';

import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/lib/supabase';

interface WorkOrderItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export async function generateWorkOrderPdf(workOrderId: string): Promise<Uint8Array> {
  const { data: workOrder } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', workOrderId)
    .single();

  if (!workOrder) {
    throw new Error('Work order not found');
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const { width, height } = page.getSize();
  const margin = 40;
  const lineHeight = 15;
  let y = height - margin;

  // Header
  page.drawText('Work Order', {
    x: margin,
    y,
    size: 24,
  });
  y -= 40;

  page.drawText(`Work Order ID: ${workOrder.id}`, {
    x: margin,
    y,
    size: 12,
  });
  y -= 25;

  page.drawText(`Job ID: ${workOrder.job_id}`, {
    x: margin,
    y,
    size: 12,
  });
  y -= 25;

  page.drawText(`Title: ${workOrder.title || 'N/A'}`, {
    x: margin,
    y,
    size: 12,
  });
  y -= 40;

  // Parse items
  const items: WorkOrderItem[] = workOrder.items ? JSON.parse(workOrder.items) : [];

  if (items.length > 0) {
    // Table header
    page.drawText('Description', { x: margin, y, size: 12 });
    page.drawText('Qty', { x: margin + 200, y, size: 12 });
    page.drawText('Unit', { x: margin + 250, y, size: 12 });
    page.drawText('Unit Price', { x: margin + 300, y, size: 12 });
    page.drawText('Total', { x: margin + 400, y, size: 12 });
    y -= lineHeight;

    // Table rows
    for (const item of items) {
      if (y < 50) {
        const newPage = pdfDoc.addPage([595, 842]);
        y = height - margin;
      }
      page.drawText(item.description || '', { x: margin, y, size: 10 });
      page.drawText(item.quantity?.toString() || '', { x: margin + 200, y, size: 10 });
      page.drawText(item.unit || '', { x: margin + 250, y, size: 10 });
      page.drawText(item.unit_price?.toString() || '', { x: margin + 300, y, size: 10 });
      page.drawText(item.total?.toString() || '', { x: margin + 400, y, size: 10 });
      y -= lineHeight;
    }
  } else {
    page.drawText('No items found.', { x: margin, y, size: 12 });
  }

  return await pdfDoc.save();
}