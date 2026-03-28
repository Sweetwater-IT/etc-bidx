import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const { data, error } = await supabase
      .from("change_orders")
      .select("id, job_id, co_number, description, status, amount, submitted_date, approved_date, created_at")
      .eq("job_id", jobId)
      .order("approved_date", { ascending: false, nullsFirst: false })
      .order("submitted_date", { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching change orders:', error);
      return NextResponse.json({ error: 'Failed to fetch change orders' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      hasApprovedChangeOrder: (data || []).some((row: any) => row.status === "approved"),
    });
  } catch (error) {
    console.error('Error in change orders GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let coNumber: string | null = null;
    let description: string | null = null;
    let amount: number | null = null;
    let status: string | null = null;
    let submittedDate: string | null = null;
    let approvedDate: string | null = null;
    let documentFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      coNumber = String(formData.get("coNumber") || "") || null;
      description = String(formData.get("description") || "") || null;
      amount = Number(formData.get("amount") || 0);
      status = String(formData.get("status") || "") || null;
      submittedDate = String(formData.get("submittedDate") || "") || null;
      approvedDate = String(formData.get("approvedDate") || "") || null;
      const fileCandidate = formData.get("documentFile");
      documentFile = fileCandidate instanceof File ? fileCandidate : null;
    } else {
      const body = await request.json();
      coNumber = body.coNumber ?? null;
      description = body.description ?? null;
      amount = body.amount != null ? Number(body.amount) : null;
      status = body.status ?? null;
      submittedDate = body.submittedDate ?? null;
      approvedDate = body.approvedDate ?? null;
      documentFile = body.documentFile ?? null;
    }

    const { id: jobId } = await params;

    const coData = {
      job_id: jobId,
      co_number: coNumber || `CO-AUTO-${Date.now()}`,
      description: description || "SOV modification on signed contract",
      amount: amount || 0,
      status: status || "approved",
      submitted_date: submittedDate || new Date().toISOString().split("T")[0],
      approved_date: approvedDate || new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    };

    const { error: coErr } = await supabase.from("change_orders").insert(coData);
    if (coErr) {
      console.error('Error creating change order:', coErr);
      return NextResponse.json({ error: `Failed to record change order: ${coErr.message}` }, { status: 500 });
    }

    let uploadedDocument: {
      id: string;
      name: string;
      size: number;
      type: string;
      category: "change_order";
      uploadedAt: string;
      filePath: string;
    } | null = null;

    // Handle document upload if provided
    if (documentFile instanceof File) {
      const filePath = `contracts/${jobId}/change-orders/${Date.now()}-${documentFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("files")
        .upload(filePath, documentFile);

      if (uploadErr) {
        console.error('Error uploading change order document:', uploadErr);
        return NextResponse.json({ error: 'Change order recorded but document upload failed' }, { status: 500 });
      }

      // Save the uploaded change order into the contract documents list
      const { data: documentRow, error: documentError } = await supabase.from("documents_l").insert({
        job_id: jobId,
        file_name: documentFile.name,
        file_path: filePath,
        file_type: "change_order",
        file_size: documentFile.size,
      }).select("id, uploaded_at").single();

      if (documentError) {
        console.error('Error creating change order document record:', documentError);
        return NextResponse.json({ error: 'Change order recorded but document record creation failed' }, { status: 500 });
      }

      uploadedDocument = {
        id: documentRow.id,
        name: documentFile.name,
        size: documentFile.size,
        type: "change_order",
        category: "change_order",
        uploadedAt: documentRow.uploaded_at || new Date().toISOString(),
        filePath,
      };
    }

    return NextResponse.json({ success: true, document: uploadedDocument });
  } catch (error) {
    console.error('Error in change orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
