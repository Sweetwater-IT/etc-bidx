import { NextRequest, NextResponse } from "next/server";
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