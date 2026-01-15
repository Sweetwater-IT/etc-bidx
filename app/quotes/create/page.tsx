// app/quotes/create/page.tsx
import QuoteFormProvider from "./QuoteFormProvider";
import QuoteFormContent from "./QuoteFormContent";

export default function CreateQuotePage() {
  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="flex-1 overflow-auto">
        <QuoteFormProvider>
          <QuoteFormContent />
        </QuoteFormProvider>
      </div>
    </div>
  );
}
