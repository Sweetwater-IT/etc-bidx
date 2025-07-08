"use client";

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export default function GoogleAuthPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in to Access</h1>
        <Button 
          onClick={signInWithGoogle} 
          className="w-full" 
          variant="outline"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Sign in with Google'}
        </Button>
      </div>
    </div>
  );
} 