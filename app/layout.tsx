import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { GlobalLoading } from "@/components/global-loading";
import { Toaster } from "@/components/ui/sonner";
import ClientRootProvider from "./client-root-provider";

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
            {children}
            <GlobalLoading />
            <Toaster />
          </ClientRootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
