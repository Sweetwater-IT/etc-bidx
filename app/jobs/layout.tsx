"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hideTitleBlock = pathname === "/jobs/available"

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
        <SiteHeader showTitleBlock={!hideTitleBlock} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
