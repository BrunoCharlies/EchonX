"use client";

import Link from "next/link";
import { Activity, Headphones, Radio, Sparkles, TrendingUp, Users } from "lucide-react";
import { exploreCardClass, exploreInsetClass, exploreSectionTitleClass } from "@/components/explore/explore-ui";
import type { ExploreActivityItem, ExploreFeedSignals } from "@/lib/explore/load-explore-extras";
import { cn } from "@/lib/utils";

export type ExploreRightInnerLabels = {
  feedSignals: string;
  last24h: string;
  creatorsPosting: string;
  nativePosts: string;
  audiopostsListened: string;
  totalInteractions: string;
  seeFullDashboard: string;
  recentActivity: string;
  seeAllActivity: string;
};

type Props = {
  feedSignals: ExploreFeedSignals;
  recentActivity: ExploreActivityItem[];
  labels: ExploreRightInnerLabels;
  locale: string;
  className?: string;
};

function formatRelative(iso: string, locale: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return locale.startsWith("pt") ? "agora" : "just now";
  if (min < 60) return locale.startsWith("pt") ? `${min} min` : `${min}m`;
  const h = Math.floor(min / 60);
  return locale.startsWith("pt") ? `${h}h` : `${h}h`;
}

/** Coluna estreita junto ao feed: Feed Signals + Atividade recente (mockup col. 3). */
export function ExploreRightInnerColumn({ feedSignals, recentActivity, labels, locale, className }: Props) {
  const metrics = [
    { label: labels.creatorsPosting, value: feedSignals.creatorsPosting, icon: Users },
    { label: labels.nativePosts, value: feedSignals.nativePosts, icon: Radio },
    { label: labels.audiopostsListened, value: feedSignals.totalListens, icon: Headphones },
    { label: labels.totalInteractions, value: feedSignals.totalInteractions, icon: TrendingUp },
  ];

  return (
    <aside
      className={cn(
        "flex min-w-0 flex-col gap-3 max-xl:overflow-visible xl:sticky xl:top-[76px] xl:max-h-[calc(100dvh-88px)] xl:self-start xl:overflow-y-auto xl:overscroll-y-auto",
        className,
      )}
    >
      <div className={exploreCardClass("p-3")}>
        <p className={cn(exploreSectionTitleClass(), "flex items-center gap-1 text-[10px]")}>
          <Sparkles className="h-3 w-3 shrink-0 text-primary" />
          <span className="truncate">{labels.feedSignals}</span>
        </p>
        <p className="mt-0.5 text-[9px] text-muted-foreground">{labels.last24h}</p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {metrics.map((cell) => (
            <div
              key={cell.label}
              className={exploreInsetClass("rounded-lg px-1.5 py-2 text-center")}
            >
              <cell.icon className="mx-auto h-3.5 w-3.5 text-primary" />
              <p className="mt-0.5 text-base font-bold leading-none tabular-nums">{cell.value}</p>
              <p className="mt-1 text-[8px] leading-tight text-muted-foreground">{cell.label}</p>
            </div>
          ))}
        </div>
        <Link href="/admin" className="mt-2 block text-center text-[9px] font-medium text-primary hover:underline">
          {labels.seeFullDashboard}
        </Link>
      </div>

      <div className={exploreCardClass("p-3")}>
        <div className="flex items-center justify-between gap-1">
          <p className={cn(exploreSectionTitleClass(), "flex items-center gap-1 text-[10px]")}>
            <Activity className="h-3 w-3 shrink-0 text-primary" />
            <span className="truncate">{labels.recentActivity}</span>
          </p>
          <span className="shrink-0 text-[9px] text-primary">{labels.seeAllActivity}</span>
        </div>
        <ul className="mt-2 space-y-2">
          {recentActivity.map((item) => (
            <li key={item.id} className="border-b border-border/40 pb-2 last:border-0 last:pb-0 dark:border-white/[0.05]">
              <p className="text-[10px] leading-snug text-foreground/90">
                <span className="font-medium text-primary">@{item.actorUsername}</span>{" "}
                {item.type === "like"
                  ? locale.startsWith("pt")
                    ? "curtiu"
                    : "liked"
                  : locale.startsWith("pt")
                    ? "comentou"
                    : "commented"}
              </p>
              <p className="line-clamp-2 text-[9px] text-muted-foreground">{item.targetLabel}</p>
              <p className="mt-0.5 text-[8px] text-muted-foreground/80">{formatRelative(item.createdAt, locale)}</p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
