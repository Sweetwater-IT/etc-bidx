'use client';

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { GlobalLoading } from "@/components/global-loading";
import { Toaster } from "@/components/ui/sonner";
import ClientRootProvider from "./client-root-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import '../styles/react-pdf.css';

export const metadata: Metadata = {
  title: "ETC",
  description: "ETC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientRootProvider>
            <SidebarProvider
              style={{
                "--sidebar-width": "calc(var(--spacing) * 68)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties}
            >
              <AppSidebar variant="inset" />
              <SidebarInset>
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
      </body>
    </html>
  );
}
