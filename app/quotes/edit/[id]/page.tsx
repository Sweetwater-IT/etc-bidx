import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import QuoteFormProvider from "../../create/QuoteFormProvider";
import QuoteFormContent from "../../create/QuoteFormContent";
import QuoteEditLoader from "./QuoteEditLoader";

type EditQuotePageProps = {
  params: { id: string }
}

export default function EditQuotePage({ params }: EditQuotePageProps) {
    const quoteId = params.id;

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
                    <QuoteEditLoader />
                    <QuoteFormContent />
                </QuoteFormProvider>
            </SidebarInset>
        </SidebarProvider>
    );
}
