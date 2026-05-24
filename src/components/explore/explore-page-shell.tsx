"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { ExploreFeedLive } from "@/components/profile/explore-feed-live";
import { refreshExploreFeed } from "@/server/actions/explore-feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ExploreFeedPostCard,
  type ExploreFeedPost,
  type ExplorePostLabels,
} from "@/components/explore/explore-feed-post-card";
import {
  ExploreFeedToolbar,
  type ExploreFeedFilter,
  type ExploreToolbarLabels,
} from "@/components/explore/explore-feed-toolbar";
import { ExploreLeftSidebar, type ExploreLeftLabels } from "@/components/explore/explore-left-sidebar";
import { ExploreRightInnerColumn, type ExploreRightInnerLabels } from "@/components/explore/explore-right-inner-column";
import { ExploreRightOuterColumn, type ExploreRightOuterLabels } from "@/components/explore/explore-right-outer-column";
import { exploreCardClass } from "@/components/explore/explore-ui";
import { NewPostPanel } from "@/components/profile/new-post-panel";
import type {
  ExploreActivityItem,
  ExploreFeedSignals,
  ExploreFollowedActive,
  ExploreRecommendation,
  ExploreSidebarStats,
  ExploreTrendingCreator,
} from "@/lib/explore/load-explore-extras";
import type { TopAudiopostItem } from "@/lib/explore/load-top-audioposts";

type TopAudiopostWithListen = TopAudiopostItem & { canListenAudiopost: boolean };

type Profile = {
  username: string | null;
  displayName: string;
  bio: string | null;
  avatarPath: string | null;
  initials: string;
};

type FeedLabels = {
  startPost: string;
  createNewPost: string;
  feedTitle: string;
  feedSubtitle: string;
  posts: string;
  noPosts: string;
  noPostsBody: string;
};

type Props = {
  profile: Profile;
  posts: ExploreFeedPost[];
  stats: ExploreSidebarStats;
  followedActive: ExploreFollowedActive[];
  followedIds: string[];
  topAudioposts: TopAudiopostWithListen[];
  trendingCreators: ExploreTrendingCreator[];
  recommendations: ExploreRecommendation[];
  recentActivity: ExploreActivityItem[];
  feedSignals: ExploreFeedSignals;
  nowListeningCount: number;
  viewerId: string | undefined;
  locale: string;
  leftLabels: ExploreLeftLabels;
  rightInnerLabels: ExploreRightInnerLabels;
  rightOuterLabels: ExploreRightOuterLabels;
  toolbarLabels: ExploreToolbarLabels;
  feedLabels: FeedLabels;
  postLabels: ExplorePostLabels;
  listenBlockedMessage: string;
};

export function ExplorePageShell({
  profile,
  posts,
  stats,
  followedActive,
  followedIds,
  topAudioposts,
  trendingCreators,
  recommendations,
  recentActivity,
  feedSignals,
  nowListeningCount,
  viewerId,
  locale,
  leftLabels,
  rightInnerLabels,
  rightOuterLabels,
  toolbarLabels,
  feedLabels,
  postLabels,
  listenBlockedMessage,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<ExploreFeedFilter>("all");
  const [search, setSearch] = useState("");
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);
  const [feedSeenAt, setFeedSeenAt] = useState(() => Date.now());
  const [pendingRealtime, setPendingRealtime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const postsSignatureBeforeRefresh = useRef("");
  const followedSet = useMemo(() => new Set(followedIds), [followedIds]);

  const onRealtimePost = useCallback(() => {
    setPendingRealtime((n) => n + 1);
  }, []);

  const newPostsCount = useMemo(() => {
    const unseenInFeed = posts.filter((p) => new Date(p.createdAt).getTime() > feedSeenAt).length;
    return unseenInFeed + pendingRealtime;
  }, [posts, feedSeenAt, pendingRealtime]);

  const postsSignature = useMemo(() => posts.map((p) => p.id).join(","), [posts]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    postsSignatureBeforeRefresh.current = postsSignature;
    try {
      await refreshExploreFeed();
      router.refresh();
    } catch {
      setIsRefreshing(false);
    }
  }, [isRefreshing, postsSignature, router]);

  useEffect(() => {
    if (!isRefreshing) return;
    if (postsSignature === postsSignatureBeforeRefresh.current) return;
    setFeedSeenAt(Date.now());
    setPendingRealtime(0);
    setIsRefreshing(false);
    postsSignatureBeforeRefresh.current = postsSignature;
  }, [postsSignature, isRefreshing]);

  useEffect(() => {
    if (!isRefreshing) return;
    const timeout = window.setTimeout(() => setIsRefreshing(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [isRefreshing]);

  const filtered = useMemo(() => {
    let list = [...posts];
    const q = search.trim().toLowerCase();

    if (filter === "native") {
      list = list.filter((p) => p.author.kind !== "external_x" && !p.externalSource);
    } else if (filter === "from_x") {
      list = list.filter((p) => p.author.kind === "external_x" || !!p.externalSource);
    } else if (filter === "following") {
      list = list.filter((p) => followedSet.has(p.author.id));
    }

    if (q) {
      list = list.filter(
        (p) =>
          p.body.toLowerCase().includes(q) ||
          p.author.username.toLowerCase().includes(q) ||
          p.author.displayName.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list;
  }, [posts, filter, search, followedSet]);

  return (
    <>
    <ExploreFeedLive onNewPost={onRealtimePost} />
    <div
      className={[
        "mx-auto grid min-h-[calc(100dvh-72px)] w-full max-w-[1520px] gap-3",
        "grid-cols-1",
        /* 4 colunas: esquerda | feed (largura limitada) | signals (estreita) | direita */
        "xl:grid-cols-[minmax(220px,252px)_minmax(360px,500px)_minmax(168px,192px)_minmax(240px,272px)]",
        "xl:justify-center xl:gap-3.5",
        "2xl:grid-cols-[260px_520px_200px_280px] 2xl:gap-4",
      ].join(" ")}
    >
      <ExploreLeftSidebar profile={profile} stats={stats} followedActive={followedActive} labels={leftLabels} />

      <main className="flex min-w-0 w-full max-w-[500px] flex-col gap-3 justify-self-center xl:max-w-none xl:justify-self-stretch">
        <ExploreFeedToolbar
          filter={filter}
          search={search}
          newPostsCount={newPostsCount}
          isRefreshing={isRefreshing}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          onRefresh={() => void handleRefresh()}
          labels={toolbarLabels}
        />

        <div className={exploreCardClass("p-4")}>
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 bg-secondary">
              {profile.avatarPath ? <AvatarImage src={profile.avatarPath} alt="" /> : null}
              <AvatarFallback>{profile.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{feedLabels.startPost}</p>
            </div>
            <span className="hidden items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
              <PenLine className="h-3.5 w-3.5" />
              {feedLabels.createNewPost}
            </span>
          </div>
          <div className="mt-3">
            <NewPostPanel />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{feedLabels.feedTitle}</h1>
            <p className="text-xs text-muted-foreground">{feedLabels.feedSubtitle}</p>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {filtered.length} {feedLabels.posts}
          </span>
        </div>

        <div className="space-y-4">
          {filtered.length ? (
            filtered.map((post) => (
              <ExploreFeedPostCard
                key={post.id}
                post={post}
                locale={locale}
                viewerId={viewerId}
                playingPostId={playingPostId}
                onPlayingChange={setPlayingPostId}
                labels={postLabels}
              />
            ))
          ) : (
            <div className={exploreCardClass("p-8 text-center")}>
              <p className="font-medium">{feedLabels.noPosts}</p>
              <p className="mt-1 text-sm text-muted-foreground">{feedLabels.noPostsBody}</p>
            </div>
          )}
        </div>
      </main>

      <ExploreRightInnerColumn
        feedSignals={feedSignals}
        recentActivity={recentActivity}
        labels={rightInnerLabels}
        locale={locale}
      />

      <ExploreRightOuterColumn
        listenBlockedMessage={listenBlockedMessage}
        nowListeningCount={nowListeningCount}
        topAudioposts={topAudioposts}
        trendingCreators={trendingCreators}
        recommendations={recommendations}
        followedIds={followedSet}
        viewerId={viewerId}
        labels={rightOuterLabels}
      />
    </div>
    </>
  );
}
