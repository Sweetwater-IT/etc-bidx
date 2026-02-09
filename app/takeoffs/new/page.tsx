import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { EstimateProvider } from "@/contexts/EstimateContext";
import SignOrderContentSimple from "../sign-order/SignOrderContentSimple";


export default async function NewSignOrderPage() {
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
                    <EstimateProvider>
                        <SignOrderContentSimple/>
                    </EstimateProvider>
            </SidebarInset>
        </SidebarProvider>
    );
}