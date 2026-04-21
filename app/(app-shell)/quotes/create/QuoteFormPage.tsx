"use client";

import { useEffect } from "react";
import { logQuoteNavigationDebug } from "@/lib/log-quote-navigation-debug";
import QuoteFormProvider from "./QuoteFormProvider";
import QuoteFormContent from "./QuoteFormContent";
import QuoteEditLoader from "../edit/[id]/QuoteEditLoader";

interface QuoteFormPageProps {
  edit?: boolean;
  quoteId?: number;
}

export default function QuoteFormPage({ edit = false, quoteId }: QuoteFormPageProps) {
  useEffect(() => {
    logQuoteNavigationDebug(edit ? "edit_quote_page_loaded" : "create_quote_page_loaded", {
      quoteId: edit ? quoteId ?? null : null,
    });
  }, [edit, quoteId]);

  return (
    <div className="flex flex-1 flex-col">
      <QuoteFormProvider>
        {edit && typeof quoteId === "number" ? <QuoteEditLoader quoteId={quoteId} /> : null}
        <QuoteFormContent edit={edit ? true : undefined} showInitialAdminState={edit} />
      </QuoteFormProvider>
    </div>
  );
}
