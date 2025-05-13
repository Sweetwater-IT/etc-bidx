"use client";

import { Button } from "@/components/ui/button";
import { useQuoteForm } from "./QuoteFormProvider";
import { PaymentTerms, QuoteAdminInformation } from "@/components/pages/quote-form/QuoteAdminInformation";
import { QuoteItems } from "@/components/pages/quote-form/QuoteItems";
import { QuoteEmailDetails } from "@/components/pages/quote-form/QuoteEmailDetails";
import { QuoteNumber } from "@/components/pages/quote-form/QuoteNumber";
import { QuoteAdditionalFiles } from "@/components/pages/quote-form/QuoteAdditionalFiles";
import { QuoteTermsAndConditions } from "@/components/pages/quote-form/QuoteTermsAndConditions";
import { QuoteNotes } from "@/components/pages/quote-form/QuoteNotes";
import { QuotePreviewButton } from "@/components/pages/quote-form/PreviewButton";
import { sendQuoteEmail } from "@/lib/api-client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function QuoteFormContent() {
  const {
    selectedCustomers,
    emailSent,
    emailError,
    sending,
    setSending,
    setEmailSent,
    setEmailError,
    quoteId,
    quoteItems,
    paymentTerms,
    emailBody,
    subject,
    ccEmails,
    bccEmails,
    pointOfContact,
  } = useQuoteForm();

  const handleSendQuote = async () => {
    const targetEmail = 'it@establishedtraffic.com';
    
    setSending(true);
    setEmailError(null);
    
    try {
      const success = await sendQuoteEmail(
        {
          date: new Date(),
          quoteNumber: quoteId,
          customerName: pointOfContact?.name ?? '',
          customers: selectedCustomers.map(customer => customer.name),
          totalAmount: 0,
          items: quoteItems,
          createdBy: 'me',
          createdAt: 'Today',
          paymentTerms: paymentTerms as PaymentTerms,
        },
        {
          pointOfContact: pointOfContact?.name ?? '',
          cc: ccEmails,
          bcc: bccEmails,
          subject: subject,
          body: emailBody
        }
      );
      
      if (success) {
        setEmailSent(true);
        toast.success(`Email sent successfully to ${targetEmail}!`);
        setTimeout(() => setEmailSent(false), 5000);
      } else {
        setEmailError("Failed to send email. Please try again.");
      }
    } catch (error) {
      console.error("Error sending quote email:", error);
      setEmailError("An error occurred while sending the email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Quote Form</h1>
        </div>
        <div className="flex items-center gap-2">
          <QuotePreviewButton />
          <Button 
            onClick={handleSendQuote} 
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Quote"}
          </Button>
          <Button variant="outline">Download</Button>
        </div>
      </div>

      <div className="flex gap-6 p-6 max-w-full">
        {/* Main Form Column (2/3) */}
        <div className="flex-3/4 space-y-6">
          <QuoteAdminInformation />
          <QuoteItems />
          <QuoteEmailDetails />
        </div>

        {/* Right Column (1/3) */}
        <div className="flex-1/4 space-y-6">
          <QuoteNumber />
          <QuoteAdditionalFiles />
          <QuoteTermsAndConditions />
          <QuoteNotes />
        </div>
      </div>
    </div>
  );
}