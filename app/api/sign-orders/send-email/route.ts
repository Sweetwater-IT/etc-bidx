import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface SGAttachment {
  filename: string;
  content: string;
  type: string;
  disposition: string;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await req.formData();

    // Extract form data
    const to = formData.get('to') as string;
    const cc = formData.get('cc') as string;
    const bcc = formData.get('bcc') as string;
    const subject = formData.get('subject') as string;
    const emailBody = formData.get('emailBody') as string;
    const fromEmail = formData.get('fromEmail') as string;
    const signOrderId = formData.get('signOrderId') as string;
    const pdfFile = formData.get('pdfFile') as File;
    if (!subject || !emailBody || !to) {
      return NextResponse.json(
        { success: false, error: "Subject, body, and recipient email are required" },
        { status: 400 }
      );
    }

    // Process PDF file for email attachment
    const attachments: SGAttachment[] = [];
    
    if (pdfFile) {
      try {
        const buffer = await pdfFile.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);
        
        attachments.push({
          filename: pdfFile.name,
          content: fileBuffer.toString('base64'),
          type: 'application/pdf',
          disposition: 'attachment'
        });
        
        console.log(`Added PDF attachment: ${pdfFile.name}`);
      } catch (error) {
        console.error(`Error processing PDF file:`, error);
      }
    }

    // Parse recipients
    const toEmails = to.split(',').map(email => email.trim()).filter(email => email);
    const ccEmails = cc ? cc.split(',').map(email => email.trim()).filter(email => email) : [];
    const bccEmails = bcc ? bcc.split(',').map(email => email.trim()).filter(email => email) : [];

    // Prepare email data
    const msg = {
      to: toEmails,
      from: fromEmail || 'it@establishedtraffic.com',
      subject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
      attachments,
      ...(ccEmails.length > 0 && { cc: ccEmails }),
      ...(bccEmails.length > 0 && { bcc: bccEmails }),
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false }
      },
      customArgs: {
        signOrderId
      }
    };

    // Send email using SendGrid
    const response = await sgMail.send(msg);

    // Log successful email send
    console.log(`Sign order email sent successfully to ${toEmails.join(', ')} with ${attachments.length} attachments`);

    // Optionally, you could store the email record in the database here
    // Similar to how quotes are stored in the quotes table

    return NextResponse.json({
      success: true,
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id'],
      attachmentCount: attachments.length,
      recipientCount: toEmails.length
    });

  } catch (error: any) {
    console.error('Error sending sign order email:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('SendGrid response status:', error.response.status);
      console.error('SendGrid response headers:', error.response.headers);
      console.error('SendGrid response body:', JSON.stringify(error.response.body, null, 2));
    }
    
    // Provide more detailed error info if available
    let errorMessage = "Failed to send email";
    let errorDetails = "Unknown error";
    
    if (error.response?.body?.errors) {
      const sendGridError = error.response.body.errors[0];
      errorDetails = sendGridError.message || JSON.stringify(sendGridError);
      errorMessage = sendGridError.message || "SendGrid error";
      
      console.error('SendGrid error details:', sendGridError);
    } else if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.message;
    }
      
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 