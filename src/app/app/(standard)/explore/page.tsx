import { auth } from "@/auth";
import { ExplorePageShell } from "@/components/explore/explore-page-shell";
import type { ExploreFeedPost } from "@/components/explore/explore-feed-post-card";
import { type PostCommentItem } from "@/components/profile/post-comments";
import {
  audiopostListenBlockedMessage,
  canListenToAudiopostAuthorWithPlan,
  loadUserEntitlement,
} from "@/lib/billing/entitlements";
import { loadExploreFeedPosts } from "@/lib/explore/load-feed";
import { loadExplorePageExtras } from "@/lib/explore/load-explore-extras";
import { loadTopAudioposts } from "@/lib/explore/load-top-audioposts";
import type { TopAudiopostItem } from "@/lib/explore/load-top-audioposts";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import type { PlanTier } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getViewerFollowedProfileIds } from "@/server/actions/listen";

export const dynamic = "force-dynamic";

type FeedPost = Awaited<ReturnType<typeof loadExploreFeedPosts>>[number];

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default async function AppExplorePage() {
  const session = await auth();
  const viewerId = session?.user.id;
  const supabase = await createClient();
  const t = await getServerDictionary();
  const locale = await getServerLocale();

  const { data: myProfile } = viewerId
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_path, kind, created_at")
        .eq("id", viewerId)
        .maybeSingle()
    : { data: null };

  const postsRaw = await loadExploreFeedPosts(50);
  const postIds = postsRaw.map((post) => post.id);
  const authorIds = [...new Set(postsRaw.map((post) => post.author_id))];
  const authorCount = authorIds.length;
  const followedProfileIds = await getViewerFollowedProfileIds(authorIds);

  let effectivePlan: PlanTier = "free";
  if (viewerId) {
    const service = createServiceRoleClient();
    const entitlement = await loadUserEntitlement(service, viewerId);
    effectivePlan = entitlement.effectivePlan;
  }
  const listenBlockedMessage = audiopostListenBlockedMessage(effectivePlan);

  function canListenAuthor(author: {
    kind: string | null;
    owner_x_user_id?: string | null;
    username?: string | null;
  }) {
    return canListenToAudiopostAuthorWithPlan(
      {
        kind: author.kind,
        owner_x_user_id: author.owner_x_user_id ?? null,
        username: author.username ?? null,
      },
      effectivePlan,
    );
  }

  const [rankedListens, extras] = await Promise.all([
    loadTopAudioposts(100),
    loadExplorePageExtras(viewerId, followedProfileIds, postsRaw.length, authorCount),
  ]);
  const listenByPost = new Map(rankedListens.map((r) => [r.postId, r.playCount]));

  let comments: PostCommentItem[] = [];
  if (postIds.length) {
    const { data: commentRows, error: commentsErr } = await supabase
      .from("post_comments")
      .select("id, post_id, parent_comment_id, body, like_count, created_at, profiles:author_profile_id(username, display_name, avatar_path)")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    if (!commentsErr) {
      comments = (commentRows ?? []).map((comment) => ({
        id: comment.id,
        post_id: comment.post_id,
        parent_comment_id: comment.parent_comment_id,
        body: comment.body,
        like_count: comment.like_count,
        created_at: comment.created_at,
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
      }));
    }
  }

  const likedPosts = new Set<string>();
  if (viewerId && postIds.length) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .in("post_id", postIds)
      .eq("liker_x_user_id", viewerId);
    likes?.forEach((like) => likedPosts.add(like.post_id));
  }

  const posts = postsRaw
    .map((post: FeedPost): ExploreFeedPost | null => {
      const author = post.profiles;
      if (!author) return null;
      return {
        id: post.id,
        authorId: post.author_id,
        body: post.body,
        imagePaths: post.image_paths ?? [],
        likeCount: post.like_count ?? 0,
        externalSource: post.external_source,
        moderationPayload: post.moderation_payload ?? null,
        createdAt: post.created_at,
        author: {
          id: author.id,
          username: author.username,
          displayName: author.display_name ?? author.username,
          avatarPath: author.avatar_path,
          kind: author.kind,
          ownerXUserId: author.owner_x_user_id,
        },
        liked: likedPosts.has(post.id),
        isFollowing: followedProfileIds.has(author.id),
        isOwnPost: !!viewerId && (viewerId === author.id || viewerId === author.owner_x_user_id),
        comments: comments.filter((c) => c.post_id === post.id),
        listenCount: listenByPost.get(post.id) ?? 0,
        canListenAudiopost: canListenAuthor(author),
        listenBlockedMessage,
      };
    })
    .filter((p): p is ExploreFeedPost => p !== null);

  type TopWithListen = TopAudiopostItem & { canListenAudiopost: boolean };
  const topAudioposts: TopWithListen[] = extras.topAudioposts.map((item) => ({
    ...item,
    canListenAudiopost: canListenAuthor({
      kind: item.authorKind,
      owner_x_user_id: item.authorOwnerXUserId,
      username: item.authorUsername,
    }),
  }));

  const e = t.explore;
  const profile = {
    username: myProfile?.username ?? null,
    displayName: myProfile?.display_name ?? session?.user.name ?? e.yourProfile,
    bio: myProfile?.bio ?? null,
    avatarPath: myProfile?.avatar_path ?? null,
    initials: initials(myProfile?.display_name ?? session?.user.name ?? "EX"),
  };

  return (
    <div className="min-h-0 xl:min-h-[calc(100dvh-72px)]">
      <ExplorePageShell
        profile={profile}
        posts={posts}
        stats={extras.stats}
        followedActive={extras.followedActive}
        followedIds={[...followedProfileIds]}
        topAudioposts={topAudioposts}
        listenBlockedMessage={listenBlockedMessage}
        trendingCreators={extras.trendingCreators}
        recommendations={extras.recommendations}
        recentActivity={extras.recentActivity}
        feedSignals={extras.feedSignals}
        nowListeningCount={extras.nowListeningCount}
        viewerId={viewerId}
        locale={locale}
        leftLabels={{
          quickStats: e.quickStats,
          minutesToday: e.minutesToday,
          postsThisWeek: e.postsThisWeek,
          profilesFollowing: e.profilesFollowing,
          yourActiveProfiles: e.yourActiveProfiles,
          seeAll: e.seeAll,
          listeningNow: e.listeningNow,
          paused: e.paused,
          newPosts: e.newPostsBadge,
          quickActions: e.quickActions,
          quickActionsBody: e.quickActionsBody,
          startAudiopost: e.startAudiopost,
          recordDraft: e.recordDraft,
          viewPublicProfile: e.viewPublicProfile,
          statusOnline: e.statusOnline,
          statusListening: e.statusListening,
        }}
        rightInnerLabels={{
          feedSignals: e.feedSignals,
          last24h: e.last24h,
          creatorsPosting: e.creatorsPosting,
          nativePosts: e.nativePostsShown,
          audiopostsListened: e.audiopostsListened,
          totalInteractions: e.totalInteractions,
          seeFullDashboard: e.seeFullDashboard,
          recentActivity: e.recentActivity,
          seeAllActivity: e.seeAllActivity,
        }}
        rightOuterLabels={{
          nowListening: e.nowListening,
          usersListeningNow: e.usersListeningNow,
          seeAllLive: e.seeAllLive,
          trendingCreators: e.trendingCreators,
          thisWeek: e.thisWeek,
          seeFullRanking: e.seeFullRanking,
          recommendations: e.recommendations,
          profilesYouMayLike: e.profilesYouMayLike,
          mostListenedToday: e.mostListenedToday,
          listens: e.topAudiopostsListens,
          play: e.topAudiopostsPlay,
          emptyTop: e.topAudiopostsEmpty,
          follow: e.follow,
          following: e.following,
        }}
        toolbarLabels={{
          filterAll: e.filterAll,
          filterNative: e.filterNative,
          filterFromX: e.filterFromX,
          filterFollowing: e.filterFollowing,
          newPostsBanner: e.newPostsBanner,
          refreshFeed: e.refreshFeed,
          feedSearchPlaceholder: e.feedSearchPlaceholder,
        }}
        feedLabels={{
          startPost: e.startPost,
          createNewPost: e.createNewPost,
          feedTitle: e.feedTitle,
          feedSubtitle: e.feedSubtitle,
          posts: e.posts,
          noPosts: e.noPosts,
          noPostsBody: e.noPostsBody,
        }}
        postLabels={{
          follow: e.follow,
          following: e.following,
          native: e.native,
          play: e.topAudiopostsPlay,
          listenCount: e.listenCountLabel,
        }}
      />
    </div>
  );
}
