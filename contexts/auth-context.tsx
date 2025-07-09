"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  // Check if user exists in our users table
  const checkUserAuthorization = async (email: string) => {
    try {
      const { data: allowedUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !allowedUser) {
        console.log('User not authorized:', email);
        return false;
      }

      console.log('User authorized:', allowedUser);
      return true;
    } catch (error) {
      console.error('Error checking user authorization:', error);
      return false;
    }
  };

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSession(session);
          
          // Check if user is authorized
          const authorized = await checkUserAuthorization(session.user.email!);
          setIsAuthorized(authorized);
          
          if (!authorized) {
            // User not authorized - sign them out immediately
            toast.error('Access denied. You are not authorized to use this application.');
            await supabase.auth.signOut();
            router.push('/password-entry');
          } else {
            // User authorized - redirect to dashboard
            toast.success('Welcome!');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsAuthorized(false);
          router.push('/password-entry');
        }
        
        setLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        checkUserAuthorization(session.user.email!).then(setIsAuthorized);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    console.log('Current URL:', window.location.origin);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      
      if (error) {
        console.error('OAuth error:', error);
        toast.error('Google sign-in failed. Please try again.');
      } else {
        console.log('OAuth data:', data);
        toast.success('Redirecting to Google sign-in...');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      toast.error('An unexpected error occurred during sign-in.');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 