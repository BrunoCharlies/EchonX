"use client";

import Image from "next/image";
import Link from "next/link";
import { AudiopostPlayButton } from "@/components/explore/audiopost-play-button";
import { ExploreWaveform } from "@/components/explore/explore-waveform";
import { exploreCardClass, exploreInsetClass, exploreSectionTitleClass } from "@/components/explore/explore-ui";
import { WantToHearButton } from "@/components/profile/want-to-hear-button";
import type { ExploreRecommendation, ExploreTrendingCreator } from "@/lib/explore/load-explore-extras";
import type { TopAudiopostItem } from "@/lib/explore/load-top-audioposts";

type TopAudiopostWithListen = TopAudiopostItem & { canListenAudiopost: boolean };

export type ExploreRightOuterLabels = {
  nowListening: string;
  usersListeningNow: string;
  seeAllLive: string;
  trendingCreators: string;
  thisWeek: string;
  seeFullRanking: string;
  recommendations: string;
  profilesYouMayLike: string;
  mostListenedToday: string;
  listens: string;
  play: string;
  emptyTop: string;
  follow: string;
  following: string;
};

type Props = {
  nowListeningCount: number;
  topAudioposts: TopAudiopostWithListen[];
  trendingCreators: ExploreTrendingCreator[];
  recommendations: ExploreRecommendation[];
  followedIds: Set<string>;
  viewerId: string | undefined;
  labels: ExploreRightOuterLabels;
  listenBlockedMessage: string;
};

function formatListens(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/** Coluna direita externa: Now Listening, Trending, Recomendações, Top (mockup col. 4). */
export function ExploreRightOuterColumn({
  nowListeningCount,
  topAudioposts,
  trendingCreators,
  recommendations,
  followedIds,
  viewerId,
  labels,
  listenBlockedMessage,
}: Props) {
  const liveItems = topAudioposts.slice(0, 3);

  return (
    <aside className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-[76px] xl:max-h-[calc(100dvh-88px)] xl:self-start xl:overflow-y-auto">
      <div className={exploreCardClass("p-3.5")}>
        <div className="flex items-center justify-between gap-2">
          <p className={exploreSectionTitleClass()}>{labels.nowListening}</p>
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            LIVE
          </span>
        </div>
        <p className="mt-2 text-xl font-bold tabular-nums leading-tight">
          {nowListeningCount}
          <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">{labels.usersListeningNow}</span>
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {liveItems.map((item) => (
            <li
              key={item.postId}
              className={exploreInsetClass("flex items-center gap-2 rounded-lg px-2 py-1.5")}
            >
              <ExploreWaveform active className="h-5 max-w-[56px]" bars={10} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium">{item.excerpt.slice(0, 36)}…</p>
                <p className="truncate text-[9px] text-muted-foreground">@{item.authorUsername}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/app" className="mt-2 block text-center text-[10px] font-medium text-primary hover:underline">
          {labels.seeAllLive}
        </Link>
      </div>

      <div className={exploreCardClass("p-3.5")}>
        <div className="flex items-center justify-between gap-1">
          <p className={exploreSectionTitleClass()}>{labels.trendingCreators}</p>
          <span className="text-[9px] text-muted-foreground">{labels.thisWeek}</span>
        </div>
        <ol className="mt-2.5 space-y-2">
          {trendingCreators.map((creator, index) => (
            <li key={creator.id} className="flex items-center gap-2">
              <span className="w-3.5 shrink-0 text-center text-[10px] font-bold text-primary">{index + 1}</span>
              <Link
                href={`/u/${creator.username}`}
                className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-secondary"
              >
                {creator.avatarPath ? (
                  <Image src={creator.avatarPath} alt="" fill className="object-cover" sizes="28px" unoptimized />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[8px]">
                    {creator.displayName.slice(0, 2)}
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/u/${creator.username}`} className="block truncate text-xs font-medium hover:text-primary">
                  {creator.displayName}
                </Link>
                <p className="truncate text-[9px] text-muted-foreground">
                  @{creator.username} · {formatListens(creator.listenCount)}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/app/discover" className="mt-2 block text-center text-[10px] font-medium text-primary hover:underline">
          {labels.seeFullRanking}
        </Link>
      </div>

      <div className={exploreCardClass("p-3.5")}>
        <p className={exploreSectionTitleClass()}>{labels.recommendations}</p>
        <p className="mt-0.5 text-[9px] text-muted-foreground">{labels.profilesYouMayLike}</p>
        <ul className="mt-2 space-y-1.5">
          {recommendations.map((rec) => (
            <li key={rec.id} className={exploreInsetClass("flex items-center gap-2 rounded-lg px-2 py-1.5")}>
              <Link href={`/u/${rec.username}`} className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary">
                {rec.avatarPath ? (
                  <Image src={rec.avatarPath} alt="" fill className="object-cover" sizes="32px" unoptimized />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[9px]">{rec.displayName.slice(0, 2)}</span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{rec.displayName}</p>
                <p className="truncate text-[9px] text-muted-foreground">@{rec.username}</p>
              </div>
              <WantToHearButton
                profileId={rec.id}
                initialSubscribed={followedIds.has(rec.id)}
                isAuthenticated={!!viewerId}
                signInCallbackUrl="/app/explore"
                labelFollow={labels.follow}
                labelFollowing={labels.following}
                compact
              />
            </li>
          ))}
        </ul>
      </div>

      <div className={exploreCardClass("p-3.5")}>
        <p className={exploreSectionTitleClass()}>{labels.mostListenedToday}</p>
        <ol className="mt-2.5 space-y-1.5">
          {topAudioposts.length ? (
            topAudioposts.slice(0, 3).map((item, index) => (
              <li key={item.postId} className="flex gap-1.5 rounded-lg bg-muted/25 p-1.5 dark:bg-white/[0.02]">
                <span className="text-[10px] font-bold text-primary">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/u/${item.authorUsername}/p/${item.postId}`}
                    className="line-clamp-2 text-[10px] font-medium leading-snug hover:text-primary"
                  >
                    {item.excerpt}
                  </Link>
                  <p className="text-[9px] text-muted-foreground">
                    {item.playCount} {labels.listens}
                  </p>
                </div>
                <AudiopostPlayButton
                  postId={item.postId}
                  text={item.body}
                  ariaLabel={labels.play}
                  className="h-8 w-8"
                  listenAllowed={item.canListenAudiopost}
                  listenBlockedMessage={listenBlockedMessage}
                />
              </li>
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground">{labels.emptyTop}</p>
          )}
        </ol>
      </div>
    </aside>
  );
}
