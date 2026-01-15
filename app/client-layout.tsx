'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from "next-themes";
import { GlobalLoading } from "@/components/global-loading";
import { Toaster } from "@/components/ui/sonner";
import ClientRootProvider from "./client-root-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  if (pathname === '/password-entry') {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ClientRootProvider>
          <GlobalLoading />
          <Toaster />
          {children}
        </ClientRootProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClientRootProvider>
        <SidebarProvider
          key={pathname} // Prevent re-mount on route change
          style={{
            "--sidebar-width": "calc(var(--spacing) * 68)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties}
        >
          <AppSidebar variant="inset" />
          <SidebarInset className="transition-opacity duration-200 ease-in-out">
            <SiteHeader />
            <main className="flex-1">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <GlobalLoading />
        <Toaster />
      </ClientRootProvider>
    </ThemeProvider>
  );
}
