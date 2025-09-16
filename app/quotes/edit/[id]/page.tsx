// app/quotes/edit/[id]/page.tsx
"use client";

import QuoteFormProvider from "../../create/QuoteFormProvider";
import QuoteFormContent from "../../create/QuoteFormContent";
import QuoteEditLoader from "./QuoteEditLoader";
import React from "react";

export default function EditQuotePage({ params }: any) {
  const resolvedParams : any = React.use(params); 
  const numericId = parseInt((resolvedParams).id, 10);

  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="flex-1 overflow-auto">
        <QuoteFormProvider>
          <QuoteEditLoader quoteId={numericId} />
          <QuoteFormContent showInitialAdminState />
        </QuoteFormProvider>
      </div>
    </div>
  );
}
