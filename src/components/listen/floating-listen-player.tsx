"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, SkipForward, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createSupertonicEngine } from "@/lib/voice/supertonic";
import type { ListenQueueItem } from "@/components/listen/listen-queue-provider";
import { useListenQueue } from "@/components/listen/listen-queue-provider";
import { consumeQueueRow, logTextReadEvent } from "@/server/actions/listening-queue";

/**
 * Premium floating player: play/pause, skip, speaking rate, Zen dimming, and optional auto-advance.
 */
export function FloatingListenPlayer() {
  const { items, refresh } = useListenQueue();
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [zen, setZen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const stopRef = useRef(false);
  const rateRef = useRef(rate);
  const autoRef = useRef(autoAdvance);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);
  useEffect(() => {
    autoRef.current = autoAdvance;
  }, [autoAdvance]);

  useEffect(() => {
    document.documentElement.classList.toggle("echonx-zen", zen);
    return () => document.documentElement.classList.remove("echonx-zen");
  }, [zen]);

  const fetchQueue = useCallback(async () => {
    const res = await fetch("/api/listening/queue", { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: ListenQueueItem[] };
    return json.items ?? [];
  }, []);

  const playOne = useCallback(
    async (head: ListenQueueItem) => {
      const engine = await createSupertonicEngine();
      await engine.warmUp();
      await engine.speak(head.body, { rate: rateRef.current });
      if (stopRef.current) return;
      await logTextReadEvent(head.postId, head.body.length);
      await consumeQueueRow(head.queueId);
      await refresh();
    },
    [refresh],
  );

  const runQueueLoop = useCallback(async () => {
    stopRef.current = false;
    setPlaying(true);
    try {
      while (!stopRef.current) {
        const q = await fetchQueue();
        if (!q.length) break;
        const head = q[0];
        await playOne(head);
        if (!autoRef.current) break;
      }
    } finally {
      setPlaying(false);
    }
  }, [fetchQueue, playOne]);

  async function togglePlay() {
    if (playing) {
      stopRef.current = true;
      const engine = await createSupertonicEngine();
      await engine.stop();
      setPlaying(false);
      return;
    }
    const q = items.length ? items : await fetchQueue();
    if (!q.length) return;
    if (autoAdvance) {
      await runQueueLoop();
    } else {
      stopRef.current = false;
      setPlaying(true);
      try {
        await playOne(q[0]);
      } finally {
        setPlaying(false);
      }
    }
  }

  async function skip() {
    stopRef.current = true;
    const engine = await createSupertonicEngine();
    await engine.stop();
    const q = items.length ? items : await fetchQueue();
    if (!q.length) return;
    await consumeQueueRow(q[0].queueId);
    await refresh();
    setPlaying(false);
  }

  const head = items[0];

  return (
    <div
      className={cn(
        "floating-listen-player fixed bottom-4 right-4 z-[60] w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-2xl shadow-primary/10 backdrop-blur-xl",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs font-semibold tracking-wide">Supertonic queue</p>
            <p className="text-[11px] text-muted-foreground">
              {items.length ? `${items.length} waiting` : "You are all caught up"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Less" : "More"}
        </Button>
      </div>

      <div className="space-y-3 px-4 py-3">
        {head ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">@{head.authorUsername ?? "creator"}</span> — {head.body}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">New posts from profiles you follow will appear here automatically.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="gap-1" onClick={() => void togglePlay()} disabled={!playing && items.length === 0}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => void skip()} disabled={items.length === 0}>
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
          <Button size="sm" variant={zen ? "secondary" : "ghost"} onClick={() => setZen((z) => !z)}>
            <Headphones className="mr-1 h-4 w-4" />
            Zen
          </Button>
        </div>

        {expanded ? (
          <div className="space-y-3 border-t border-border/50 pt-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-muted-foreground">Speed</Label>
              <span className="text-xs font-mono text-foreground">{rate.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={2}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
              Auto-advance the queue when each post finishes
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
