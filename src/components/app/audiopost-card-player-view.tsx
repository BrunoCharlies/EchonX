"use client";

import type { RefObject } from "react";
import { createPortal } from "react-dom";
import {
  ListOrdered,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  UserRoundX,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { audiopostPlayBtnClass } from "@/components/app/audiopost-premium";
import { cn } from "@/lib/utils";
import type { ListenQueueItem } from "@/components/listen/listen-queue-provider";

function PremiumWaveform({ active }: { active: boolean }) {
  const bars = [22, 38, 55, 42, 68, 48, 82, 58, 36, 64, 78, 44, 72, 95, 52, 40, 66, 88, 50, 34, 76, 60, 45, 70];
  return (
    <div className="relative mx-auto h-14 w-full max-w-full overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.1),transparent_70%)]">
      <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-primary/20" />
      <div className="flex h-full items-end justify-center gap-0.5 px-3 pb-2 pt-2">
        {bars.map((height, index) => (
          <span
            key={index}
            className={cn(
              "w-0.5 rounded-full bg-primary/80",
              active ? "animate-pulse opacity-100" : "opacity-35",
            )}
            style={{
              height: `${Math.max(8, (height / 100) * 44)}px`,
              animationDelay: `${index * 45}ms`,
              animationDuration: `${600 + (index % 5) * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export type AudiopostCardPlayerViewProps = {
  items: ListenQueueItem[];
  head: ListenQueueItem | undefined;
  headDisplayBody?: string;
  headPostTime: string | null;
  statusLabel: string;
  isSpeaking: boolean;
  paused: boolean;
  playing: boolean;
  hasStoredQueue: boolean;
  queuePreview: ListenQueueItem[];
  rate: number;
  languageLabel: string;
  backgroundTrackLabel: string;
  playbackLanguage: string;
  playbackVoiceURI: string;
  voiceLanguage: string;
  compatibleVoices: Array<{ voiceURI: string; name: string; lang: string }>;
  selectedVoiceLabel: string;
  backgroundTrack: string;
  autoAdvance: boolean;
  autoListen: boolean;
  playbackMode: string;
  linguetaOpen: boolean;
  linguetaAnchorRef?: RefObject<HTMLElement | null>;
  languages: Array<{ value: string; label: string; shortLabel: string }>;
  backgroundTracks: Array<{ value: string; label: string; shortLabel: string }>;
  onPlay: () => void;
  onStop: () => void;
  onSkipPost: () => void;
  onSkipProfile: () => void;
  onPlayGeneral: () => void;
  onToggleLingueta: () => void;
  onCloseLingueta: () => void;
  onRateChange: (rate: number) => void;
  onLanguageChange: (lang: string) => void;
  onVoiceChange: (uri: string) => void;
  onBackgroundChange: (track: string) => void;
  onAutoAdvanceChange: (v: boolean) => void;
  onAutoListenChange: (v: boolean) => void;
  isPlaybackLanguage: (v: string) => boolean;
  isBackgroundTrack: (v: string) => boolean;
};

export function AudiopostCardPlayerView({
  items,
  head,
  headDisplayBody,
  headPostTime,
  isSpeaking,
  paused,
  playing,
  hasStoredQueue,
  queuePreview,
  rate,
  languageLabel,
  backgroundTrackLabel,
  playbackLanguage,
  playbackVoiceURI,
  voiceLanguage,
  compatibleVoices,
  backgroundTrack,
  autoAdvance,
  autoListen,
  playbackMode,
  linguetaOpen,
  linguetaAnchorRef,
  languages,
  backgroundTracks,
  onPlay,
  onStop,
  onSkipPost,
  onSkipProfile,
  onPlayGeneral,
  onToggleLingueta,
  onCloseLingueta,
  onRateChange,
  onLanguageChange,
  onVoiceChange,
  onBackgroundChange,
  onAutoAdvanceChange,
  onAutoListenChange,
  isBackgroundTrack,
}: AudiopostCardPlayerViewProps) {
  const chipClass =
    "h-7 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 text-[10px] font-medium hover:bg-white/[0.08]";
  const actionChipClass =
    "h-7 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 text-[10px] font-medium hover:bg-white/[0.08]";

  const lingueta =
    linguetaOpen && linguetaAnchorRef?.current
      ? createPortal(
          <div className="pointer-events-none absolute inset-0 z-20">
            <button
              type="button"
              className="pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              aria-label="Close options"
              onClick={onCloseLingueta}
            />
            <div className="pointer-events-auto absolute inset-x-3 bottom-full z-40 mb-3 flex max-h-[min(42vh,340px)] flex-col overflow-hidden rounded-[20px] border border-primary/20 bg-[rgba(10,14,20,0.95)] shadow-[0_-16px_48px_rgba(0,255,255,0.15)] backdrop-blur-[16px]">
              <div className="flex shrink-0 items-center justify-center py-2">
                <span className="h-1 w-12 rounded-full bg-primary/40" aria-hidden />
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-primary">Playback & queue</p>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onCloseLingueta}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="ghost" className="h-9 gap-1.5 text-xs" onClick={onSkipProfile} disabled={!hasStoredQueue}>
                    <UserRoundX className="h-3.5 w-3.5" />
                    Skip profile
                  </Button>
                  <Button
                    type="button"
                    variant={playbackMode === "general" ? "secondary" : "ghost"}
                    className="h-9 gap-1.5 text-xs"
                    onClick={onPlayGeneral}
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                    Timeline
                  </Button>
                  <Button type="button" variant="ghost" className="h-9 gap-1.5 text-xs" onClick={onSkipPost} disabled={!hasStoredQueue}>
                    <SkipForward className="h-3.5 w-3.5" />
                    Skip post
                  </Button>
                </div>
                <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <Label className="text-muted-foreground">Read in</Label>
                  <select
                    value={playbackLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="h-9 w-full rounded-xl border border-white/10 bg-background/80 px-3 text-xs"
                  >
                    {languages.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <Label className="text-muted-foreground">Voice</Label>
                  <select
                    value={playbackVoiceURI}
                    onChange={(e) => onVoiceChange(e.target.value)}
                    className="h-9 w-full rounded-xl border border-white/10 bg-background/80 px-3 text-xs"
                  >
                    <option value="auto">Auto ({voiceLanguage})</option>
                    {compatibleVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <Label className="text-muted-foreground">Background</Label>
                  <select
                    value={backgroundTrack}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (isBackgroundTrack(next)) onBackgroundChange(next);
                    }}
                    className="h-9 w-full rounded-xl border border-white/10 bg-background/80 px-3 text-xs"
                  >
                    {backgroundTracks.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Speed</span>
                    <span className="font-mono">{rate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={2}
                    step={0.1}
                    value={rate}
                    onChange={(e) => onRateChange(Number(e.target.value))}
                    className="h-1 w-full accent-primary"
                  />
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" checked={autoAdvance} onChange={(e) => onAutoAdvanceChange(e.target.checked)} />
                    Auto-advance
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" checked={autoListen} onChange={(e) => onAutoListenChange(e.target.checked)} />
                    Auto-listen
                  </label>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">Up next</p>
                  {queuePreview.length ? (
                    <ul className="space-y-1.5">
                      {queuePreview.map((item) => (
                        <li key={item.queueId} className="truncate text-xs text-muted-foreground">
                          <span className="text-foreground">@{item.authorUsername ?? "creator"}</span>
                          {item.body ? ` — ${item.body.slice(0, 56)}…` : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No posts waiting.</p>
                  )}
                </div>
              </div>
            </div>
          </div>,
          linguetaAnchorRef.current,
        )
      : null;

  return (
    <>
      <div className="audiopost-card-player relative flex min-h-0 flex-col pb-1 pt-1">
        {head ? (
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
              {(head.authorUsername ?? "Q").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">@{head.authorUsername ?? "creator"}</p>
              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                {(headDisplayBody ?? head.body ?? "No text.").slice(0, 64)}
              </p>
            </div>
          </div>
        ) : null}

        <div className={cn("shrink-0", head ? "mt-3" : "mt-1")}>
          <PremiumWaveform active={isSpeaking} />
        </div>

        <div className="mt-3 shrink-0">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all duration-300",
                isSpeaking ? "w-[38%]" : paused ? "w-[28%]" : "w-[18%]",
              )}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
            <span>{isSpeaking ? "04:32" : paused ? "Paused" : "00:00"}</span>
            <span>12:48</span>
          </div>
        </div>

        <div className="mt-3 shrink-0 pb-2">
          <div
            className="flex flex-wrap items-center justify-center gap-1.5"
            role="toolbar"
            aria-label="Playback controls"
          >
            <Button
              type="button"
              variant="ghost"
              className={actionChipClass}
              onClick={onSkipProfile}
              disabled={!hasStoredQueue}
            >
              <UserRoundX className="mr-1 inline h-3 w-3" />
              Skip profile
            </Button>
            <Button
              type="button"
              variant={playbackMode === "general" ? "secondary" : "ghost"}
              className={actionChipClass}
              onClick={onPlayGeneral}
            >
              <ListOrdered className="mr-1 inline h-3 w-3" />
              Timeline
            </Button>
            <Button type="button" variant="ghost" className={actionChipClass} onClick={onSkipPost} disabled={!hasStoredQueue}>
              <SkipForward className="mr-1 inline h-3 w-3" />
              Skip post
            </Button>
            <Button type="button" variant="ghost" className={chipClass} onClick={onToggleLingueta}>
              {rate.toFixed(1)}x
            </Button>
            <Button type="button" variant="ghost" className={chipClass} onClick={onToggleLingueta}>
              {languageLabel}
            </Button>
            <Button type="button" variant="ghost" className={chipClass} onClick={onToggleLingueta}>
              BG: {backgroundTrackLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04]"
              disabled
              aria-label="Previous post (not available)"
              title="Previous post is not available for X queue playback"
            >
              <SkipBack className="h-3.5 w-3.5 opacity-40" />
            </Button>
            <Button
              type="button"
              size="icon"
              className={audiopostPlayBtnClass}
              onClick={onPlay}
              aria-label={isSpeaking ? "Pause" : "Play"}
            >
              {isSpeaking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current pl-0.5" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04]"
              onClick={onSkipPost}
              disabled={!hasStoredQueue}
              aria-label="Next"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04]"
              onClick={onStop}
              disabled={!playing && !paused}
              aria-label="Stop"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04]"
              onClick={onToggleLingueta}
              aria-label="Volume and settings"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      {lingueta}
    </>
  );
}
