import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quoteId } = await params; // Await the params Promise

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
          <QuoteEditLoader quoteId={quoteId} />
          <QuoteFormContent />
        </QuoteFormProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
