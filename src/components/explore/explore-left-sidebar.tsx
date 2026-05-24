"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Headphones, Mic, Radio, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { exploreCardClass, exploreSectionTitleClass } from "@/components/explore/explore-ui";
import { loadWeeklyListening } from "@/lib/listening/weekly-listening-stats";
import type { ExploreFollowedActive, ExploreSidebarStats } from "@/lib/explore/load-explore-extras";
import { cn } from "@/lib/utils";

export type ExploreLeftLabels = {
  quickStats: string;
  minutesToday: string;
  postsThisWeek: string;
  profilesFollowing: string;
  yourActiveProfiles: string;
  seeAll: string;
  listeningNow: string;
  paused: string;
  newPosts: string;
  quickActions: string;
  quickActionsBody: string;
  startAudiopost: string;
  recordDraft: string;
  viewPublicProfile: string;
  statusOnline: string;
  statusListening: string;
};

type Profile = {
  username: string | null;
  displayName: string;
  bio: string | null;
  avatarPath: string | null;
  initials: string;
};

type Props = {
  profile: Profile;
  stats: ExploreSidebarStats;
  followedActive: ExploreFollowedActive[];
  labels: ExploreLeftLabels;
};

export function ExploreLeftSidebar({ profile, stats, followedActive, labels }: Props) {
  const [minutesToday, setMinutesToday] = useState(0);

  useEffect(() => {
    const data = loadWeeklyListening();
    const idx = new Date().getDay();
    const dayIndex = idx === 0 ? 6 : idx - 1;
    setMinutesToday(Math.round(data.minutesByDay[dayIndex] ?? 0));
  }, []);

  const profileHref = profile.username ? `/u/${profile.username}` : "/app/onboarding";
  const isListening = minutesToday > 0;
  const statusLabel = isListening ? labels.statusListening : labels.statusOnline;

  return (
    <aside className="flex min-h-0 min-w-0 flex-col xl:sticky xl:top-[76px] xl:h-[calc(100dvh-88px)] xl:max-h-[calc(100dvh-88px)] xl:self-start">
      {/* Card quadrado fixo — não rola com a coluna */}
      <div className="z-10 shrink-0 pb-3">
        <Link
          href={profileHref}
          className={cn(
            exploreCardClass(
              "relative flex aspect-square w-full flex-col overflow-hidden p-0 transition-colors hover:border-primary/35",
            ),
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.22),transparent_55%),linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--card))_100%)]" />
          <div className="relative flex flex-1 flex-col items-center justify-center px-3 pt-4">
            <div className="relative">
              <Avatar className="h-[4.5rem] w-[4.5rem] border-[3px] border-background shadow-[0_0_24px_hsl(var(--primary)/0.15)] sm:h-20 sm:w-20">
                {profile.avatarPath ? <AvatarImage src={profile.avatarPath} alt="" className="object-cover" /> : null}
                <AvatarFallback className="text-lg">{profile.initials}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                  isListening ? "bg-primary shadow-[0_0_8px_rgba(0,255,255,0.6)]" : "bg-emerald-400",
                )}
                aria-hidden
              />
            </div>
          </div>
          <div className="relative shrink-0 space-y-1.5 px-3 pb-3 pt-1 text-center">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{profile.displayName}</p>
            <p className="truncate text-[11px] text-muted-foreground">@{profile.username ?? "profile"}</p>
            {profile.bio ? (
              <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground/90">{profile.bio}</p>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                isListening ? "bg-primary/15 text-primary" : "bg-emerald-500/15 text-emerald-400",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isListening ? "animate-pulse bg-primary" : "bg-emerald-400",
                )}
              />
              {statusLabel}
            </span>
          </div>
        </Link>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
      <div className={exploreCardClass("p-4")}>
        <p className={exploreSectionTitleClass()}>{labels.quickStats}</p>
        <ul className="mt-3 space-y-2.5 text-sm">
          <li className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 dark:bg-white/[0.03]">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              {labels.minutesToday}
            </span>
            <span className="font-semibold tabular-nums">{minutesToday} min</span>
          </li>
          <li className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 dark:bg-white/[0.03]">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Headphones className="h-4 w-4 text-primary" />
              {labels.postsThisWeek}
            </span>
            <span className="font-semibold tabular-nums">{stats.postsThisWeek}</span>
          </li>
          <li className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 dark:bg-white/[0.03]">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              {labels.profilesFollowing}
            </span>
            <span className="text-right text-xs font-semibold leading-tight">
              {stats.xFollowing} X + {stats.nativeFollowing} Nativos
            </span>
          </li>
        </ul>
      </div>

      <div className={exploreCardClass("p-4")}>
        <div className="flex items-center justify-between gap-2">
          <p className={exploreSectionTitleClass()}>{labels.yourActiveProfiles}</p>
          <Link href="/app" className="text-[10px] font-medium text-primary hover:underline">
            {labels.seeAll}
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {followedActive.length ? (
            followedActive.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/u/${item.username}`}
                  className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/20 px-2.5 py-2 transition-colors hover:bg-muted/40 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary">
                    {item.avatarPath ? (
                      <Image src={item.avatarPath} alt="" fill className="object-cover" sizes="36px" unoptimized />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] font-medium">
                        {item.displayName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                        item.listeningNow ? "bg-emerald-400" : "bg-muted-foreground/50",
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.displayName}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      @{item.username} · {item.listeningNow ? labels.listeningNow : labels.paused}
                    </span>
                  </span>
                  {item.newPosts > 0 ? (
                    <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {item.newPosts} {labels.newPosts}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </ul>
      </div>

      <div className={exploreCardClass("p-4")}>
        <p className={exploreSectionTitleClass()}>{labels.quickActions}</p>
        <p className="mt-1 text-xs text-muted-foreground">{labels.quickActionsBody}</p>
        <Button className="mt-3 w-full gap-2 shadow-[0_0_20px_rgba(0,255,255,0.2)]" asChild>
          <Link href="/app">
            <Radio className="h-4 w-4" />
            {labels.startAudiopost}
          </Link>
        </Button>
        <Button variant="outline" className="mt-2 w-full gap-2 border-white/10" asChild>
          <Link href={profile.username ? `/u/${profile.username}` : "/app/onboarding"}>
            <Mic className="h-4 w-4" />
            {labels.recordDraft}
          </Link>
        </Button>
      </div>
      </div>
    </aside>
  );
}
