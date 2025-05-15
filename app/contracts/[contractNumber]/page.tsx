import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import ContractManagementContent from "./ContractManagementContent";


export default async function ContractPage( { params } : { params: { contractNumber: string }}) {
    const resolvedParams = await params;
    const contractNumber = decodeURIComponent(resolvedParams.contractNumber);

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
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <div className="flex items-start gap-2 flex-col">
              <div className="text-sm text-muted-foreground">
                Dashboard
                <span className="mx-2">/</span>
                Contract Manager
              </div>
              <ContractManagementContent contractNumber={contractNumber}/>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
