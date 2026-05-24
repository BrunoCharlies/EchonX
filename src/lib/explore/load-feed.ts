import { createServiceRoleClient } from "@/lib/supabase/service";

export type ExploreFeedPostRow = {
  id: string;
  author_id: string;
  body: string;
  image_paths: string[] | null;
  like_count: number | null;
  external_source: string | null;
  moderation_payload: Record<string, unknown> | null;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_path: string | null;
    kind: string | null;
    owner_x_user_id: string;
    created_at: string | null;
  } | null;
};

/**
 * Global Explore feed: native + curator posts. Uses service role so RLS cannot
 * hide other users' public posts. Excludes mirrored X timeline (external_x).
 */
export async function loadExploreFeedPosts(limit = 50): Promise<ExploreFeedPostRow[]> {
  const supabase = createServiceRoleClient();

  const { data: postRows, error: postsError } = await supabase
    .from("posts")
    .select("id, author_id, body, image_paths, like_count, external_source, moderation_payload, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit * 2, 100));

  if (postsError) {
    console.error("[explore] load posts failed:", postsError.message);
    return [];
  }

  if (!postRows?.length) return [];

  const authorIds = [...new Set(postRows.map((row) => row.author_id as string))];
  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_path, kind, owner_x_user_id, created_at")
    .in("id", authorIds);

  if (profilesError) {
    console.error("[explore] load authors failed:", profilesError.message);
    return [];
  }

  const profileById = new Map((profileRows ?? []).map((row) => [row.id as string, row]));

  return postRows
    .flatMap((row) => {
      const profile = profileById.get(row.author_id as string);
      if (!profile || profile.kind === "external_x") return [];
      return [{
        id: row.id as string,
        author_id: row.author_id as string,
        body: row.body as string,
        image_paths: (row.image_paths as string[] | null) ?? null,
        like_count: (row.like_count as number | null) ?? null,
        external_source: (row.external_source as string | null) ?? null,
        moderation_payload: (row.moderation_payload as Record<string, unknown> | null) ?? null,
        created_at: row.created_at as string,
        profiles: {
          id: profile.id as string,
          username: profile.username as string,
          display_name: (profile.display_name as string | null) ?? null,
          bio: (profile.bio as string | null) ?? null,
          avatar_path: (profile.avatar_path as string | null) ?? null,
          kind: (profile.kind as string | null) ?? null,
          owner_x_user_id: profile.owner_x_user_id as string,
          created_at: (profile.created_at as string | null) ?? null,
        },
      }];
    })
    .slice(0, limit);
}
