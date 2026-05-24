"use client";

import type { RefObject } from "react";
import { FloatingListenPlayer } from "@/components/listen/floating-listen-player";
import { getAudiopostVoiceEngine } from "@/lib/voice/audiopost-voice-session";
import { audiopostCardClass, audiopostCardPadding, audiopostSectionLabelClass } from "@/components/app/audiopost-premium";
import { cn } from "@/lib/utils";

type Props = {
  linguetaAnchorRef: RefObject<HTMLDivElement | null>;
};

export function AudiopostNowPlayingShell({ linguetaAnchorRef }: Props) {
  return (
    <div className={cn(audiopostCardClass(), audiopostCardPadding, "flex h-full min-h-0 w-full flex-col")}>
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] pb-3">
        <p className={audiopostSectionLabelClass}>Now playing</p>
        <span className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Live · synced
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <FloatingListenPlayer
          variant="audiopost-card"
          linguetaAnchorRef={linguetaAnchorRef}
          getVoiceEngine={getAudiopostVoiceEngine}
          defaultPlaybackLanguage="original"
        />
      </div>
    </div>
  );
}
