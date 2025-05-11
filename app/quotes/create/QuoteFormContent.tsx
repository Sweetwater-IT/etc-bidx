"use client";

import { Button } from "@/components/ui/button";
import { useQuoteForm } from "./QuoteFormProvider";
import { QuoteAdminInformation } from "@/components/pages/quote-form/QuoteAdminInformation";
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
    selectedEmail,
    emailSent,
    emailError,
    sending,
    setSending,
    setEmailSent,
    setEmailError,
    quoteId,
    quoteItems
  } = useQuoteForm();

  // Calculate the total for all items
  const calculateTotal = () => {
    if (!quoteItems?.length) return 0;

    return quoteItems.reduce((acc, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const discount = item.discount || 0;
      const discountType = item.discountType || 'percentage';
      
      const basePrice = quantity * unitPrice;
      const discountAmount = discountType === 'dollar' ? discount : (basePrice * (discount / 100));
      
      return acc + (basePrice - discountAmount);
    }, 0);
  };

  const handleSendQuote = async () => {
    const targetEmail = selectedEmail || process.env.SENDGRID_TO_EMAIL || "ndunn@establishedtraffic.com";
    
    setSending(true);
    setEmailError(null);
    
    try {
      const success = await sendQuoteEmail(targetEmail, {
        quoteId,
        customerName: selectedCustomers.join(", "),
        projectName: "Sample Project",
        totalAmount: calculateTotal(),
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