"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useChat } from "@/contexts/chat-context";
import * as React from "react";

// Inner component that uses both Sidebar and Chat contexts
function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isChatOpen, setPreviousSidebarState } = useChat();
  const { state: sidebarState, toggleSidebar } = useSidebar();

  // Save sidebar state when chat opens and collapse
  React.useEffect(() => {
    if (isChatOpen) {
      // Save current state before collapsing
      setPreviousSidebarState(sidebarState);
      // Collapse the sidebar when chat opens
      if (sidebarState === "expanded") {
        toggleSidebar();
      }
    }
  }, [isChatOpen, sidebarState, setPreviousSidebarState, toggleSidebar]);

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
