"use client";

import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import EditTakeoffPageContent from "./EditTakeoffPageContent";
import { ProjectFooter } from "@/components/ProjectFooter";

export default function EditTakeoffPage({ params }: any) {
  const jobId = params.id;
  const takeoffId = params.takeoffId;

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
        <Suspense fallback={null}>
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-slate-50">
            <EditTakeoffPageContent jobId={jobId} takeoffId={takeoffId} />
            <ProjectFooter />
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );

}
