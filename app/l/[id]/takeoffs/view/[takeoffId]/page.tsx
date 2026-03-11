'use client';

import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TakeoffViewContent from '../../create/[takeoffId]/TakeoffViewContent';

export default async function TakeoffViewPage({ params }: any) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;
  const takeoffId = resolvedParams.takeoffId;

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
            <div className="max-w-7xl mx-auto px-4 py-8">
              <TakeoffViewContent jobId={jobId} takeoffId={takeoffId} />
            </div>
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
