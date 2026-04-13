// app/quotes/create/page.tsx
import QuoteFormProvider from "./QuoteFormProvider";
import QuoteFormContent from "./QuoteFormContent";

export default function CreateQuotePage() {
  return (
    <div className="flex flex-1 flex-col">
      <QuoteFormProvider>
        <QuoteFormContent />
      </QuoteFormProvider>
    </div>
  );
}
