import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import BuildShopManager from "./BuildShopManager";

export default function BuildShopPage() {
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
        <BuildShopManager />
      </SidebarInset>
    </SidebarProvider>
  );
}
