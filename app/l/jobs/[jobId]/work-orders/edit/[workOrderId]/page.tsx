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
          <div className="pb-16">
            <WorkOrderEditContent workOrderId={workOrderId} jobId={jobId} takeoffId={takeoffId} />
            <ProjectFooter />
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
