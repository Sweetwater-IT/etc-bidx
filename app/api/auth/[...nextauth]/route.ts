import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow users in the Supabase users table
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();
      if (error || !data) {
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      // Optionally add user info from DB to session
      session.user.id = token.sub;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home page after login
      return baseUrl + "/";
    },
  },
  pages: {
    signIn: "/password-entry",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 