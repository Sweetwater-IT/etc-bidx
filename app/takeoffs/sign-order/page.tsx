import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { EstimateProvider } from "@/contexts/EstimateContext";
import SignOrderContentSimple from "./SignOrderContentSimple";

export default async function CreateSignOrderPage() {
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
                <SiteHeader>
                    <h1 className="text-3xl font-bold mt-2 ml-0">Create Sign Order</h1>
                </SiteHeader>
                <EstimateProvider>
                    <SignOrderContentSimple />
                </EstimateProvider>
            </SidebarInset>
        </SidebarProvider>
    );
}
