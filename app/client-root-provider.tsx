"use client";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/auth-context";

export default function ClientRootProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
} 