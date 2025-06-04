import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import ActiveBidHeader from "../ActiveBidHeader";
import StepsMain from "@/components/pages/steps-main";
import { EstimateProvider } from "@/contexts/EstimateContext";
import AdminInfoViewOnly from "@/components/pages/active-bid/steps/admin-info-view-only";
import BidViewOnlyContainer from "@/components/pages/active-bid/steps/bid-view-only-container";

function ActiveBidContent({mode} : {mode: string}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div>
            <EstimateProvider>
              <div className="mb-6 px-6">
                <ActiveBidHeader />
              </div>
              {mode === 'view' ? <BidViewOnlyContainer/> : <StepsMain />}
            </EstimateProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          <SiteHeader />
          <div className="flex flex-1 flex-col -mt-8">
            <ActiveBidContent mode={mode}/>
          </div>
        </SidebarInset>
      </Suspense>
    </SidebarProvider>
  );
}
