import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ContractViewContent from "./ContractViewContent";

export default function ContractViewPage() {
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
      <SidebarInset className="min-w-0 bg-slate-50">
        <SiteHeader showTitleBlock={false} />
        <ContractViewContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
