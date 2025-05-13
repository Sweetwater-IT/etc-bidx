import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import path from 'path';
import fs from 'fs/promises';

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Standard documents path
const STANDARD_DOCS_PATH = path.join(process.cwd(), 'public', 'documents');

interface SGAttachment {
  content: string;
  filename : string;
  type: string;
  disposition: string;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await req.formData();

    const subject = formData.get('subject') as string;
    const htmlContent = formData.get('htmlContent') as string;
    const to = formData.get('to') as string;
    const cc = formData.getAll('cc') as string[];
    const bcc = formData.getAll('bcc') as string[];
    const quoteNumber = formData.get('quoteNumber') as string;
    const standardDocsString = formData.get('standardDocs') as string;
    const token = formData.get('token') as string;

    const standardDocs = standardDocsString ? standardDocsString.split(',') : [];

    // Get all files
    const files = formData.getAll('files') as File[];

    if (!subject || !htmlContent || !to) {
      return NextResponse.json(
        { success: false, error: "Subject, body, and recipient email are required" },
        { status: 400 }
      );
    }

    // Process files for email attachments
    const attachments : SGAttachment[] = [];
    
    // First, process the uploaded files (quote PDF and custom files)
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        attachments.push({
          filename: file.name,
          content: Buffer.from(buffer).toString('base64'),
          type: file.type,
          disposition: 'attachment'
        });
        console.log(`Added file attachment: ${file.name}`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files if one fails
      }
    }

    // Then, process standard documents
    for (const docName of standardDocs) {
      try {
        // Map document names to file paths
        let filePath = '';
        if (docName === 'Flagging Price List') {
          filePath = path.join(STANDARD_DOCS_PATH, 'FLAGGING PRICING.xlsx');
        } else if (docName === 'Flagging Service Area') {
          filePath = path.join(STANDARD_DOCS_PATH, 'ETC Flagging Service Sell Sheet BEDFORD.pdf');
        } else if (docName === 'Sell Sheet') {
          filePath = path.join(STANDARD_DOCS_PATH, 'ETC Bedford Branch Opening FINAL.pdf');
        }
        
        if (filePath) {
          try {
            // Read the file and add it as an attachment
            const fileBuffer = await fs.readFile(filePath);
            attachments.push({
              filename: path.basename(filePath),
              content: fileBuffer.toString('base64'),
              type: docName === 'Flagging Price List' 
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                : 'application/pdf',
              disposition: 'attachment'
            });
            console.log(`Added standard document: ${docName}`);
          } catch (fileError) {
            console.error(`Error reading standard document ${docName}:`, fileError);
          }
        }
      } catch (err) {
        console.error(`Error adding standard document ${docName}:`, err);
      }
    }

    // Prepare email data
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@establishedtraffic.com',
      subject,
      html: htmlContent,
      attachments,
      // Add CC and BCC if provided
      ...(cc.length > 0 && { cc: cc.join(',') }),
      ...(bcc.length > 0 && { bcc: bcc.join(',') }),
      // Add tracking settings
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false }
      },
      // Custom tracking args
      customArgs: {
        quoteNumber,
        token
      }
    };

    // Send email using SendGrid
    const response = await sgMail.send(msg);
    
    console.log('Email sent successfully', {
      statusCode: response[0].statusCode,
      headers: response[0].headers,
      quoteNumber,
      recipient: to,
      attachmentCount: attachments.length
    });

    return NextResponse.json({
      success: true,
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id'],
      attachmentCount: attachments.length
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to send email" 
      },
      { status: 500 }
    );
  }
}