import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
// import { supabase } from '@/lib/supabase';

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface SGAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: string;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await req.formData();

    // Extract all form data
    const subject = formData.get('subject') as string;
    const emailBody = formData.get('emailBody') as string;
    const htmlContent = formData.get('htmlContent') as string;
    const recipients = formData.getAll('to') as string[];
    const fromEmail = formData.get('fromEmail') as string;
    const fromName = formData.get('fromName') as string;
    const contractNumber = formData.get('contractNumber') as string;
    const jobId = formData.get('jobId') as string;

    const files = formData.getAll('files') as File[];

    if (!subject || !htmlContent || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Subject, body, and recipient emails are required" },
        { status: 400 }
      );
    }

    // Process files for email attachments
    const attachments: SGAttachment[] = [];
    const fileNames: string[] = [];

    // Process uploaded files
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);
        
        attachments.push({
          filename: file.name,
          content: fileBuffer.toString('base64'),
          type: file.type,
          disposition: 'attachment'
        });
        
        fileNames.push(file.name);
        console.log(`Added file attachment: ${file.name}`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    // Record email in the database
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

    // if (emailError) {
    //   console.error('Error recording email in database:', emailError);
    //   // Continue anyway, since sending the email is the primary task
    // }

    // const emailId = emailData?.id;

    // For each file, add a record in the database
    // for (const fileName of fileNames) {
    //   const { error: fileError } = await supabase
    //     .from('email_attachments')
    //     .insert({
    //       email_id: emailId,
    //       filename: fileName
    //     });

    //   if (fileError) {
    //     console.error('Error recording attachment:', fileError);
    //   }
    // }

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

    // // If email was sent successfully, update the status
    // if (response[0].statusCode >= 200 && response[0].statusCode < 300 && emailId) {
    //   const { error: updateError } = await supabase
    //     .from('contract_emails')
    //     .update({ status: 'sent' })
    //     .eq('id', emailId);

    //   if (updateError) {
    //     console.error('Error updating email status:', updateError);
    //   }
    // }

    return NextResponse.json({
      success: true,
    //   emailId,
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id'],
      attachmentCount: attachments.length
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