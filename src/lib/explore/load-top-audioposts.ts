import { createServiceRoleClient } from "@/lib/supabase/service";
import { prepareTextForSpeech } from "@/lib/voice/speech-text";

export type TopAudiopostItem = {
  postId: string;
  playCount: number;
  body: string;
  excerpt: string;
  authorDisplayName: string;
  authorUsername: string;
  authorKind: string | null;
  authorOwnerXUserId: string | null;
};

const EXCERPT_MAX = 96;

function excerptFromBody(body: string) {
  const prepared = prepareTextForSpeech(body);
  if (prepared.length <= EXCERPT_MAX) return prepared;
  const slice = prepared.slice(0, EXCERPT_MAX);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace >= Math.floor(EXCERPT_MAX * 0.5)) {
    return `${slice.slice(0, lastSpace).trim()}…`;
  }
  return `${slice.trim()}…`;
}

async function rankPostsByReads(limit: number) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("get_top_audioposts", { p_limit: limit });

  if (!error) {
    return (data ?? []) as { post_id: string; play_count: number }[];
  }

  if (error.code !== "42883" && !error.message?.includes("get_top_audioposts")) {
    console.error("[loadTopAudioposts] rpc failed", error);
  }

  const { data: rows, error: fallbackErr } = await supabase.from("text_read_events").select("post_id").limit(20_000);
  if (fallbackErr) {
    if (fallbackErr.code !== "PGRST205") console.error("[loadTopAudioposts] fallback failed", fallbackErr);
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const id = row.post_id as string;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([post_id, play_count]) => ({ post_id, play_count }));
}

export async function loadTopAudioposts(limit = 10): Promise<TopAudiopostItem[]> {
  const ranked = await rankPostsByReads(limit);
  const postIds = ranked.map((row) => row.post_id).filter(Boolean);
  if (!postIds.length) return [];

  const supabase = createServiceRoleClient();
  const { data: posts, error: postsErr } = await supabase.from("posts").select("id, body, author_id").in("id", postIds);

  if (postsErr) {
    console.error("[loadTopAudioposts] posts", postsErr);
    return [];
  }

  const authorIds = [...new Set((posts ?? []).map((post) => post.author_id as string).filter(Boolean))];
  const { data: profileRows, error: profilesErr } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, kind, owner_x_user_id")
        .in("id", authorIds)
    : { data: [], error: null };

  if (profilesErr) {
    console.error("[loadTopAudioposts] profiles", profilesErr);
    return [];
  }

  const profileMap = new Map((profileRows ?? []).map((profile) => [profile.id as string, profile]));
  const postMap = new Map((posts ?? []).map((post) => [post.id as string, post]));
  const rankMap = new Map(ranked.map((row) => [row.post_id, Number(row.play_count) || 0]));

  return postIds
    .map((postId) => {
      const post = postMap.get(postId);
      if (!post?.id) return null;
      const profile = profileMap.get(post.author_id as string);
      const username = String(profile?.username ?? "profile");
      const displayName = String(profile?.display_name ?? username);
      const body = String(post.body ?? "");
      return {
        postId,
        playCount: rankMap.get(postId) ?? 0,
        body,
        excerpt: excerptFromBody(body),
        authorDisplayName: displayName,
        authorUsername: username,
        authorKind: (profile?.kind as string | null) ?? null,
        authorOwnerXUserId: (profile?.owner_x_user_id as string | null) ?? null,
      };
    })
    .filter((item): item is TopAudiopostItem => item !== null);
}
