import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import QuoteFormProvider from "@/app/quotes/create/QuoteFormProvider";
import QuoteFormContent from "@/app/quotes/create/QuoteFormContent";

export default async function CreateQuotePage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <QuoteFormProvider>
          <QuoteFormContent />
        </QuoteFormProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}