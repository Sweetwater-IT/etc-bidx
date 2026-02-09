import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FileUploadResult } from '@/types/FileTypes';
import { FileMetadata } from '@/types/FileTypes';

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('job_id')

  if (!jobId || jobId === '') {
    return NextResponse.json(
      { error: 'Missing job ID' },
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
    .eq('job_id', jobId)

  if (fileTableErr) {
    return NextResponse.json(
      { error: "Couldn't find any files associated with job id: " + jobId },
      { status: 400 }
    );
  }

  const fileMetaData: FileMetadata[] = fileTableLinksData.map(file => ({
    ...file,
    associatedId: Number(jobId)
  }
  ))

  return NextResponse.json(
    { status: 201, data : fileMetaData}
  );
}

export async function POST(req: NextRequest) {
  try {
    // Parse the FormData
    const formData = await req.formData();
    const jobId = formData.get('uniqueIdentifier') as string;

    // Validate job ID
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing job ID' },
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

    interface ContractFileUploadResult extends FileUploadResult {
      documentType?: string
    }
    // Initialize the results array
    const results: ContractFileUploadResult[] = [];

    for (const file of filesArray) {
      const filename = file.name;
      const contentType = file.type || 'application/pdf';

      // Determine document type category based on filename
      let documentType = 'ADDITIONAL'; // Default type
      if (filename.includes('Fringe Benefits')) {
        documentType = 'FRINGE_BENEFITS';
      } else if (filename.includes('Workers Protection')) {
        documentType = 'WORKERS_PROTECTION';
      } else if (filename.includes('Employment Verification')) {
        documentType = 'EMPLOYMENT_VERIFICATION';
      }

      // Create a unique file path to avoid naming conflicts
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `jobs/${jobId}/${documentType}/${timestamp}_${sanitizedFilename}`;

      try {
        // Upload file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('files')
          .upload(storagePath, file, {
            contentType: contentType,
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
            job_id: parseInt(jobId),
            upload_date: new Date().toISOString(),
            file_size: file.size,
            contract_number: documentType // Store document type for categorization
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
          // Now update the jobs table to mark the corresponding document type as uploaded
          const updateData: { [key: string]: boolean } = {};

          // switch (documentType) {
          //   case 'FRINGE_BENEFITS':
          //     updateData.fringe_benefits_uploaded = true;
          //     break;
          //   case 'WORKERS_PROTECTION':
          //     updateData.workers_protection_uploaded = true;
          //     break;
          //   case 'EMPLOYMENT_VERIFICATION':
          //     updateData.employment_verification_uploaded = true;
          //     break;
          //   case 'ADDITIONAL':
          //     break;
          // }

          // Update the jobs table with the document upload status
          const { error: jobUpdateError } = await supabase
            .from('jobs')
            .update(updateData)
            .eq('id', parseInt(jobId));

          if (jobUpdateError) {
            console.error(`Error updating job document status for ${filename}:`, jobUpdateError);
            // Don't fail the file upload if job update fails, just log it
          }

          results.push({
            success: true,
            fileId: dbData.id,
            fileUrl: dbData.file_url,
            documentType: documentType,
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