import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import WorkOrderDetail from "../[workOrderId]/WorkOrderDetail";

export default async function WorkOrderNewPage({
  searchParams,
}: {
  searchParams: Promise<{ takeoffId?: string }>;
}) {
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
          <WorkOrderDetail workOrderId="new" takeoffId={takeoffId} mode="edit" />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}