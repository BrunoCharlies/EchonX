import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      /** X (Twitter) numeric user id */
      id: string;
      twitterUsername?: string | null;
      /** Application role synced from Supabase `profiles.role` */
      role: "user" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    twitterId?: string;
    twitterUsername?: string | null;
  }
}
