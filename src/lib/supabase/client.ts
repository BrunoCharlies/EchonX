import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Missing Supabase URL or anon key (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY)");
  }
  return createBrowserClient(url, key);
}