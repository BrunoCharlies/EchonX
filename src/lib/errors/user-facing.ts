import { formatSupabaseError } from "@/lib/billing/supabase-error";

/** Maps internal errors to plain language without vendor or stack details. */
export function formatUserFacingError(error: unknown, fallback: string): string {
  const raw = formatSupabaseError(error, fallback);
  return raw
    .replace(/supabase/gi, "EchonX")
    .replace(/postgrest/gi, "database")
    .replace(/postgres/gi, "database")
    .replace(/sightengine/gi, "safety review")
    .replace(/edge function/gi, "automated review")
    .replace(/schema cache/gi, "database")
    .replace(/\.sql/gi, "")
    .replace(/migration\s+\S+/gi, "setup")
    .trim();
}
