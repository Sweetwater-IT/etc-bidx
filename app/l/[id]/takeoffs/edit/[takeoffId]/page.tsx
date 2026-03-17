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
          <div className="min-h-screen bg-background pb-16">
            <EditTakeoffPageContent jobId={jobId} takeoffId={takeoffId} />
            <ProjectFooter />
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );

}