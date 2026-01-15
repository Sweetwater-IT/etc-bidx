import type { Metadata } from "next";
import type { ReactNode } from 'react';
import "./globals.css";
import ClientLayout from "./client-layout";
import '../styles/react-pdf.css';

export const metadata: Metadata = {
  title: "ETC",
  description: "ETC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
