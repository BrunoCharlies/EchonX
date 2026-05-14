import { handlers } from "@/auth";

export const runtime = "nodejs";

/** NextAuth / Auth.js App Router — only GET and POST are supported for auth actions. */
export const { GET, POST } = handlers;