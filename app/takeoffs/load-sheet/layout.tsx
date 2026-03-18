import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function LoadSheetLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
            <h1 className="mt-2 ml-0 text-3xl font-bold">Sign Order List</h1>
            <Button asChild size="sm">
              <Link href="/takeoffs/sign-order">
                <IconPlus className="mt-[2px] h-4 w-4 -mr-[3px]" />
                Create sign order
              </Link>
            </Button>
          </div>
        </SiteHeader>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
