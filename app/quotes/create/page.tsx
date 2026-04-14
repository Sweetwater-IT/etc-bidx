"use client";

import QuoteFormProvider from "./QuoteFormProvider";
import QuoteFormContent from "./QuoteFormContent";
import { useEffect } from "react";
import { logQuoteNavigationDebug } from "@/lib/log-quote-navigation-debug";

export default function CreateQuotePage() {
  useEffect(() => {
    logQuoteNavigationDebug("create_quote_page_loaded");
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <QuoteFormProvider>
        <QuoteFormContent />
      </QuoteFormProvider>
    </div>
  );
}
