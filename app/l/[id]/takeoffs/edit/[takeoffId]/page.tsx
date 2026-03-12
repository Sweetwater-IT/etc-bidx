import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
          <div className="min-h-screen bg-background flex flex-col">
            {/* Sticky Header */}
            <header className="border-b bg-card sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2 flex-nowrap shrink-0">
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Edit
                  </Button>
                </div>
              </div>
            </header>
            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 py-8 h-full overflow-y-auto overflow-x-hidden">
                <EditTakeoffPageContent jobId={jobId} takeoffId={takeoffId} />
              </div>
            </div>
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}