import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import CustomersContent from "./CustomersContent";

export default function CustomersPage() {
    return (
        <SidebarProvider
            className="h-svh overflow-hidden"
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 68)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="h-full min-h-0 overflow-hidden">
                <SiteHeader showTitleBlock={false} />
                <CustomersContent />
            </SidebarInset>
        </SidebarProvider>
    );
} 
