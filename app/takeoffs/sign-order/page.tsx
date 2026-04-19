"use client";

import { SignOrderBuilderProvider } from "@/contexts/SignOrderBuilderContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import SignOrderContentSimple from "./SignOrderContentSimple";
import { FullPageWorkflowFrame } from "./layout";

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
