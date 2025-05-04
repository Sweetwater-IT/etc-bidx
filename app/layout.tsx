import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { GlobalLoading } from "@/components/global-loading";
import { Toaster } from "@/components/ui/sonner";

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
            {children}
            <GlobalLoading />
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
