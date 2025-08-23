"use client";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GoogleAuthPage() {
  const router = useRouter();

  // Check for auth state changes and session
  useEffect(() => {
    // Remove hash from URL if present
    if (window.location.hash) {
      console.log("Removing hash from URL");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      if (event === "SIGNED_IN" && session) {
        console.log("Signed in, redirecting to /");
        router.push("/");
      }
    });

    // Fallback session check with interval
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Session check error:", error.message);
        return;
      }
      if (session) {
        console.log("Session found, redirecting to /");
        router.push("/");
      }
    };
    checkSession(); // Initial check
    const interval = setInterval(checkSession, 1000); // Check every second
    setTimeout(() => clearInterval(interval), 5000); // Stop after 5 seconds

    // Cleanup listener and interval
    return () => {
      authListener.subscription?.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex relative">
      {/* Top Left Brand */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
        <Image
          src="/logo.jpg"
          alt="ETC Logo"
          width={90}
          height={32}
          className="rounded"
        />
      </div>
      {/* Left: Login Box */}
      <div className="flex flex-col justify-center w-full max-w-md px-8 py-12 bg-white z-10 mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center">Login to your account</h1>
        <p className="mb-6 text-gray-500 text-center text-[13px]">Use your gmail to login to your account</p>
        <form className="space-y-4">
          <button
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 px-4 bg-white text-gray-700 font-semibold shadow-sm transition-all duration-150 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 active:bg-gray-100"
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
              },
            })}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_17_40)">
                <path d="M47.9999 24.552C47.9999 22.864 47.852 21.232 47.5839 19.68H24.4799V28.672H37.8559C37.2799 31.552 35.5199 33.952 32.9599 35.552V41.04H40.7999C45.2799 37.008 47.9999 31.36 47.9999 24.552Z" fill="#4285F4"/>
                <path d="M24.48 48C31.04 48 36.56 45.888 40.8 41.04L32.96 35.552C30.8 37.008 28.08 37.936 24.48 37.936C18.16 37.936 12.8 33.888 10.88 28.112H2.72V33.76C6.96 41.12 15.04 48 24.48 48Z" fill="#34A853"/>
                <path d="M10.88 28.112C10.4 26.656 10.16 25.104 10.16 23.488C10.16 21.872 10.4 20.32 10.88 18.864V13.216H2.72C0.96 16.32 0 19.76 0 23.488C0 27.216 0.96 30.656 2.72 33.76L10.88 28.112Z" fill="#FBBC05"/>
                <path d="M24.48 9.936C28.32 9.936 31.36 11.232 33.6 13.36L41.04 6.08C36.56 2.32 31.04 0 24.48 0C15.04 0 6.96 6.88 2.72 13.216L10.88 18.864C12.8 13.088 18.16 9.936 24.48 9.936Z" fill="#EA4335"/>
              </g>
              <defs>
                <clipPath id="clip0_17_40">
                  <rect width="48" height="48" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            Sign in with Google
          </button>
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
