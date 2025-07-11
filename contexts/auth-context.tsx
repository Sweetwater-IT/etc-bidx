"use client";

import { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signOut: () => void;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user = session?.user ?? null;
  const loading = status === "loading";
  const isAuthorized = !!user;

  const signInWithGoogle = () => signIn("google");
  const handleSignOut = () => signOut();

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut: handleSignOut,
    isAuthorized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 