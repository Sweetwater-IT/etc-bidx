import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import ActiveBidContent from "./ActiveBidContent";

export default async function ActiveBidPage({params} : {params : any}) {

  const resolvedParams = await params;
  const mode = resolvedParams.mode

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 68)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          {mode === 'view' && <SiteHeader/>}
          <div className="flex flex-1 flex-col -mt-8">
            <ActiveBidContent mode={mode}/>
          </div>
        </SidebarInset>
      </Suspense>
    </SidebarProvider>
  );
}
