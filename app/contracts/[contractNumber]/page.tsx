import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import ContractManagementContent from "./ContractManagementContent";


interface PageProps {
  params: Promise<{ contractNumber: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ContractPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const contractNumber = decodeURIComponent(resolvedParams.contractNumber);
    if (searchParams) {
      await searchParams;
    }

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
            <div className="flex items-start w-full gap-2 flex-col">
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
