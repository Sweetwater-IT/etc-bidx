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
      const { data, error } = await supabase.rpc("email_exists_in_auth", {
        email_input: user.email,
      });

      if (error) {
        console.error("Error to verify user:", error);
        return false;
      }

      if (!data) {
        console.warn("Email not exist :", user.email);
        return false;
      }

      return true;
    },
    // Otros callbacks opcionales
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + "/";
    },
  },
  pages: {
    signIn: "/password-entry",
  },
}; 