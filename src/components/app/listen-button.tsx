"use client";

import { useState } from "react";
import { Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupertonicEngine } from "@/lib/voice/supertonic";

type Props = {
  text: string;
  /** When true, this post is eligible for automatic on-device queueing after the listener subscribed. */
  autoQueued?: boolean;
};

export function ListenButton({ text, autoQueued = false }: Props) {
  const [busy, setBusy] = useState(false);

  async function play() {
    setBusy(true);
    try {
      const engine = await createSupertonicEngine();
      await engine.warmUp();
      await engine.speak(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" size="sm" className="gap-2" onClick={play} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
        {busy ? "Preparing voice…" : "Listen"}
      </Button>
      <span className="text-[10px] text-muted-foreground">
        {autoQueued
          ? "New since you subscribed · eligible for automatic Supertonic queue"
          : "Older post · manual listen only (business rule)"}
      </span>
    </div>
  );
}
