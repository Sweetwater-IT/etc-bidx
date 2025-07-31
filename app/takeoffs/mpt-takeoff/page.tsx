import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { EstimateProvider } from "@/contexts/EstimateContext";
import MPTOrderContentSimple from "./MPTOrderContentSimple";

export default async function CreateMPTOrderPage() {
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
                    <MPTOrderContentSimple />
                </EstimateProvider>
            </SidebarInset>
        </SidebarProvider>
    );
}
