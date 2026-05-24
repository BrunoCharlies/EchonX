/** Turn PostgREST / Supabase errors into readable messages (safe for UI). */
export function formatSupabaseError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const row = error as { message?: unknown; code?: unknown; details?: unknown };
    const message = typeof row.message === "string" ? row.message.trim() : "";
    const code = typeof row.code === "string" ? row.code : "";
    if (message && code) return `${message} (${code})`;
    if (message) return message;
    if (code) return `${fallback} (${code})`;
  }
  return fallback;
}
