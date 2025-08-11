import { supabase } from "@/lib/supabase";
import { FileMetadata, FileUploadResult } from "@/types/FileTypes";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const signOrderId = req.nextUrl.searchParams.get('sign_order_id')
  
    if (!signOrderId || signOrderId === '') {
      return NextResponse.json(
        { error: 'Missing sign order ID' },
        { status: 400 }
      );
    }
  
    const { data: fileTableLinksData, error: fileTableErr } = await supabase.from('files')
      .select(`
      id,
      file_path, 
      file_url,
      filename,
      file_type,
      file_size,
      upload_date
      `)
      .eq('sign_order_id', signOrderId)
  
    if (fileTableErr) {
      return NextResponse.json(
        { error: "Couldn't find any files associated with job id: " + signOrderId },
        { status: 400 }
      );
    }
  
    const fileMetaData: FileMetadata[] = fileTableLinksData.map(file => ({
      ...file,
      associatedId: Number(signOrderId)
    }
    ))
  
    return NextResponse.json(
      { status: 201, data : fileMetaData}
    );
  }

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const signOrderId = formData.get('uniqueIdentifier') as string;

        if (!signOrderId) {
            return NextResponse.json(
                { error: 'Missing sign order ID' },
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

        const results: FileUploadResult[] = [];

        const currentSignOrderFiles = await supabase.from('files').select('filename').eq('sign_order_id', signOrderId);

        for (const file of filesArray) {
            const filename = file.name;
            const contentType = file.type || 'application/pdf';
        
            const timestamp = Date.now();
            const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        
            // Simple check - just compare against sanitized filename
            if(currentSignOrderFiles.data?.some(f => f.filename === filename)){
                results.push({
                    filename,
                    success: false,
                    error: `File "${filename}" already exists`
                });
                continue;
            }
            const storagePath = `sign-orders/${signOrderId}/${timestamp}_${sanitizedFilename}`;

            try {
                // Upload file to Supabase Storage
                const { data: storageData, error: storageError } = await supabase.storage
                .from('files')
                .upload(storagePath, file, {
                    upsert: false
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

                // Insert file metadata into database
                const { data: dbData, error: dbError } = await supabase
                    .from('files')
                    .insert({
                        filename: filename,
                        file_type: contentType,
                        file_path: storagePath,
                        file_url: urlData.publicUrl,
                        sign_order_id: parseInt(signOrderId),
                        upload_date: new Date().toISOString(),
                        file_size: file.size,
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
                        fileUrl: dbData.file_url,
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