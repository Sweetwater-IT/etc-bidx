import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import EditTakeoffPageContent from "./EditTakeoffPageContent";
import TakeoffEditPageHeader from "./TakeoffEditPageHeader";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";

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
          <div className="min-h-screen bg-background">
            {/* Sticky Header */}
            <header className="border-b bg-card sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                <TakeoffEditPageHeader jobId={jobId} takeoffId={takeoffId} />
              </div>
            </header>
            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
              <PageTitleBlock
                title="Edit Takeoff"
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