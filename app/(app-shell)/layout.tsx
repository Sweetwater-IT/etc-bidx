"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { FullPageWorkflowFrame } from "@/components/full-page-workflow-frame";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import * as React from "react";
import { usePathname } from "next/navigation";

const FULL_PAGE_WORKFLOW_PATHS = new Set([
  "/active-bid/new",
  "/quotes/create",
]);

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPageWorkflow = pathname ? FULL_PAGE_WORKFLOW_PATHS.has(pathname) : false;

  if (isFullPageWorkflow) {
    return <FullPageWorkflowFrame>{children}</FullPageWorkflowFrame>;
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset className="h-full min-h-0 overflow-hidden">
        <SiteHeader showTitleBlock={false} />
        {children}
      </SidebarInset>
    </>
  );
}

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--sidebar-width-icon": "calc(var(--spacing) * 16)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
