import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import CreateWorkOrderPageContent from "./CreateWorkOrderPageContent";

export default async function CreateWorkOrderPage({ params }: any) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

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
          <CreateWorkOrderPageContent jobId={id} />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}