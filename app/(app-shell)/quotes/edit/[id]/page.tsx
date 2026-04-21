// app/quotes/edit/[id]/page.tsx
"use client";

import React from "react";
import QuoteFormPage from "../../create/QuoteFormPage";

export default function EditQuotePage({ params }: any) {
  const resolvedParams: any = React.use(params);
  const numericId = parseInt((resolvedParams).id, 10);

  return <QuoteFormPage edit quoteId={numericId} />;
}
