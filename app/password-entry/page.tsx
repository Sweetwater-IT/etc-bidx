"use client";

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function GoogleAuthPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen flex relative">
      {/* Top Left Brand */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
        <span className="font-bold text-lg">Established Traffic Control</span>
      </div>
      {/* Left: Login Box */}
      <div className="flex flex-col justify-center w-full max-w-md px-8 py-12 bg-white z-10 mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center">Login to your account</h1>
        <p className="mb-6 text-gray-500 text-center text-[13px]">Use your gmail to login to your account</p>
        <form className="space-y-4">
          <Button 
            onClick={signInWithGoogle} 
            className="w-full" 
            variant="outline"
            disabled={loading}
            type="button"
          >
            {loading ? 'Loading...' : 'Sign in with Google'}
          </Button>
        </form>
      </div>
      {/* Right: Truck Image */}
      <div className="hidden md:block flex-1 relative bg-gray-100">
        <Image
          src="/etc-truck.jpg"
          alt="ETC Truck"
          layout="fill"
          objectFit="cover"
          className="rounded-r-lg"
          priority
        />
      </div>
    </div>
  );
} 