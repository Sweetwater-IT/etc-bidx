"use client";

import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import EditTakeoffPageContent from "./EditTakeoffPageContent";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { useJobFromDB } from "@/hooks/useJobFromDB";

export default function EditTakeoffPage({ params }: any) {
  const jobId = params.id;
  const takeoffId = params.takeoffId;
  const { data: dbJob } = useJobFromDB(jobId);
  const jobName = dbJob?.projectInfo?.projectName || "Untitled Project";

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
        <Suspense fallback={null}>
          <div className="min-h-screen bg-background">
            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
              <PageTitleBlock
                title={`Edit Takeoff for ${jobName}`}
                description="Update takeoff details, materials, and scheduling information."
              />
              <EditTakeoffPageContent jobId={jobId} takeoffId={takeoffId} />
            </div>
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}