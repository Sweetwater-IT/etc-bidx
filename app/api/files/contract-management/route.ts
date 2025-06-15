import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FileUploadResult } from '@/types/FileTypes';

export async function POST(req: NextRequest) {
  try {
    // Parse the FormData
    const formData = await req.formData();
    const jobId = formData.get('jobId') as string;
    
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
    
    // Initialize the results array with the proper type
    const results: FileUploadResult[] = [];
    
    for (const file of filesArray) {
      // Extract filename and get content type from file
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
      
      // Convert file to binary data
      const bytes = await file.arrayBuffer();
      
      // Using Uint8Array for consistent binary handling
      const binaryData = new Uint8Array(bytes);
      
      // Insert file into database using Supabase
      // Store the binary data directly without any serialization
      const { data, error } = await supabase
        .from('files')
        .insert({
          filename: filename,
          file_type: contentType,
          file_data: binaryData,  // Store as binary data directly
          job_id: parseInt(jobId),
          upload_date: new Date().toISOString(),
          file_size: binaryData.length,
          contract_number: documentType
        })
        .select('id, filename, file_type, upload_date, file_size')
        .single();
      
      if (error) {
        console.error(`Error saving file ${filename}:`, error);
        results.push({
          filename,
          success: false,
          error: error.message
        });
      } else {
        results.push({
          success: true,
          fileId: data.id,
          ...data
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
    return NextResponse.json(
      { 
        success: true, 
        message: `Successfully uploaded ${results.filter(r => r.success).length} of ${results.length} files`,
        results
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files', details: error },
      { status: 500 }
    );
  }
}