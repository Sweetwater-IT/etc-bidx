"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";

let supabase;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signOut: () => void;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (!supabase) {
      // Mock logged in for testing dashboard
      setUser({ id: 'mock', email: 'test@example.com' });
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/password-entry") {
      router.replace("/password-entry"); 
    }
  }, [user, loading, router, pathname]);

  if (loading || (!user && pathname !== "/password-entry")) return null;

  const signInWithGoogle = () => {
    if (!supabase) return;
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    if (!supabase) {
      setUser(null);
      router.replace("/password-entry");
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/password-entry");
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut: handleSignOut,
    isAuthorized: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
