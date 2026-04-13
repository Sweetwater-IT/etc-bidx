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
    <div className="flex flex-1 flex-col">
      <QuoteFormProvider>
        <QuoteEditLoader quoteId={numericId} />
        <QuoteFormContent edit={true} showInitialAdminState />
      </QuoteFormProvider>
    </div>
  );
}
