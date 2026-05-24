"use client";

import { RefreshCw, Search } from "lucide-react";
import { exploreCardClass, exploreInsetClass, explorePillActive } from "@/components/explore/explore-ui";
import { cn } from "@/lib/utils";

export type ExploreFeedFilter = "all" | "native" | "from_x" | "following";

export type ExploreToolbarLabels = {
  filterAll: string;
  filterNative: string;
  filterFromX: string;
  filterFollowing: string;
  newPostsBanner: string;
  refreshFeed: string;
  feedSearchPlaceholder: string;
};

type Props = {
  filter: ExploreFeedFilter;
  search: string;
  newPostsCount: number;
  isRefreshing?: boolean;
  onFilterChange: (f: ExploreFeedFilter) => void;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  labels: ExploreToolbarLabels;
};

export function ExploreFeedToolbar({
  filter,
  search,
  newPostsCount,
  isRefreshing = false,
  onFilterChange,
  onSearchChange,
  onRefresh,
  labels,
}: Props) {
  const tabs: { id: ExploreFeedFilter; label: string }[] = [
    { id: "all", label: labels.filterAll },
    { id: "native", label: labels.filterNative },
    { id: "from_x", label: labels.filterFromX },
    { id: "following", label: labels.filterFollowing },
  ];

  return (
    <div className="space-y-3">
      <div className={exploreCardClass("overflow-hidden p-3")}>
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(explorePillActive(filter === tab.id), "shrink-0")}
              onClick={() => onFilterChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {newPostsCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="flex items-center gap-2 font-medium text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {labels.newPostsBanner.replace("{count}", String(newPostsCount))}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-70"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            {labels.refreshFeed}
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          exploreInsetClass(
            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 shadow-none transition-[border-color,background-color] duration-200 focus-within:border-border/70 focus-within:bg-muted/40 dark:focus-within:border-white/[0.09] dark:focus-within:bg-white/[0.035]",
          ),
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={labels.feedSearchPlaceholder}
          className="h-7 w-full min-w-0 bg-transparent text-[13px] font-normal text-foreground/75 outline-none placeholder:text-muted-foreground/35 focus:text-foreground/90"
        />
      </div>
    </div>
  );
}
