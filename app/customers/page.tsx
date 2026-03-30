import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import CustomersContent from "./CustomersContent";

export default function CustomersPage() {

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
                <SiteHeader customTitle="Customers" />
                <div className="@container/main flex flex-1 flex-col py-4 gap-2 md:gap-6 md:py-6">
                    <CustomersContent />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
} 
