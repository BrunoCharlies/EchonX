/**
 * Centralized environment access. Supports both NEXT_PUBLIC_* and plain names from .env.
 */

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Public support inbox for privacy requests and billing help. */
export function getSupportEmail() {
  return (
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    "support@echonx.app"
  );
}

const PRODUCTION_FALLBACK_ORIGIN = "https://echonx.app";

function normalizeOriginCandidate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let candidate = trimmed.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, "")}`;
  }
  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

/** Canonical browser origin for auth callbacks, Stripe redirects, and password reset links. */
export function getAppOrigin() {
  for (const value of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL,
  ]) {
    if (value == null) continue;
    const origin = normalizeOriginCandidate(value);
    if (origin) return origin;
  }
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return PRODUCTION_FALLBACK_ORIGIN;
  }
  return "http://localhost:3002";
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY ?? "";
}

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY ?? "";
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "";
}

export function getXBearerToken() {
  return process.env.X_BEARER_TOKEN ?? process.env.TWITTER_BEARER_TOKEN ?? "";
}

/** Server-only — never expose to the client. */
export function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() ?? "";
}
