import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { EstimateProvider } from "@/contexts/EstimateContext";
import SignOrderContentSimple from "../../SignOrderContentSimple";

export default async function EditSignOrderPage({ params} : {params: any}) {

    const resolvedParams = await params;
    const signId = resolvedParams.id

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
                    <SignOrderContentSimple signOrderId={signId}/>
                </EstimateProvider>
            </SidebarInset>
        </SidebarProvider>
    );
}
