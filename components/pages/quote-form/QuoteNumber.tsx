"use client";

import { Badge } from "@/components/ui/badge";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";

export function QuoteNumber() {
  const { emailSent } = useQuoteForm();

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="text-sm">
        Quote Number: <span className="font-medium">0</span>
      </div>
      <Badge 
        variant="outline" 
        className={emailSent ? "bg-green-50 text-green-900" : "bg-brown-50 text-brown-900"}
      >
        {emailSent ? "SENT" : "NOT SENT"}
      </Badge>
    </div>
  );
}