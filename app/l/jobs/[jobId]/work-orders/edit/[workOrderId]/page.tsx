import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import WorkOrderEditContent from "./WorkOrderEditContent";
import { ProjectFooter } from "@/components/ProjectFooter";

export default async function WorkOrderEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ workOrderId: string; jobId: string }>;
  searchParams: Promise<{ takeoffId?: string }>;
}) {
  const { workOrderId, jobId } = await params;
  const { takeoffId } = await searchParams;

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
        <Suspense fallback={<div>Loading work order...</div>}>
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <WorkOrderEditContent workOrderId={workOrderId} jobId={jobId} takeoffId={takeoffId} />
                <ProjectFooter />
              </div>
            </div>
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
