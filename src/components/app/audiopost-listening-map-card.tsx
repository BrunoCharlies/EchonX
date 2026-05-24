"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { audiopostCardClass, audiopostCardPadding, audiopostSectionLabelClass } from "@/components/app/audiopost-premium";
import {
  barHeightsFromMinutes,
  formatTotalHours,
  loadWeeklyListening,
  type WeeklyListeningSnapshot,
} from "@/lib/listening/weekly-listening-stats";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_BAR = 72;
const WEEKLY_GOAL_MINUTES = 20 * 60;

/** Same on server and first client paint — real stats load after mount (localStorage). */
const EMPTY_STATS: WeeklyListeningSnapshot = {
  weekKey: "",
  minutesByDay: [0, 0, 0, 0, 0, 0, 0],
};

export function AudiopostListeningMapCard() {
  const [stats, setStats] = useState<WeeklyListeningSnapshot>(EMPTY_STATS);

  useEffect(() => {
    const refresh = () => setStats(loadWeeklyListening());
    refresh();
    window.addEventListener("echonx:listening-stats-updated", refresh);
    return () => window.removeEventListener("echonx:listening-stats-updated", refresh);
  }, []);

  const totalMinutes = stats.minutesByDay.reduce((a, b) => a + b, 0);
  const barHeights = barHeightsFromMinutes(stats.minutesByDay, MAX_BAR);
  const goalPct = Math.min(100, Math.round((totalMinutes / WEEKLY_GOAL_MINUTES) * 100));
  const dailyAvgMin = totalMinutes / 7;

  return (
    <div className={cn(audiopostCardClass(), audiopostCardPadding, "flex h-full min-h-0 flex-col overflow-y-auto")}>
      <div className="flex h-9 shrink-0 items-center justify-between">
        <p className={audiopostSectionLabelClass}>Listening map</p>
        <select
          className="h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-[11px] text-muted-foreground"
          defaultValue="week"
          aria-label="Listening period"
        >
          <option value="week">This week</option>
        </select>
      </div>

      <p className="mt-1 shrink-0 text-[28px] font-bold leading-none tracking-tight text-foreground">
        {formatTotalHours(stats.minutesByDay)}
      </p>
      <p className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" />
        {totalMinutes > 0 ? "This week" : "Start listening to fill the chart"}
      </p>

      <div className="mt-3 flex min-h-0 flex-1 items-end gap-3">
        <div className="flex min-w-0 flex-1 items-end justify-between gap-1.5 overflow-x-auto pb-0.5">
          {barHeights.map((height, i) => (
            <div key={DAYS[i]} className="flex shrink-0 flex-col items-center gap-1">
              <div
                className="w-2.5 min-h-[4px] rounded-full bg-primary shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-[height] duration-300"
                style={{ height: `${Math.max(4, height)}px` }}
                title={`${Math.round(stats.minutesByDay[i])} min`}
              />
              <span className="text-[9px] text-muted-foreground">{DAYS[i]}</span>
            </div>
          ))}
        </div>

        <div className="relative flex h-[72px] w-[72px] shrink-0 items-end justify-center self-end">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeDasharray={`${(goalPct / 100) * 264} 264`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-bold text-foreground">{goalPct}%</span>
            <span className="text-[9px] leading-tight text-muted-foreground">Weekly goal</span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid shrink-0 grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
        <div>
          <p className="text-xs font-semibold text-foreground">
            {dailyAvgMin < 60 ? `${Math.round(dailyAvgMin)}m` : `${Math.floor(dailyAvgMin / 60)}h ${Math.round(dailyAvgMin % 60)}m`}
          </p>
          <p className="text-[10px] text-muted-foreground">Daily avg</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">{Math.round(totalMinutes)}</p>
          <p className="text-[10px] text-muted-foreground">Total min</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">20h</p>
          <p className="text-[10px] text-muted-foreground">Goal</p>
        </div>
      </div>
    </div>
  );
}
