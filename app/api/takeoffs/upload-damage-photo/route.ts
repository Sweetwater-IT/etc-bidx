import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DAMAGE_PHOTO_BUCKET = 'files';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const itemId = formData.get('itemId') as string;
    const comp = formData.get('comp') as string;

    if (!file || !itemId || !comp) {
      return NextResponse.json(
        { error: 'File, itemId, and comp are required' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `takeoffs/damage-photos/${itemId}/${comp}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(DAMAGE_PHOTO_BUCKET)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(DAMAGE_PHOTO_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
