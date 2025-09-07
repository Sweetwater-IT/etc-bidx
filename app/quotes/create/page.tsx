// app/quotes/create/page.tsx
import { SidebarProvider } from "@/components/ui/sidebar";
import QuoteFormProvider from "./QuoteFormProvider";
import QuoteFormContent from "./QuoteFormContent";

export default function CreateQuotePage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <div className="flex flex-col h-screen w-screen">
        <div className="flex-1 overflow-auto">
          <QuoteFormProvider>
            <QuoteFormContent />
          </QuoteFormProvider>
        </div>
      </div>
    </SidebarProvider>
  );
}
