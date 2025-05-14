// lib/auth.ts
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Opzioni globali per il provider Google
      authorization: {
        params: {
          // Questo forza Google a mostrare sempre la pagina di selezione dell'account
          prompt: "select_account",
          // Accesso alle informazioni del profilo e dell'email
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    async session({ session, token, user }) {
      // Stessa logica di prima
      if (token && session?.user) {
        session.user.id = token.sub || "";
      } else if (user && session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback called with:', { url, baseUrl });
      
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
