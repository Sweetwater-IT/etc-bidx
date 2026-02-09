import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Document type definition
export type DocumentType = 'w9' | 'eeo-sharp' | 'safety-program' | 'sexual-harassment' | 'avenue-appeals';

// Map document types to file paths
const filePathMap: Record<DocumentType, string> = {
    'w9': '/documents/ETC W-9 2025.pdf',
    'eeo-sharp': '/documents/EEO-SHARP Policy 2025.pdf', 
    'safety-program': '/documents/Full ETC SAFETY PROGRAM.pdf',
    'sexual-harassment': '/documents/Full ETC Sexual Harrasment Policy 2025.pdf',
    'avenue-appeals': '/documents/Avenue of Appeals 2025.pdf'
};

// Map document types to database columns
const documentToColumnMap: Record<DocumentType, string> = {
    'w9': 'w9_added',
    'eeo-sharp': 'eea_sharp_added', 
    'safety-program': 'safety_program_added',
    'sexual-harassment': 'sexual_harrassment_added',
    'avenue-appeals': 'avenue_appeals_added'
};

// Map UI names to document types
const uiNameToDocumentType: Record<string, DocumentType> = {
    'W-9': 'w9',
    'EEO-SHARP Policy': 'eeo-sharp',
    'Safety Program': 'safety-program',
    'Sexual Harassment Policy': 'sexual-harassment',
    'Avenue of Appeals': 'avenue-appeals'
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fileName = searchParams.get('file');
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    const filePath = filePathMap[fileName as DocumentType];
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Construct the absolute path from the public directory
    const publicPath = path.join(process.cwd(), 'public', filePath);
    
    // Check if file exists
    if (!fs.existsSync(publicPath)) {
      return NextResponse.json(
        { error: 'File does not exist on server' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(publicPath);
    
    // weird typescript bug here with nextresponse not recognizing buffers
    return new NextResponse((fileBuffer as any), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${path.basename(filePath)}`,
        'X-File-Name': path.basename(filePath),
      }
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    const { jobId, addedDocuments } = requestData;

    // Validate required fields
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!addedDocuments || !Array.isArray(addedDocuments)) {
      return NextResponse.json(
        { error: 'Added documents list is required' },
        { status: 400 }
      );
    }

    // Parse and validate job ID
    const parsedJobId = parseInt(jobId.toString());
    if (isNaN(parsedJobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID format. Must be a number' },
        { status: 400 }
      );
    }

    // Build the update object based on added documents
    const updateData: { [key: string]: boolean } = {};

    for (const uiName of addedDocuments) {
      const documentType = uiNameToDocumentType[uiName];
      if (documentType) {
        const columnName = documentToColumnMap[documentType];
        updateData[columnName] = true;
      } else {
        console.warn(`Unknown document type: ${uiName}`);
      }
    }

    // If no valid documents were provided, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid documents provided' },
        { status: 400 }
      );
    }

    // Update the jobs table
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', parsedJobId)
      .select('id, w9_added, eea_sharp_added, safety_program_added, sexual_harrassment_added, avenue_appeals_added')
      .single();

    if (error) {
      console.error('Error updating job document status:', error);
      return NextResponse.json(
        { error: 'Failed to update job document status', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${Object.keys(updateData).length} document status(es)`,
      jobId: parsedJobId,
      updatedFields: updateData,
      currentStatus: {
        'W-9': data.w9_added,
        'EEO-SHARP Policy': data.eea_sharp_added,
        'Safety Program': data.safety_program_added,
        'Sexual Harassment Policy': data.sexual_harrassment_added,
        'Avenue of Appeals': data.avenue_appeals_added
      }
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}