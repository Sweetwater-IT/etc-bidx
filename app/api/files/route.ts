import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FileUploadResult } from '@/types/FileTypes';

// Map folder names to database column names
const FOLDER_TO_COLUMN_MAP = {
  'jobs': 'job_id',
  'bid_estimates': 'bid_estimate_id',
  'quotes': 'quote_id',
  'sign-orders': 'sign_order_id'

} as const;

type FolderType = keyof typeof FOLDER_TO_COLUMN_MAP;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const folder = searchParams.get('folder') as FolderType;
    const id = searchParams.get('id');

    if (!id || !folder) {
      return NextResponse.json(
        { error: 'Id or folder parameter not present' },
        { status: 400 }
      );
    }

    // Validate folder type
    if (!(folder in FOLDER_TO_COLUMN_MAP)) {
      return NextResponse.json(
        { error: 'Invalid folder type. Must be one of: jobs, bid_estimates, quotes' },
        { status: 400 }
      );
    }

    // Parse and validate the ID
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: 'Invalid ID format. Must be a number' },
        { status: 400 }
      );
    }

    // Get the corresponding database column
    const columnName = FOLDER_TO_COLUMN_MAP[folder];

    const { data, error } = await supabase
      .from('files')
      .select(`
    id,
    filename,
    file_type,
    upload_date,
    file_size,
    file_path,
    file_url,
    ${columnName}
  `)
      .eq(columnName, parsedId)
      .not('file_path', 'like', `%/pdf/%`)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json(
        { error: 'Failed to fetch files', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const uniqueIdentifier = formData.get('uniqueIdentifier') as string;
    const folder = formData.get('folder') as FolderType;

    if (!uniqueIdentifier || !folder) {
      return NextResponse.json(
        { error: 'Missing uniqueIdentifier or folder' },
        { status: 400 }
      );
    }

    // Validate folder type
    if (!(folder in FOLDER_TO_COLUMN_MAP)) {
      return NextResponse.json(
        { error: 'Invalid folder type' },
        { status: 400 }
      );
    }

    const filesOrFile = formData.getAll('file');
    let filesArray: File[] = [];

    if (filesOrFile.length > 0) {
      filesArray = filesOrFile.filter((item) => item instanceof File) as File[];
    } else {
      const singleFile = formData.get('files');
      if (singleFile instanceof File) filesArray = [singleFile];
    }

    if (filesArray.length === 0) {
      return NextResponse.json(
        { error: 'No files found in the request' },
        { status: 400 }
      );
    }

    const columnName = FOLDER_TO_COLUMN_MAP[folder];
    const parsedId = parseInt(uniqueIdentifier);

    // Check for existing files for this entity
    const existingFiles = await supabase
      .from('files')
      .select('filename')
      .eq(columnName, parsedId);

    const results: FileUploadResult[] = [];

    for (const file of filesArray) {
      const filename = file.name;
      const contentType = file.type || 'application/pdf';
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Prevent duplicates by filename
      if (existingFiles.data?.some((f) => f.filename === filename)) {
        results.push({
          filename,
          success: false,
          error: `File "${filename}" already exists`,
        });
        continue;
      }

      const storagePath = `${folder}/${uniqueIdentifier}/${timestamp}_${sanitizedFilename}`;

      try {
        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('files')
          .upload(storagePath, file, { upsert: false });

        if (storageError) {
          results.push({
            filename,
            success: false,
            error: storageError.message,
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(storagePath);

        // Insert into DB
        const { data: dbData, error: dbError } = await supabase
          .from('files')
          .insert({
            filename,
            file_type: contentType,
            file_path: storagePath,
            file_url: urlData.publicUrl,
            [columnName]: parsedId,
            upload_date: new Date().toISOString(),
            file_size: file.size,
          })
          .select('id, filename, file_type, upload_date, file_size, file_url')
          .single();

        if (dbError) {
          await supabase.storage.from('files').remove([storagePath]);
          results.push({
            filename,
            success: false,
            error: dbError.message,
          });
        } else {
          results.push({
            success: true,
            fileId: dbData.id,
            fileUrl: dbData.file_url,
            ...dbData,
          });
        }
      } catch (fileError) {
        results.push({
          filename,
          success: false,
          error:
            fileError instanceof Error
              ? fileError.message
              : 'Unexpected error',
        });
      }
    }

    const allFailed = results.every((r) => !r.success);
    if (allFailed) {
      return NextResponse.json(
        { success: false, message: 'All uploads failed', results },
        { status: 500 }
      );
    }

    const successCount = results.filter((r) => r.success).length;
    return NextResponse.json(
      {
        success: true,
        message: `Uploaded ${successCount} of ${results.length} files successfully`,
        results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const parsedFileId = parseInt(fileId);
    if (isNaN(parsedFileId)) {
      return NextResponse.json({ error: 'Invalid file ID format. Must be a number' }, { status: 400 });
    }

    // Get the file metadata and ensure it belongs to sign-orders
    const { data: fileData, error: fetchError } = await supabase
      .from('files')
      .select('id, filename, file_path, sign_order_id')
      .eq('id', parsedFileId)
      .single();

    if (fetchError || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (!fileData.sign_order_id) {
      return NextResponse.json({ error: 'Cannot delete file: not associated with a sign order' }, { status: 400 });
    }

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([fileData.file_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', parsedFileId);

    if (dbError) {
      return NextResponse.json({ error: 'Failed to delete file from database', details: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${fileData.filename}`
    });

  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
  }
}
