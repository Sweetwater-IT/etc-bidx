import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import WorkOrderNewContent from "./WorkOrderNewContent";
import { ProjectFooter } from "@/components/ProjectFooter";

export default async function WorkOrderNewPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ takeoffId?: string }>;
}) {
  const { jobId } = await params;
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
            <WorkOrderNewContent jobId={jobId} takeoffId={takeoffId} />
            <ProjectFooter />
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
