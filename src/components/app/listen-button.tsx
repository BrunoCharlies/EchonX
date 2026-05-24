"use client";

import { useState } from "react";
import { Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareMirroredPostForSpeech } from "@/lib/voice/speech-text";
import { claimVoicePlayback, getSharedVoiceEngine, releaseVoicePlayback } from "@/lib/voice/voice-session";
import { logTextReadEvent } from "@/server/actions/listening-queue";

type Props = {
  text: string;
  postId?: string;
  /** When true, this post is eligible for automatic on-device queueing after the listener subscribed. */
  autoQueued?: boolean;
  /** When false, Listen is disabled (e.g. Free plan on custom X posts). */
  listenAllowed?: boolean;
  listenBlockedMessage?: string;
};

export function ListenButton({
  text,
  postId,
  autoQueued = false,
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

      await claimVoicePlayback("post-listen");
      const engine = await getSharedVoiceEngine();
      await engine.warmUp();
      await engine.speak(speechText);
      if (postId) {
        try {
          await logTextReadEvent(postId, speechText.length);
        } catch (error) {
          console.warn("[listen-button] could not log read event", error);
        }
      }
    } finally {
      releaseVoicePlayback("post-listen");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" size="sm" className="gap-2" onClick={play} disabled={busy || !listenAllowed}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
        {busy ? "Preparing voice…" : "Listen"}
      </Button>
      <span className="text-[10px] text-muted-foreground">
        {!listenAllowed
          ? (listenBlockedMessage ?? "Upgrade your plan to listen to X profiles.")
          : autoQueued
            ? "New since you subscribed · eligible for automatic audio queue"
            : "Older post · manual listen only (business rule)"}
      </span>
    </div>
  );
}
