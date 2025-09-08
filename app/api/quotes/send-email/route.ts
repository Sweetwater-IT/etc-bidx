import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import path from 'path';
import fs from 'fs/promises';
import { supabase } from '@/lib/supabase'; // Import Supabase client

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Standard documents path
const STANDARD_DOCS_PATH = path.join(process.cwd(), 'public', 'documents');

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
    const to = formData.get('to') as string;
    const fromEmail = formData.get('fromEmail') as string;
    const pocName = formData.get('pocName') as string;
    const pocContactId = formData.get('pocContactId') as string;
    const cc = formData.getAll('cc') as string[];
    const bcc = formData.getAll('bcc') as string[];
    const quoteNumber = formData.get('quoteNumber') as string;
    const standardDocsString = formData.get('standardDocs') as string;
    const uniqueToken = formData.get('uniqueToken') as string;
    const status = formData.get('status') as string;
    const customTerms = formData.get('customTerms') as string;
    const notes = formData.get('notes') as string;
    const paymentTerms = formData.get('paymentTerms') as string;
    const ecmsPoNumber = formData.get('ecmsPoNumber') as string;
    const stateRoute = formData.get('stateRoute') as string;
    const county = formData.get('county') as string;
    const quoteType = formData.get('quoteType') as string;
    const associatedContract = formData.get('associatedContract') as string;

    // Parse JSON data
    const customersJson = formData.get('customers') as string;
    const customers = JSON.parse(customersJson || '[]');

    const recipientsJson = formData.get('recipients') as string;
    const recipients = JSON.parse(recipientsJson || '[]');

    const quoteItemsJson = formData.get('quoteItems') as string;
    const quoteItems = JSON.parse(quoteItemsJson || '[]');

    const includedTermsJson = formData.get('includedTerms') as string;
    const includedTerms = JSON.parse(includedTermsJson || '{}');

    const attachmentFlagsJson = formData.get('attachmentFlags') as string;
    const attachmentFlags = JSON.parse(attachmentFlagsJson || '{}');

    // Lookup estimate_id or job_id based on quoteType and associatedContract
    let estimate_id: number | null = null;
    let job_id: number | null = null;

    if (associatedContract && quoteType) {
      if (quoteType === 'estimate') {
        // Look up the estimate_id from admin_data_entries
        const { data: estimateData } = await supabase
          .from('bid_estimates')
          .select('id')
          .eq('contract_number', associatedContract)
          .single();

        if (estimateData) {
          estimate_id = estimateData.id;
          console.log(`Found estimate_id: ${estimate_id} for contract ${associatedContract}`);
        }
      } else if (quoteType === 'job') {
        // Look up the job_id from jobs
        const { data: jobData } = await supabase
          .from('jobs')
          .select('id')
          .eq('job_number', associatedContract) 
          .single();

        if (jobData) {
          job_id = jobData.id;
          console.log(`Found job_id: ${job_id} for contract ${associatedContract}`);
        }
      }
    }

    const standardDocs = standardDocsString ? standardDocsString.split(',') : [];

    // Get all uploaded files
    const files = formData.getAll('files') as File[];

    if (!subject || !htmlContent || !to) {
      return NextResponse.json(
        { success: false, error: "Subject, body, and recipient email are required" },
        { status: 400 }
      );
    }

    // Process files for email attachments
    const attachments: SGAttachment[] = [];
    const fileNames: string[] = [];

    // Process uploaded files (quote PDF and custom files)
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

    // Process standard documents
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
            const fileName = path.basename(filePath);
            const fileType = docName === 'Flagging Price List'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/pdf';

            attachments.push({
              filename: fileName,
              content: fileBuffer.toString('base64'),
              type: fileType,
              disposition: 'attachment'
            });

            // We don't add standard documents to fileNames
            console.log(`Added standard document: ${docName}`);
          } catch (fileError) {
            console.error(`Error reading standard document ${docName}:`, fileError);
          }
        }
      } catch (err) {
        console.error(`Error adding standard document ${docName}:`, err);
      }
    }

    // 1. Insert into quotes table using Supabase
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        from_email: fromEmail || 'it@establishedtraffic.com',
        subject: subject,
        body: emailBody,
        estimate_id: estimate_id,
        job_id: job_id,
        date_sent: new Date().toISOString(),
        response_token: uniqueToken,
        status: status,
        quote_number: quoteNumber,
        notes: notes,
        custom_terms_conditions: customTerms,
        payment_terms: paymentTerms,
        county: county,
        state_route: stateRoute,
        ecms_po_number: ecmsPoNumber,
        bedford_sell_sheet: attachmentFlags['bedford-branch'] || false,
        flagging_price_list: attachmentFlags['flagging-price-list'] || false,
        flagging_service_area: attachmentFlags['flagging-service-area'] || false,
        standard_terms: includedTerms['standard-terms'] || false,
        rental_agreements: includedTerms['rental-agreements'] || false,
        equipment_sale: includedTerms['equipment-sale'] || false,
        flagging_terms: includedTerms['flagging-terms'] || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      return NextResponse.json(
        { success: false, error: "Failed to create quote record" },
        { status: 500 }
      );
    }

    const quoteId = quoteData.id;

    // 2. Insert into quotes_customers junction table
    for (const customer of customers) {
      const { error: customerError } = await supabase
        .from('quotes_customers')
        .insert({
          quote_id: quoteId,
          contractor_id: customer.id
        });

      if (customerError) {
        console.error('Error associating customer with quote:', customerError);
      }
    }

    // 3. Insert into quote_recipients table
    // Find the point of contact recipient
    const pointOfContactRecipient = recipients.find(r => r.point_of_contact === true);

    for (const recipient of recipients) {
      // If this recipient is the POC or we specifically find it marked as POC
      const isPOC = recipient.point_of_contact === true ||
        (recipient.email === to && pointOfContactRecipient === undefined);

      const { error: recipientError } = await supabase
        .from('quote_recipients')
        .insert({
          quote_id: quoteId,
          customer_contacts_id: recipient.contactId || null,
          email: recipient.email,
          cc: recipient.cc || false,
          bcc: recipient.bcc || false,
          point_of_contact: isPOC // Ensure POC is properly marked
        });

      if (recipientError) {
        console.error('Error adding recipient:', recipientError);
      }
    }

    // If no POC was found in recipients, add the 'to' address as POC
    if (!pointOfContactRecipient) {
      const { error: mainRecipientError } = await supabase
        .from('quote_recipients')
        .insert({
          quote_id: quoteId,
          customer_contacts_id: pocContactId ? parseInt(pocContactId) : null,
          email: to,
          cc: false,
          bcc: false,
          point_of_contact: true
        });

      if (mainRecipientError) {
        console.error('Error adding main recipient:', mainRecipientError);
      }
    }

    // 4. Insert into quote_items table and associated_items table
    for (const item of quoteItems) {
      const { data: itemData, error: itemError } = await supabase
        .from('quote_items')
        .insert({
          quote_id: quoteId,
          item_number: item.itemNumber,
          description: item.description,
          uom: item.uom,
          notes: item.notes,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: item.discount,
          discount_type: item.discountType
        })
        .select()
        .single();

      if (itemError) {
        console.error('Error adding quote item:', itemError);
        continue;
      }

      const quoteItemId = itemData.id;

      // Insert associated items if they exist
      if (item.associatedItems && item.associatedItems.length > 0) {
        for (const assocItem of item.associatedItems) {
          const { error: assocItemError } = await supabase
            .from('associated_items')
            .insert({
              quote_item_id: quoteItemId,
              item_number: assocItem.itemNumber,
              description: assocItem.description,
              uom: assocItem.uom,
              quantity: assocItem.quantity,
              unit_price: assocItem.unitPrice,
              notes: assocItem.notes || null
            });

          if (assocItemError) {
            console.error('Error adding associated item:', assocItemError);
          }
        }
      }
    }

    // 5. For each custom file, add an entry in the files table
    for (const fileName of fileNames) {
      const { error: fileError } = await supabase
        .from('files')
        .insert({
          quote_id: quoteId,
          filename: fileName
        });

      if (fileError) {
        console.error('Error adding file record:', fileError);
      }
    }

    // Prepare email data
    const msg = {
      to,
      from: fromEmail || 'it@establishedtraffic.com',
      subject,
      html: htmlContent,
      attachments,
      ...(cc.length > 0 && { cc: cc.join(',') }),
      ...(bcc.length > 0 && { bcc: bcc.join(',') }),
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false }
      },
      customArgs: {
        quoteNumber,
        responseToken: uniqueToken
      }
    };

    // Send email using SendGrid
    const response = await sgMail.send(msg);

    // If email was sent successfully, update the status to "Sent"
    if (response[0].statusCode >= 200 && response[0].statusCode < 300) {
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'Sent' })
        .eq('id', quoteId);

      if (updateError) {
        console.error('Error updating quote status:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      quoteId,
      statusCode: response[0].statusCode,
      messageId: response[0].headers['x-message-id'],
      attachmentCount: attachments.length
    });

  } catch (error: any) {
    console.error('Error sending quote email:', error);
    // Provide more detailed error info if available
    const errorDetails = error.response?.body?.errors ?
      error.response.body.errors[0] :
      (error instanceof Error ? error.message : "Unknown error");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email and store quote",
        details: errorDetails
      },
      { status: 500 }
    );
  }
}