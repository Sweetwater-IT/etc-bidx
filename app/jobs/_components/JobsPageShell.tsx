import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface JobsPageShellProps {
  children: ReactNode;
  showTitleBlock?: boolean;
}

export function JobsPageShell({
  children,
  showTitleBlock = true,
}: JobsPageShellProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader showTitleBlock={showTitleBlock} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
