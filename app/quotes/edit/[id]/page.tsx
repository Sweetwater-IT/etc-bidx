// app/quotes/edit/[id]/page.tsx
import QuoteFormProvider from "../../create/QuoteFormProvider";
import QuoteFormContent from "../../create/QuoteFormContent";
import QuoteEditLoader from "./QuoteEditLoader";

export default function EditQuotePage({ params }: { params: { id: string } }) {
  const numericId = parseInt(params.id, 10);

  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="flex-1 overflow-auto">
        <QuoteFormProvider>
          <QuoteEditLoader quoteId={numericId} />
          <QuoteFormContent />
        </QuoteFormProvider>
      </div>
    </div>
  );
}
