import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import EditTakeoffPageContent from "./EditTakeoffPageContent";

export default async function EditTakeoffPage({ params }: any) {
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
          <EditTakeoffPageContent jobId={jobId} takeoffId={takeoffId} />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}