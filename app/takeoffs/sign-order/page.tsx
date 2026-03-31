"use client";

import { SignOrderBuilderProvider } from "@/contexts/SignOrderBuilderContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import SignOrderContentSimple from "./SignOrderContentSimple";

export default function CreateSignOrderPage() {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 68)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <div className="flex h-screen w-screen flex-col">
                <div className="flex-1 overflow-auto">
                    <SignOrderBuilderProvider>
                        <SignOrderContentSimple />
                    </SignOrderBuilderProvider>
                </div>
            </div>
        </SidebarProvider>
    );
}
