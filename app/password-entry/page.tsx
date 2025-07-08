"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function GoogleAuthPage() {
  const router = useRouter();

  // Check for session on mount and redirect if authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log(session);
        router.replace('/'); // Redirect to dashboard
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      toast.error('Google sign-in failed. Please try again.');
    } else {
      toast.success('Redirecting to Google sign-in...');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in to Access</h1>
        <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
} 