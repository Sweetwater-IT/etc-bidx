
import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface SGAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: string;
}

interface FileMetadataForEmail {
  id: number;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

export async function POST(req: NextRequest) {
  try {
    // Parse JSON request body
    const requestData = await req.json();

    const {
      subject,
      emailBody,
      htmlContent,
      recipients,
      fromEmail,
      fromName,
      contractNumber,
      jobId,
      fileMetadata
    } = requestData;

    if (!subject || !htmlContent || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Subject, body, and recipient emails are required" },
        { status: 400 }
      );
    }

    // Process file metadata to download and create attachments
    const attachments: SGAttachment[] = [];
    const fileNames: string[] = [];

    if (fileMetadata && fileMetadata.length > 0) {
      for (const file of fileMetadata as FileMetadataForEmail[]) {
        try {
          // Fetch the file content from Supabase Storage using the file_url
          const fileResponse = await fetch(file.file_url);

          if (!fileResponse.ok) {
            console.error(`Failed to fetch file ${file.filename}: ${fileResponse.statusText}`);
            continue;
          }

          const fileBuffer = await fileResponse.arrayBuffer();

          attachments.push({
            filename: file.filename,
            content: Buffer.from(fileBuffer).toString('base64'),
            type: file.file_type,
            disposition: 'attachment'
          });

          fileNames.push(file.filename);
          console.log(`Added file attachment: ${file.filename} (${file.file_size} bytes)`);
        } catch (error) {
          console.error(`Error processing file ${file.filename}:`, error);
        }
      }
    }

    // Record email in the database (uncomment when ready)
    // const { data: emailData, error: emailError } = await supabase
    //   .from('contract_emails')
    //   .insert({
    //     contract_number: contractNumber,
    //     job_id: jobId ? parseInt(jobId) : null,
    //     subject: subject,
    //     body: emailBody,
    //     html_content: htmlContent,
    //     from_email: fromEmail,
    //     from_name: fromName,
    //     recipients: recipients.join(','),
    //     date_sent: new Date().toISOString(),
    //     attachment_count: attachments.length,
    //     status: 'pending'
    //   })
    //   .select()
    //   .single();

    // Format the sender field
    let formattedFrom;
    if (fromName && fromEmail) {
      formattedFrom = `${fromName} <${fromEmail}>`;
    } else {
      formattedFrom = fromEmail || 'it@establishedtraffic.com';
    }

    // Prepare email data
    const msg = {
      to: recipients,
      from: formattedFrom,
      subject,
      text: emailBody,
      html: htmlContent,
      attachments,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false }
      },
      customArgs: {
        contractNumber
      }
    };

    // Send email using SendGrid
    const response = await sgMail.send(msg);

    // Log successful email send
    console.log(`Email sent successfully to ${recipients.join(', ')} with ${attachments.length} attachments`);

    return NextResponse.json({
      success: true,
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id'],
      attachmentCount: attachments.length,
      recipientCount: recipients.length
    });

  } catch (error: any) {
    console.error('Error sending email:', error);

    // Provide more detailed error info if available
    const errorDetails = error.response?.body?.errors ?
      error.response.body.errors[0] :
      (error instanceof Error ? error.message : "Unknown error");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email",
        details: errorDetails
      },
      { status: 500 }
    );
  }

}