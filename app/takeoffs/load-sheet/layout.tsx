import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function LoadSheetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

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
        <SiteHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold mt-2 ml-0">Sign Order List</h1>
            <div className="flex gap-3">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push('/takeoffs/sign-order')}
                  size="sm"
                >
                  <IconPlus className="h-4 w-4 -mr-[3px] mt-[2px]" />
                  Create sign order
                </Button>
              </div>
            </div>
          </div>
        </SiteHeader>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
