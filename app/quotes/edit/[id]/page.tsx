import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import QuoteFormProvider from "../../create/QuoteFormProvider";
import QuoteFormContent from "../../create/QuoteFormContent";
import { useEffect } from "react";
import QuoteEditLoader from "./QuoteEditLoader";
export default function EditQuotePage({ params }: { params: { id: string } }) {
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
