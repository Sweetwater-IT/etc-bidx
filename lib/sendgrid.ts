import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY is not set. Email functionality will not work.');
}

export async function sendEmail(data: MailDataRequired): Promise<boolean> {
  try {
    await sgMail.send(data);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendQuoteNotification(
  recipientEmail: string,
  quoteData: {
    quoteId: string;
    customerName: string;
    projectName: string;
    totalAmount: number;
    createdBy: string;
    createdAt: string;
  }
): Promise<boolean> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
  
  const emailData: MailDataRequired = {
    to: recipientEmail,
    from: fromEmail,
    subject: `New Quote Created: ${quoteData.projectName}`,
    content: [
      {
        type: 'text/html',
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Quote Created</h2>
            <p>A new quote has been created with the following details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Quote ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${quoteData.quoteId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Customer:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${quoteData.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Project:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${quoteData.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Total Amount:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${quoteData.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Created By:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${quoteData.createdBy}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Created At:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${quoteData.createdAt}</td>
              </tr>
            </table>
            
            <div style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${quoteData.quoteId}` : `/quotes/${quoteData.quoteId}`}" 
                 style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                View Quote
              </a>
            </div>
          </div>
        `
      }
    ]
  };
  
  return sendEmail(emailData);
}
