"use client";

import { cn } from "@/lib/utils";

type Props = {
  active?: boolean;
  bars?: number;
  className?: string;
};

export function ExploreWaveform({ active = false, bars = 28, className }: Props) {
  return (
    <div className={cn("flex h-9 min-w-0 flex-1 items-end gap-[2px]", className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const base = 28 + ((i * 7) % 5) * 14;
        return (
          <span
            key={i}
            className={cn(
              "w-[3px] shrink-0 rounded-full bg-primary/70 transition-opacity",
              active && "animate-explore-wave",
            )}
            style={{
              height: `${base}%`,
              animationDelay: active ? `${(i % 8) * 0.07}s` : undefined,
              opacity: active ? 1 : 0.45,
            }}
          />
        );
      })}
    </div>
  );
}
