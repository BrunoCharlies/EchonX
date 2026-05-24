import { createServiceRoleClient } from "@/lib/supabase/service";

export type PublicProfileRow = Record<string, unknown> & {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  cover_path?: string | null;
  kind: string | null;
  owner_x_user_id: string;
  created_at: string | null;
  role?: string | null;
  last_seen_at?: string | null;
};

export async function loadPublicProfileByUsername(username: string): Promise<PublicProfileRow | null> {
  const handle = username.trim().toLowerCase().replace(/^@/, "");
  if (!handle) return null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("username", handle).maybeSingle();

  if (error) {
    console.error("[profile] load by username failed:", error.message);
    return null;
  }

  return data as PublicProfileRow | null;
}

export async function loadPublicPostsByAuthorId(authorId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[profile] load posts failed:", error.message);
    return [];
  }

  return data ?? [];
}
