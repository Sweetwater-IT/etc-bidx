"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuoteForm } from "./QuoteFormProvider";
import { QuoteAdminInformation } from "@/components/pages/quote-form/QuoteAdminInformation";
import { QuoteItems } from "@/components/pages/quote-form/QuoteItems";
import { QuoteEmailDetails } from "@/components/pages/quote-form/QuoteEmailDetails";
import { QuoteNumber } from "@/components/pages/quote-form/QuoteNumber";
import { QuoteAdditionalFiles } from "@/components/pages/quote-form/QuoteAdditionalFiles";
import { QuoteTermsAndConditions } from "@/components/pages/quote-form/QuoteTermsAndConditions";
import { QuoteNotes } from "@/components/pages/quote-form/QuoteNotes";
import { sendQuoteEmail } from "@/lib/api-client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function QuoteFormContent() {
  const {
    selectedCustomers,
    selectedEmail,
    emailSent,
    emailError,
    sending,
    setSending,
    setEmailSent,
    setEmailError,
    quoteId
  } = useQuoteForm();

  const handleSendQuote = async () => {
    const targetEmail = selectedEmail || process.env.SENDGRID_TO_EMAIL || "ndunn@establishedtraffic.com";
    
    setSending(true);
    setEmailError(null);
    
    try {
      const success = await sendQuoteEmail(targetEmail, {
        quoteId,
        customerName: selectedCustomers.join(", "),
        projectName: "Sample Project",
        totalAmount: 1250.00,
        createdBy: "System User",
        createdAt: format(new Date(), "PPP"),
      });
      
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
          {emailSent && (
            <Badge className="bg-green-100 text-green-800 ml-2">
              Email Sent Successfully
            </Badge>
          )}
          {emailError && (
            <Badge className="bg-red-100 text-red-800 ml-2">
              {emailError}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Preview Quote</Button>
          <Button 
            onClick={handleSendQuote} 
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Quote"}
          </Button>
          <Button variant="outline">Download</Button>
        </div>
      </div>

      <div className="flex gap-6 p-6">
        {/* Main Form Column (2/3) */}
        <div className="flex-[2] space-y-6">
          <QuoteAdminInformation />
          <QuoteItems />
          <QuoteEmailDetails/>
        </div>

        {/* Right Column (1/3) */}
        <div className="flex-1 space-y-6">
          <QuoteNumber />
          <QuoteAdditionalFiles />
          <QuoteTermsAndConditions />
          <QuoteNotes />
        </div>
      </div>
    </div>
  );
}