import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";
import authConfig from "@/auth.config";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const devOnlySecretFallback = "echonx-dev-insecure-placeholder-min-32-chars!!";
const resolvedSecret = authSecret || (process.env.NODE_ENV !== "production" ? devOnlySecretFallback : "");

if (!resolvedSecret) {
  throw new Error(
    "Missing AUTH_SECRET (or NEXTAUTH_SECRET). Add it to `.env.local` or run `npm run auth:secret`.",
  );
}

if (!authSecret && process.env.NODE_ENV !== "production") {
  console.warn("[auth] AUTH_SECRET missing — using dev-only fallback.");
}

if (process.env.NODE_ENV === "development" && process.env.NEXT_RUNTIME !== "edge") {
  const idLen = (process.env.TWITTER_CLIENT_ID ?? "").length;
  const secLen = (process.env.TWITTER_CLIENT_SECRET ?? "").length;
  console.log(`[auth] Twitter OAuth: clientId ${idLen} chars, clientSecret ${secLen} chars (values not logged).`);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: resolvedSecret,
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "twitter" && account.access_token) {
        const me = await fetch(
          "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
          { headers: { Authorization: `Bearer ${account.access_token}` } },
        );
        if (me.ok) {
          const json = (await me.json()) as {
            data?: { id: string; username?: string; name?: string; profile_image_url?: string };
          };
          const data = json.data;
          if (data?.id) {
            token.twitterId = data.id;
            token.sub = data.id;
            token.twitterUsername = data.username ?? null;
            token.name = data.name ?? token.name;
            token.picture = data.profile_image_url ?? token.picture;
            await import("@/lib/sync/twitter-to-supabase").then((m) =>
              m.syncTwitterUserToSupabase({
                twitterUserId: data.id,
                twitterUsername: data.username,
                displayName: data.name,
                profileImageUrl: data.profile_image_url,
              }),
            );
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.twitterId as string) ?? (token.sub as string);
        session.user.twitterUsername = (token.twitterUsername as string | null | undefined) ?? null;
        try {
          const { createServiceRoleClient } = await import("@/lib/supabase/service");
          const supabase = createServiceRoleClient();
          const { data } = await supabase.from("profiles").select("role").eq("owner_x_user_id", session.user.id).maybeSingle();
          session.user.role = data?.role === "admin" ? "admin" : "user";
        } catch {
          session.user.role = "user";
        }
      }
      return session;
    },
  },
});
