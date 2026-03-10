import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      coNumber,
      description,
      amount,
      status,
      submittedDate,
      approvedDate,
      documentFile
    } = await request.json();

    const { id: jobId } = await params;

    const coData: Record<string, unknown> = {
      job_id: jobId,
      co_number: coNumber || `CO-AUTO-${Date.now()}`,
      description: description || "SOV modification on signed contract",
      amount: amount || 0,
      status: status || "approved",
      submitted_date: submittedDate || new Date().toISOString().split("T")[0],
      approved_date: approvedDate || new Date().toISOString().split("T")[0],
    };

    const { error: coErr } = await supabase.from("change_orders").insert(coData as any);
    if (coErr) {
      console.error('Error creating change order:', coErr);
      return NextResponse.json({ error: `Failed to record change order: ${coErr.message}` }, { status: 500 });
    }

    // Handle document upload if provided
    if (documentFile) {
      const filePath = `${jobId}/change-orders/${Date.now()}-${documentFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("contracts")
        .upload(filePath, documentFile);

      if (uploadErr) {
        console.error('Error uploading change order document:', uploadErr);
        return NextResponse.json({ error: 'Change order recorded but document upload failed' }, { status: 500 });
      }

      // Insert document record
      await supabase.from("documents").insert({
        job_id: jobId,
        file_name: documentFile.name,
        file_path: filePath,
        file_type: documentFile.type,
        file_size: documentFile.size,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in change orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}