import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; workOrderId: string }> }
) {
  try {
    const { jobId, workOrderId } = await params;
    const supabase = getServerSupabase();

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploaded: Array<{ path: string; signedUrl: string; fileName: string }> = [];

    for (const file of files) {
      const filePath = `contracts/${jobId}/work-orders/${workOrderId}/pickup-report/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Failed to upload pickup report image:', uploadError);
        continue;
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('files')
        .createSignedUrl(filePath, 300);

      if (signedError || !signedData?.signedUrl) {
        console.error('Failed to create signed URL for pickup image:', signedError);
        continue;
      }

      uploaded.push({
        path: filePath,
        signedUrl: signedData.signedUrl,
        fileName: file.name,
      });
    }

    return NextResponse.json({ files: uploaded });
  } catch (error) {
    console.error('Error uploading pickup report images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}