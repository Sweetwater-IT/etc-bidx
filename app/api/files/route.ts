import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FileUploadResult } from '@/types/FileTypes';

// Map folder names to database column names
const FOLDER_TO_COLUMN_MAP = {
  'jobs': 'job_id',
  'bid_estimates': 'bid_estimate_id', 
  'quotes': 'quote_id'
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
    
    // Query the database for file metadata (no binary data needed anymore)
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
    // Parse the FormData
    const formData = await req.formData();
    const uniqueIdentifier = formData.get('uniqueIdentifier') as string;
    const folder = formData.get('folder') as string;
    
    // Validate identifier
    if (!uniqueIdentifier) {
      return NextResponse.json(
        { error: 'Missing identifier' },
        { status: 400 }
      );
    }
    
    // Handle both single file and multiple files
    let filesArray: File[] = [];
    
    // Check if it's a single file or multiple files
    const filesOrFile = formData.getAll('file');
    
    if (filesOrFile.length > 0) {
      // Convert all items to File objects
      filesArray = filesOrFile.filter(item => item instanceof File) as File[];
    } else {
      // Try getting a single file with 'files' key as fallback
      const singleFile = formData.get('files');
      if (singleFile instanceof File) {
        filesArray = [singleFile];
      }
    }
    
    if (filesArray.length === 0) {
      return NextResponse.json(
        { error: 'No files found in the request' },
        { status: 400 }
      );
    }
    
    // Initialize the results array
    const results: FileUploadResult[] = [];
    
    for (const file of filesArray) {
      const filename = file.name;
      const contentType = file.type || 'application/pdf';
      
      // Create a unique file path to avoid naming conflicts
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

      
      const storagePath = `${folder}/${uniqueIdentifier}/${timestamp}_${sanitizedFilename}`;      
      try {
        // Upload file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('files') // Make sure this bucket exists in your Supabase project
          .upload(storagePath, file, {
            contentType: contentType,
            upsert: false // Don't overwrite existing files
          });

        if (storageError) {
          console.error(`Storage error for ${filename}:`, storageError);
          results.push({
            filename,
            success: false,
            error: storageError.message
          });
          continue;
        }

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(storagePath);

        const columnName = FOLDER_TO_COLUMN_MAP[folder as keyof typeof FOLDER_TO_COLUMN_MAP];

        const { data: dbData, error: dbError } = await supabase
          .from('files')
          .insert({
            filename: filename,
            file_type: contentType,
            file_path: storagePath,
            file_url: urlData.publicUrl,
            [columnName]: parseInt(uniqueIdentifier), // <- dinámico según folder
            upload_date: new Date().toISOString(),
            file_size: file.size
          })
          .select('id, filename, file_type, upload_date, file_size, file_url')
          .single();
        
        if (dbError) {
          console.error(`Database error for ${filename}:`, dbError);
          
          // Clean up: delete the uploaded file from storage if DB insert failed
          await supabase.storage
            .from('files')
            .remove([storagePath]);
          
          results.push({
            filename,
            success: false,
            error: dbError.message
          });
        } else {
          results.push({
            success: true,
            fileId: dbData.id,
            fileUrl: dbData.file_url, // Include the public URL in response
            ...dbData
          });
        }
      } catch (fileError) {
        console.error(`Unexpected error processing ${filename}:`, fileError);
        results.push({
          filename,
          success: false,
          error: `Unexpected error: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
        });
      }
    }
    
    // Check if all uploads failed
    const allFailed = results.every(result => !result.success);
    if (allFailed) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'All file uploads failed',
          results 
        },
        { status: 500 }
      );
    }
    
    // Some or all uploads succeeded
    const successCount = results.filter(r => r.success).length;
    return NextResponse.json(
      { 
        success: true, 
        message: `Successfully uploaded ${successCount} of ${results.length} files`,
        results
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add this DELETE function to your existing /api/files/route.ts

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const parsedFileId = parseInt(fileId);
    if (isNaN(parsedFileId)) {
      return NextResponse.json(
        { error: 'Invalid file ID format. Must be a number' },
        { status: 400 }
      );
    }

    // Get the file metadata to find the storage path
    const { data: fileData, error: fetchError } = await supabase
      .from('files')
      .select('id, filename, file_path')
      .eq('id', parsedFileId)
      .single();

    if (fetchError || !fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    try {
      // Delete from Supabase Storage first
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([fileData.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', parsedFileId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        return NextResponse.json(
          { error: 'Failed to delete file from database', details: dbError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${fileData.filename}`
      });

    } catch (deleteError) {
      console.error('Error during file deletion:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete file', details: deleteError instanceof Error ? deleteError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}