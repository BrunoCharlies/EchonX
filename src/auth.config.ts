import type { NextAuthConfig } from "next-auth";

/** Base Auth.js options (providers are set in `auth.ts` for a single clear OAuth entrypoint). */
export default {
  basePath: "/api/auth",
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  trustHost: true,
} satisfies NextAuthConfig;
