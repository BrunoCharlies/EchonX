"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prepareMirroredPostForSpeech } from "@/lib/voice/speech-text";
import { claimVoicePlayback, getSharedVoiceEngine, releaseVoicePlayback } from "@/lib/voice/voice-session";
import { logTextReadEvent } from "@/server/actions/listening-queue";

type Props = {
  postId: string;
  text: string;
  className?: string;
  ariaLabel?: string;
  onPlayStart?: () => void;
  listenAllowed?: boolean;
  listenBlockedMessage?: string;
};

export function AudiopostPlayButton({
  postId,
  text,
  className,
  ariaLabel = "Play",
  onPlayStart,
  listenAllowed = true,
  listenBlockedMessage,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function play() {
    if (!listenAllowed) return;
    setBusy(true);
    try {
      const speechText = prepareMirroredPostForSpeech(text);
      if (!speechText.trim()) return;

      onPlayStart?.();
      await claimVoicePlayback("post-listen");
      const engine = await getSharedVoiceEngine();
      await engine.warmUp();
      await engine.speak(speechText);
      try {
        await logTextReadEvent(postId, speechText.length);
      } catch (error) {
        console.warn("[audiopost-play] could not log read event", error);
      }
    } finally {
      releaseVoicePlayback("post-listen");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("h-9 w-9 shrink-0 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20", className)}
        onClick={() => void play()}
        disabled={busy || !listenAllowed}
        aria-label={ariaLabel}
        title={!listenAllowed ? (listenBlockedMessage ?? "Upgrade to listen") : undefined}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
      </Button>
    </div>
  );
}
