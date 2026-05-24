import { createServiceRoleClient } from "@/lib/supabase/service";
import { loadTopAudioposts, type TopAudiopostItem } from "@/lib/explore/load-top-audioposts";

export type ExploreTrendingCreator = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  listenCount: number;
};

export type ExploreRecommendation = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  bio: string | null;
};

export type ExploreActivityItem = {
  id: string;
  type: "like" | "comment" | "follow";
  actorUsername: string;
  actorDisplayName: string;
  targetLabel: string;
  createdAt: string;
};

export type ExploreFollowedActive = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  kind: string;
  newPosts: number;
  listeningNow: boolean;
};

export type ExploreFeedSignals = {
  creatorsPosting: number;
  nativePosts: number;
  totalListens: number;
  totalInteractions: number;
};

export type ExploreSidebarStats = {
  postsThisWeek: number;
  xFollowing: number;
  nativeFollowing: number;
};

async function listenCountByAuthor(limit: number): Promise<[string, number][]> {
  const supabase = createServiceRoleClient();
  const { data: events } = await supabase.from("text_read_events").select("post_id").limit(5000);
  if (!events?.length) return [];

  const postIds = [...new Set(events.map((e) => e.post_id as string).filter(Boolean))];
  const { data: posts } = await supabase.from("posts").select("id, author_id").in("id", postIds.slice(0, 500));
  const postAuthor = new Map((posts ?? []).map((p) => [p.id as string, p.author_id as string]));

  const counts = new Map<string, number>();
  for (const row of events) {
    const authorId = postAuthor.get(row.post_id as string);
    if (!authorId) continue;
    counts.set(authorId, (counts.get(authorId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export async function loadTrendingCreators(limit = 5): Promise<ExploreTrendingCreator[]> {
  const ranked = await listenCountByAuthor(limit);
  if (!ranked.length) return [];

  const supabase = createServiceRoleClient();
  const ids = ranked.map(([id]) => id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, kind")
    .in("id", ids)
    .neq("kind", "external_x");

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  return ranked
    .map(([id, listenCount]) => {
      const p = profileMap.get(id);
      if (!p) return null;
      return {
        id,
        username: String(p.username),
        displayName: String(p.display_name ?? p.username),
        avatarPath: (p.avatar_path as string | null) ?? null,
        listenCount,
      };
    })
    .filter((x): x is ExploreTrendingCreator => x !== null);
}

export async function loadRecommendedProfiles(
  viewerId: string | undefined,
  followedIds: Set<string>,
  limit = 4,
): Promise<ExploreRecommendation[]> {
  const supabase = createServiceRoleClient();
  const query = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, bio, kind")
    .in("kind", ["native", "curator"])
    .order("created_at", { ascending: false })
    .limit(limit + followedIds.size + 5);

  const { data } = await query;
  return (data ?? [])
    .filter((p) => p.id !== viewerId && !followedIds.has(p.id as string))
    .slice(0, limit)
    .map((p) => ({
      id: p.id as string,
      username: String(p.username),
      displayName: String(p.display_name ?? p.username),
      avatarPath: (p.avatar_path as string | null) ?? null,
      bio: (p.bio as string | null) ?? null,
    }));
}

export async function loadRecentActivity(limit = 5): Promise<ExploreActivityItem[]> {
  const supabase = createServiceRoleClient();
  const items: ExploreActivityItem[] = [];

  const { data: likes } = await supabase
    .from("post_likes")
    .select("post_id, created_at, liker_x_user_id, posts:post_id(body)")
    .order("created_at", { ascending: false })
    .limit(limit);

  for (const like of likes ?? []) {
    const postBody = Array.isArray(like.posts) ? like.posts[0]?.body : (like.posts as { body?: string } | null)?.body;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", like.liker_x_user_id as string)
      .maybeSingle();
    items.push({
      id: `like-${like.post_id}-${like.liker_x_user_id}`,
      type: "like",
      actorUsername: String(profile?.username ?? "user"),
      actorDisplayName: String(profile?.display_name ?? "Someone"),
      targetLabel: String(postBody ?? "a post").slice(0, 40),
      createdAt: like.created_at as string,
    });
  }

  const { data: comments } = await supabase
    .from("post_comments")
    .select("id, created_at, body, profiles:author_profile_id(username, display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  for (const comment of comments ?? []) {
    const prof = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
    items.push({
      id: `comment-${comment.id}`,
      type: "comment",
      actorUsername: String(prof?.username ?? "user"),
      actorDisplayName: String(prof?.display_name ?? "Someone"),
      targetLabel: String(comment.body ?? "").slice(0, 40),
      createdAt: comment.created_at as string,
    });
  }

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function loadFollowedProfilesActive(
  viewerId: string | undefined,
): Promise<ExploreFollowedActive[]> {
  if (!viewerId) return [];
  const supabase = createServiceRoleClient();

  const { data: follows } = await supabase
    .from("want_to_hear")
    .select("target_profile_id")
    .eq("listener_x_user_id", viewerId)
    .limit(8);

  const ids = (follows ?? []).map((f) => f.target_profile_id as string).filter(Boolean);
  if (!ids.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, kind")
    .in("id", ids);

  const { data: queue } = await supabase
    .from("listening_queue")
    .select("post_id, consumed_at, posts:post_id(author_id)")
    .eq("listener_x_user_id", viewerId)
    .is("consumed_at", null);

  const newByAuthor = new Map<string, number>();
  for (const row of queue ?? []) {
    const post = Array.isArray(row.posts) ? row.posts[0] : row.posts;
    const authorId = (post as { author_id?: string } | null)?.author_id;
    if (!authorId) continue;
    newByAuthor.set(authorId, (newByAuthor.get(authorId) ?? 0) + 1);
  }

  return (profiles ?? []).slice(0, 4).map((p) => ({
    id: p.id as string,
    username: String(p.username),
    displayName: String(p.display_name ?? p.username),
    avatarPath: (p.avatar_path as string | null) ?? null,
    kind: String(p.kind ?? "native"),
    newPosts: newByAuthor.get(p.id as string) ?? 0,
    listeningNow: (newByAuthor.get(p.id as string) ?? 0) > 0,
  }));
}

export async function loadExploreSidebarStats(viewerId: string | undefined): Promise<ExploreSidebarStats> {
  const supabase = createServiceRoleClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let postsThisWeek = 0;
  if (viewerId) {
    const { count } = await supabase
      .from("text_read_events")
      .select("*", { count: "exact", head: true })
      .eq("listener_x_user_id", viewerId)
      .gte("read_at", weekAgo);
    postsThisWeek = count ?? 0;
  }

  let xFollowing = 0;
  let nativeFollowing = 0;
  if (viewerId) {
    const { data: follows } = await supabase
      .from("want_to_hear")
      .select("target_profile_id, profiles:target_profile_id(kind)")
      .eq("listener_x_user_id", viewerId);

    for (const row of follows ?? []) {
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (prof?.kind === "external_x") xFollowing += 1;
      else nativeFollowing += 1;
    }
  }

  return { postsThisWeek, xFollowing, nativeFollowing };
}

export async function loadExploreFeedSignals(postCount: number, authorCount: number): Promise<ExploreFeedSignals> {
  const supabase = createServiceRoleClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: listens }, { count: likes }, { count: comments }] = await Promise.all([
    supabase.from("text_read_events").select("*", { count: "exact", head: true }).gte("read_at", dayAgo),
    supabase.from("post_likes").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
    supabase.from("post_comments").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
  ]);

  return {
    creatorsPosting: authorCount,
    nativePosts: postCount,
    totalListens: listens ?? 0,
    totalInteractions: (likes ?? 0) + (comments ?? 0),
  };
}

export async function loadExplorePageExtras(
  viewerId: string | undefined,
  followedIds: Set<string>,
  postCount: number,
  authorCount: number,
) {
  const [topAudioposts, trendingCreators, recommendations, recentActivity, followedActive, stats, feedSignals] =
    await Promise.all([
      loadTopAudioposts(5),
      loadTrendingCreators(5),
      loadRecommendedProfiles(viewerId, followedIds, 4),
      loadRecentActivity(5),
      loadFollowedProfilesActive(viewerId),
      loadExploreSidebarStats(viewerId),
      loadExploreFeedSignals(postCount, authorCount),
    ]);

  const nowListeningCount = Math.max(12, feedSignals.totalListens + postCount * 3);

  return {
    topAudioposts,
    trendingCreators,
    recommendations,
    recentActivity,
    followedActive,
    stats,
    feedSignals,
    nowListeningCount,
  };
}

export type { TopAudiopostItem };
