"use client";

import { SignOrderBuilderProvider } from "@/contexts/SignOrderBuilderContext";
import { FullPageWorkflowFrame } from "@/components/full-page-workflow-frame";
import { SidebarProvider } from "@/components/ui/sidebar";
import SignOrderContentSimple from "./SignOrderContentSimple";

export default function CreateSignOrderPage() {
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
      <FullPageWorkflowFrame>
        <SignOrderBuilderProvider>
          <SignOrderContentSimple />
        </SignOrderBuilderProvider>
      </FullPageWorkflowFrame>
    </SidebarProvider>
  );
}
