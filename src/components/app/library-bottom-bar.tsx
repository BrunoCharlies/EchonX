"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  DEFAULT_LIBRARY_BAR_VOLUME,
  useAudiopostLibrary,
} from "@/contexts/audiopost-library-context";
import { audiopostPlayBtnClass } from "@/components/app/audiopost-premium";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  AUDIOPOST_BOTTOM_BAR_HEIGHT_PX,
  AUDIOPOST_BOTTOM_BAR_LIFT_PX,
} from "@/components/app/audiopost-bottom-bar-layout";
import {
  isLibraryReadingLanguage,
  LIBRARY_BAR_SPEED_MAX,
  LIBRARY_BAR_SPEED_MIN,
  LIBRARY_BAR_SPEED_STEP,
  LIBRARY_READING_LANGUAGES,
} from "@/lib/voice/library-playback-settings";
import { LibraryQuotaStrip } from "@/components/app/library-quota-strip";

export function LibraryBottomBar({
  onPlayPause,
  onSkipBack,
  onSkipForward,
}: {
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
}) {
  const {
    playback,
    libraryBarVolume,
    setLibraryBarVolume,
    libraryBarRate,
    setLibraryBarRate,
    libraryBarLanguage,
    setLibraryBarLanguage,
  } = useAudiopostLibrary();
  const volumeBeforeMuteRef = useRef(libraryBarVolume > 0 ? libraryBarVolume : DEFAULT_LIBRARY_BAR_VOLUME);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsPanelId = useId();
  const isPlaying = playback.readerState === "playing";
  const isMuted = libraryBarVolume === 0;
  const volumePercent = Math.round(libraryBarVolume * 100);
  const languageLabel =
    LIBRARY_READING_LANGUAGES.find((language) => language.value === libraryBarLanguage)?.shortLabel ?? "Auto";

  const toggleMute = () => {
    if (isMuted) {
      const restore = volumeBeforeMuteRef.current > 0 ? volumeBeforeMuteRef.current : DEFAULT_LIBRARY_BAR_VOLUME;
      setLibraryBarVolume(restore);
      return;
    }
    volumeBeforeMuteRef.current = libraryBarVolume > 0 ? libraryBarVolume : DEFAULT_LIBRARY_BAR_VOLUME;
    setLibraryBarVolume(0);
  };

  useEffect(() => {
    if (!settingsOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (settingsRef.current?.contains(event.target as Node)) return;
      setSettingsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [settingsOpen]);

  return (
    <div
      className="fixed left-[var(--app-sidebar-width,232px)] right-0 z-40 border-t border-white/[0.06] bg-[rgba(10,14,20,0.92)] backdrop-blur-[16px]"
      style={{ bottom: AUDIOPOST_BOTTOM_BAR_LIFT_PX }}
    >
      <div className="mx-auto max-w-[1400px] px-5 pt-1.5">
        <LibraryQuotaStrip />
      </div>
      <div
        className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 pb-1"
        style={{ height: AUDIOPOST_BOTTOM_BAR_HEIGHT_PX }}
      >
        <div className="flex min-w-0 max-w-[260px] flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold text-primary">
            {playback.title.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{playback.title}</p>
            <p
              className={cn(
                "truncate text-xs",
                playback.error ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {playback.error ?? playback.preview ?? playback.author ?? "Library reading"}
            </p>
          </div>
        </div>

        <div className="hidden flex-1 flex-col items-center justify-center gap-1 sm:flex">
          <div className="flex h-4 w-[240px] items-end justify-center gap-px opacity-90">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-0.5 rounded-full bg-primary/70",
                  isPlaying && i % 3 === 0 ? "h-3" : "h-1.5",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Previous"
              disabled={!playback.canControl}
              onClick={onSkipBack}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              className={cn(audiopostPlayBtnClass, "h-14 w-14 -translate-y-0.5")}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={!playback.canControl && playback.readerState === "empty"}
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Next"
              disabled={!playback.canControl}
              onClick={onSkipForward}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden min-w-[2.5rem] text-right text-xs font-mono text-muted-foreground sm:inline">
            {libraryBarRate.toFixed(1)}x
          </span>
          <div ref={settingsRef} className="relative">
            <Button
              type="button"
              variant={settingsOpen ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9"
              aria-label="Reading settings"
              aria-expanded={settingsOpen}
              aria-controls={settingsPanelId}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            {settingsOpen ? (
              <div
                id={settingsPanelId}
                role="dialog"
                aria-label="Library reading settings"
                className="absolute bottom-full right-0 z-50 mb-2 w-56 rounded-xl border border-white/10 bg-[#0c1219] p-3 shadow-xl shadow-black/40"
              >
                <p className="mb-2 text-xs font-semibold text-foreground">Reading settings</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px] text-muted-foreground">Speed</Label>
                      <span className="font-mono text-[11px] text-foreground">{libraryBarRate.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={LIBRARY_BAR_SPEED_MIN}
                      max={LIBRARY_BAR_SPEED_MAX}
                      step={LIBRARY_BAR_SPEED_STEP}
                      value={libraryBarRate}
                      onChange={(event) => setLibraryBarRate(Number(event.target.value))}
                      className="h-1 w-full cursor-pointer accent-primary"
                      aria-label="Reading speed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Voice language</Label>
                    <select
                      value={libraryBarLanguage}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (isLibraryReadingLanguage(next)) setLibraryBarLanguage(next);
                      }}
                      className="h-8 w-full rounded-md border border-white/10 bg-background/80 px-2 text-xs text-foreground outline-none ring-primary/30 focus:ring-2"
                    >
                      {LIBRARY_READING_LANGUAGES.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      Auto picks a voice from the text. Changes apply on the next segment.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <span className="hidden text-[10px] text-muted-foreground sm:inline">{languageLabel}</span>
          <div className="flex items-center gap-1.5" role="group" aria-label="Library player volume">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute library player" : "Mute library player"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volumePercent}
              onChange={(event) => {
                const next = Number(event.target.value) / 100;
                if (next > 0) volumeBeforeMuteRef.current = next;
                setLibraryBarVolume(next);
              }}
              className="h-1 w-16 cursor-pointer accent-primary sm:w-20"
              aria-label="Library player volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volumePercent}
              aria-valuetext={`${volumePercent}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
